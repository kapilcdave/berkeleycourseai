/**
 * Fetches grade distribution and GPA data from Berkeleytime
 * Uses Berkeleytime's GraphQL API (publicly accessible)
 */

const BT_GRAPHQL = 'https://berkeleytime.com/api/graphql'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { courseCodes } = req.body
  if (!courseCodes) return res.status(400).json({ error: 'courseCodes required' })

  const codes = courseCodes.split(',').map(c => c.trim()).filter(Boolean)
  if (codes.length === 0) return res.status(200).json({})

  try {
    // Berkeleytime GraphQL - fetch grade data per course
    // Batch in groups of 20 to avoid overwhelming the API
    const results = {}
    const batches = chunk(codes, 20)

    for (const batch of batches) {
      const batchResults = await Promise.allSettled(
        batch.map(code => fetchCourseGrades(code))
      )
      for (let i = 0; i < batch.length; i++) {
        if (batchResults[i].status === 'fulfilled' && batchResults[i].value) {
          results[batch[i]] = batchResults[i].value
        }
      }
      // Small delay between batches
      if (batches.length > 1) await sleep(200)
    }

    res.status(200).json(results)
  } catch (err) {
    console.error('berkeleytime error:', err)
    res.status(500).json({ error: err.message })
  }
}

async function fetchCourseGrades(courseCode) {
  const [subject, number] = courseCode.split(' ')
  if (!subject || !number) return null

  const query = `
    query CourseGrades($abbreviation: String!, $courseNumber: String!) {
      allCourses(abbreviation: $abbreviation, courseNumber: $courseNumber) {
        edges {
          node {
            id
            title
            abbreviation
            courseNumber
            gradeAverage
            letterAverage
            openSeats
            enrolledMax
            allGrades: gradeSet {
              edges {
                node {
                  average
                  letterGrade
                  distribution {
                    percent
                    letter
                  }
                }
              }
            }
          }
        }
      }
    }
  `

  try {
    const res = await fetch(BT_GRAPHQL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'BearCourses/1.0',
        'Referer': 'https://berkeleytime.com',
      },
      body: JSON.stringify({
        query,
        variables: { abbreviation: subject, courseNumber: number },
      }),
    })

    if (!res.ok) return null
    const data = await res.json()

    const course = data?.data?.allCourses?.edges?.[0]?.node
    if (!course) return null

    const grades = course.allGrades?.edges ?? []
    const mostRecent = grades[0]?.node

    return {
      avgGpa: course.gradeAverage ?? mostRecent?.average ?? null,
      letterAvg: course.letterAverage ?? mostRecent?.letterGrade ?? null,
      distribution: mostRecent?.distribution ?? null,
      openSeats: course.openSeats,
      enrolledMax: course.enrolledMax,
      slug: `${subject.toLowerCase()}-${number}`,
    }
  } catch {
    return null
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
