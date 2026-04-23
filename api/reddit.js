/**
 * Reddit community signal agent
 * Uses web search (via Claude's web_search tool) to find r/berkeley posts
 * about candidate courses. Returns dated snippets, not raw sentiment scores.
 */

import Anthropic from '@anthropic-ai/sdk'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { courses } = req.body
  if (!courses?.length) return res.status(200).json({})

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    // Process in batches of 10 courses per Claude call to stay efficient
    const results = {}
    const batches = chunk(courses, 10)

    for (const batch of batches) {
      const courseList = batch.map(c => `${c.courseCode}: ${c.title}`).join('\n')

      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        tools: [{
          type: 'web_search_20250305',
          name: 'web_search',
        }],
        system: `You are a UC Berkeley student research assistant. 
Search Reddit (r/berkeley, r/UCBerkeley) for student opinions about specific courses.
For each course, find 1-2 relevant Reddit posts or comments.
Return ONLY valid JSON. Never reproduce long quotes — paraphrase into 1 sentence max.`,
        messages: [{
          role: 'user',
          content: `Search Reddit for student opinions on these UC Berkeley courses:

${courseList}

For each course, search "site:reddit.com/r/berkeley [COURSE CODE]" and find recent posts.

Return JSON:
{
  "COURSE CODE": {
    "snippets": [
      {
        "snippet": "one sentence paraphrase of community opinion",
        "date": "approximate date like 'Fall 2024' or 'Spring 2023'",
        "sentiment": 0.7
      }
    ],
    "sentiment": 0.6
  }
}

sentiment is -1 (very negative) to 1 (very positive). 
Return {} for courses with no Reddit discussion found.
Only include courses from the input list.`
        }]
      })

      // Extract the final JSON from the response
      const textContent = response.content
        .filter(b => b.type === 'text')
        .map(b => b.text)
        .join('')

      try {
        const jsonMatch = textContent.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          Object.assign(results, parsed)
        }
      } catch {
        // Non-fatal parse error — skip this batch
      }

      // Small delay between batches
      if (batches.indexOf(batch) < batches.length - 1) {
        await sleep(300)
      }
    }

    res.status(200).json(results)
  } catch (err) {
    console.error('reddit error:', err)
    // Non-fatal — return empty
    res.status(200).json({})
  }
}

function chunk(arr, size) {
  const chunks = []
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size))
  return chunks
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}
