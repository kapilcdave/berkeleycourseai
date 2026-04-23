import Anthropic from '@anthropic-ai/sdk'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { major, catalogYear } = req.body
  if (!major) return res.status(400).json({ error: 'major required' })

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    // Use Claude with web search to find authoritative requirements
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      tools: [{
        type: 'web_search_20250305',
        name: 'web_search',
      }],
      system: `You are a UC Berkeley academic requirements researcher. 
Search for and extract EXACT degree requirements for the given major and catalog year.
Check guide.berkeley.edu first, then department websites.
Return ONLY valid JSON with no markdown.`,
      messages: [{
        role: 'user',
        content: `Find the complete degree requirements for UC Berkeley major: "${major}" catalog year: "${catalogYear ?? 'current'}".

Search guide.berkeley.edu and the department page. Look for:
1. All required courses (with course codes)
2. Breadth/distribution requirements
3. Any requirement changes noted for this catalog year
4. Which courses can double-count between major and breadth

Return this JSON structure:
{
  "major": "",
  "catalogYear": "",
  "source": "URL where found",
  "confidence": "high|medium|low",
  "requirements": {
    "RequirementName": {
      "description": "",
      "eligibleCourses": ["CS 61A", "CS 61B"],
      "eligibleSubjects": ["CS", "EE"],
      "unitsRequired": 4,
      "canDoubleCount": true
    }
  },
  "unmet": {
    "RequirementName": ["eligible", "course", "codes"]
  },
  "notes": "any important caveats or recent changes"
}`
      }]
    })

    // Extract the final text response
    const fullText = response.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('')

    const clean = fullText.replace(/```json|```/g, '').trim()

    // Find JSON in the response
    const jsonMatch = clean.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON found in requirements response')

    const parsed = JSON.parse(jsonMatch[0])
    res.status(200).json(parsed)
  } catch (err) {
    console.error('requirements error:', err)
    res.status(500).json({ error: err.message })
  }
}
