/**
 * Fetches current semester course offerings from classes.berkeley.edu
 * Uses the Schedule of Classes JSON API
 */

// Berkeley's Schedule of Classes API term codes
const TERM_MAP = {
  'Spring 2025': '2252',
  'Fall 2025':   '2258',
  'Spring 2026': '2262',
  'Summer 2026': '2265',
  'Fall 2026':   '2268',
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { semester } = req.body
  const termId = TERM_MAP[semester] ?? TERM_MAP['Spring 2026']

  try {
    // Berkeley's SIS Class API — publicly accessible
    // Fetches all subjects first, then batch-fetches classes
    const subjectsUrl = `https://classes.berkeley.edu/search/classes/${termId}?format=json`

    const subjectsRes = await fetch(subjectsUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; BearCourses/1.0)',
      },
    })

    let courses = []

    if (subjectsRes.ok) {
      const data = await subjectsRes.json()
      courses = normalizeBerkeleyClasses(data)
    } else {
      // Fallback: use the public Berkeleytime API which has course listings
      const btRes = await fetch(
        `https://berkeleytime.com/api/catalog/catalog_json/?semester=${encodeURIComponent(semester ?? 'Spring 2026')}`,
        { headers: { 'User-Agent': 'BearCourses/1.0' } }
      )
      if (btRes.ok) {
        const btData = await btRes.json()
        courses = normalizeBerkeleyTime(btData)
      }
    }

    res.status(200).json(courses)
  } catch (err) {
    console.error('courses error:', err)
    res.status(500).json({ error: err.message })
  }
}

function normalizeBerkeleyClasses(raw) {
  if (!Array.isArray(raw)) return []
  return raw.map(c => ({
    courseCode: `${c.subjectArea?.trim() ?? ''} ${c.catalogNumber?.trim() ?? ''}`.trim(),
    subject: c.subjectArea?.trim(),
    catalogNumber: c.catalogNumber?.trim(),
    title: c.title ?? c.displayName ?? '',
    description: c.description ?? '',
    units: c.units?.valueHigh ?? c.units?.valueLow ?? 3,
    instructor: c.instructors?.[0]?.name ?? null,
    time: formatTime(c.meetings?.[0]),
    section: c.sectionNumber ?? '001',
    ccn: c.id,
    enrollmentStatus: c.enrollmentStatus,
    location: c.meetings?.[0]?.location ?? null,
  })).filter(c => c.courseCode.trim().length > 0)
}

function normalizeBerkeleyTime(raw) {
  // Berkeleytime catalog format
  const courses = raw?.courses ?? raw ?? []
  if (!Array.isArray(courses)) return []
  return courses.map(c => ({
    courseCode: `${c.abbreviation ?? ''} ${c.course_number ?? ''}`.trim(),
    subject: c.abbreviation,
    catalogNumber: c.course_number,
    title: c.title ?? '',
    description: c.description ?? '',
    units: parseInt(c.units) || 3,
    instructor: c.instructor ?? null,
    time: c.time ?? null,
    section: c.section_number ?? '001',
    ccn: c.id,
  })).filter(c => c.courseCode.trim().length > 2)
}

function formatTime(meeting) {
  if (!meeting) return null
  const days = meeting.days ?? ''
  const start = meeting.startTime ?? ''
  const end = meeting.endTime ?? ''
  if (!days && !start) return null
  return `${days} ${start}–${end}`.trim()
}
