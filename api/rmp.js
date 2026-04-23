/**
 * Fetches professor ratings from RateMyProfessors
 * Uses RMP's public GraphQL API
 */

const RMP_GRAPHQL = 'https://www.ratemyprofessors.com/graphql'
const UCB_SCHOOL_ID = 'U2Nob29sLTEyMg==' // Base64 encoded Berkeley school ID

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { professors } = req.body
  if (!professors) return res.status(200).json({})

  const profNames = professors.split(',').map(p => p.trim()).filter(Boolean)
  if (profNames.length === 0) return res.status(200).json({})

  try {
    const results = {}

    // RMP rate limits — process with small delay
    for (const name of profNames) {
      try {
        const data = await fetchProfessor(name)
        if (data) results[name] = data
        await sleep(100)
      } catch {
        // Non-fatal — just skip this professor
      }
    }

    res.status(200).json(results)
  } catch (err) {
    console.error('rmp error:', err)
    res.status(500).json({ error: err.message })
  }
}

async function fetchProfessor(name) {
  // First: search for professor at UC Berkeley
  const searchQuery = `
    query TeacherSearchQuery($text: String!, $schoolID: ID!) {
      newSearch {
        teachers(query: { text: $text, schoolID: $schoolID }) {
          edges {
            node {
              id
              firstName
              lastName
              avgRating
              avgDifficulty
              wouldTakeAgainPercent
              numRatings
              department
              teacherRatingTags {
                tagName
                tagCount
              }
              ratings(first: 3) {
                edges {
                  node {
                    comment
                    date
                    qualityRating
                    difficultyRating
                    wouldTakeAgain
                    class
                  }
                }
              }
            }
          }
        }
      }
    }
  `

  const res = await fetch(RMP_GRAPHQL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Basic dGVzdDp0ZXN0', // RMP public basic auth
      'User-Agent': 'Mozilla/5.0 (compatible; BearCourses/1.0)',
      'Referer': 'https://www.ratemyprofessors.com',
      'Origin': 'https://www.ratemyprofessors.com',
    },
    body: JSON.stringify({
      query: searchQuery,
      variables: { text: name, schoolID: UCB_SCHOOL_ID },
    }),
  })

  if (!res.ok) return null

  const data = await res.json()
  const teachers = data?.data?.newSearch?.teachers?.edges ?? []
  if (teachers.length === 0) return null

  // Pick the best match (first result, highest numRatings at Berkeley)
  const teacher = teachers
    .map(e => e.node)
    .sort((a, b) => (b.numRatings ?? 0) - (a.numRatings ?? 0))[0]

  if (!teacher) return null

  const topTags = (teacher.teacherRatingTags ?? [])
    .sort((a, b) => b.tagCount - a.tagCount)
    .slice(0, 5)
    .map(t => t.tagName)

  return {
    rating: teacher.avgRating,
    difficulty: teacher.avgDifficulty,
    wouldTakeAgain: teacher.wouldTakeAgainPercent,
    numRatings: teacher.numRatings,
    department: teacher.department,
    tags: topTags,
  }
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}
