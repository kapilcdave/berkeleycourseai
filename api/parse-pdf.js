import Anthropic from '@anthropic-ai/sdk'
import formidable from 'formidable'
import fs from 'fs'
import pdfParse from 'pdf-parse'

export const config = { api: { bodyParser: false } }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  try {
    // Parse multipart form
    const form = formidable({ maxFileSize: 10 * 1024 * 1024 })
    const [fields, files] = await form.parse(req)
    const pdfFile = Array.isArray(files.pdf) ? files.pdf[0] : files.pdf
    const major = Array.isArray(fields.major) ? fields.major[0] : fields.major

    if (!pdfFile) return res.status(400).json({ error: 'No PDF uploaded' })

    // Extract text from PDF
    const pdfBuffer = fs.readFileSync(pdfFile.filepath)
    const pdfData = await pdfParse(pdfBuffer)
    const rawText = pdfData.text

    // Use Claude to parse the degree progress text
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: `You are a UC Berkeley degree progress parser. Extract structured data from CalCentral degree progress PDF text.
Return ONLY valid JSON with no markdown or preamble.`,
      messages: [{
        role: 'user',
        content: `Parse this CalCentral degree progress PDF text for a student with intended major: "${major}"

Extract:
1. completedCourses: array of course codes (e.g. ["CS 61A", "MATH 1A"])
2. catalogYear: string (e.g. "2022-23")  
3. major: string (cleaned major name)
4. completedUnits: number
5. unmetRequirements: object mapping requirement categories to arrays of eligible course codes/subjects
   - Include L&S breadth requirements still needed
   - Include major requirements still needed
   - Mark which can double-count

Return format:
{
  "completedCourses": [],
  "catalogYear": "",
  "major": "",
  "completedUnits": 0,
  "unmetRequirements": {
    "Arts & Literature": ["MUSIC", "ART", "THEATER", ...],
    "Biological Science": ["BIO", "MCELLBI", ...],
    "...": [...]
  },
  "doubleCounts": ["RequirementA + RequirementB for COURSE X"]
}

PDF TEXT:
${rawText.slice(0, 8000)}`
      }]
    })

    const content = response.content[0].text
    // Strip any accidental markdown fences
    const clean = content.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)

    res.status(200).json(parsed)
  } catch (err) {
    console.error('parse-pdf error:', err)
    res.status(500).json({ error: err.message })
  }
}
