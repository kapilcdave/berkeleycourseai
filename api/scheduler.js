/**
 * Checks candidate courses against the student's current CalCentral schedule
 * Uses the session cookie to authenticate against CalCentral's internal API
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { calcentralCookie, candidates } = req.body

  // Use env var if available, fallback to request body (for user-provided cookie)
  const cookie = process.env.CALCENTRAL_SESSION_COOKIE || calcentralCookie
  if (!cookie) return res.status(200).json({}) // graceful skip

  try {
    // Fetch the student's current enrollment from CalCentral
    const scheduleRes = await fetch(
      'https://calcentral.berkeley.edu/api/my/academics/tele_bear_appointments',
      {
        headers: {
          'Cookie': cookie.startsWith('_calcentral_session=') ? cookie : `_calcentral_session=${cookie}`,
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; BearCourses/1.0)',
          'Referer': 'https://calcentral.berkeley.edu',
          'X-Requested-With': 'XMLHttpRequest',
        },
      }
    )

    // Also fetch class schedule
    const classRes = await fetch(
      'https://calcentral.berkeley.edu/api/my/academics/class_enrollments',
      {
        headers: {
          'Cookie': cookie.startsWith('_calcentral_session=') ? cookie : `_calcentral_session=${cookie}`,
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; BearCourses/1.0)',
          'Referer': 'https://calcentral.berkeley.edu',
          'X-Requested-With': 'XMLHttpRequest',
        },
      }
    )

    let enrolledMeetings = []

    if (classRes.ok) {
      const classData = await classRes.json()
      // Extract meeting times from enrolled classes
      const enrollments = classData?.enrollmentData?.enrollments ?? []
      for (const enrollment of enrollments) {
        const meetings = enrollment?.classSections?.flatMap(s => s.meetings ?? []) ?? []
        enrolledMeetings.push(...meetings.map(m => ({
          days: m.meetsDays ?? m.days ?? '',
          startTime: m.startTime ?? m.start_time ?? '',
          endTime: m.endTime ?? m.end_time ?? '',
        })))
      }
    }

    // Build conflict map for each candidate
    const conflictMap = {}
    for (const candidate of (candidates ?? [])) {
      if (!candidate.time) {
        conflictMap[candidate.courseCode] = false
        continue
      }
      const hasConflict = checkTimeConflict(candidate.time, enrolledMeetings)
      conflictMap[candidate.courseCode] = hasConflict
    }

    res.status(200).json(conflictMap)
  } catch (err) {
    console.error('scheduler error:', err)
    // Non-fatal — return empty conflict map
    res.status(200).json({})
  }
}

/**
 * Parse a time string like "MWF 10:00–11:00" or "TuTh 14:00–15:30"
 * and check it against an array of enrolled meeting objects
 */
function checkTimeConflict(timeStr, enrolledMeetings) {
  const parsed = parseTimeString(timeStr)
  if (!parsed) return false

  for (const meeting of enrolledMeetings) {
    const existing = parseTimeFromMeeting(meeting)
    if (!existing) continue

    // Check day overlap
    const dayOverlap = parsed.days.some(d => existing.days.includes(d))
    if (!dayOverlap) continue

    // Check time overlap
    if (timesOverlap(parsed.start, parsed.end, existing.start, existing.end)) {
      return true
    }
  }
  return false
}

function parseTimeString(str) {
  if (!str) return null
  // Formats: "MWF 10:00–11:00", "TuTh 2:00-3:30 PM", "MW 14:00-15:30"
  const match = str.match(/([A-Za-z]+)\s+(\d{1,2}:\d{2})\s*[–-]\s*(\d{1,2}:\d{2})\s*(AM|PM)?/i)
  if (!match) return null

  const [, daysStr, startRaw, endRaw, ampm] = match
  const days = parseDays(daysStr)
  const start = parseMinutes(startRaw, ampm)
  const end = parseMinutes(endRaw, ampm)

  return { days, start, end }
}

function parseTimeFromMeeting(meeting) {
  const { days: daysStr, startTime, endTime } = meeting
  if (!daysStr || !startTime) return null
  const days = parseDays(daysStr)
  const start = parseMinutes(startTime, null)
  const end = parseMinutes(endTime, null)
  return { days, start, end }
}

function parseDays(str) {
  const dayMap = {
    'Mo': 'M', 'Tu': 'T', 'We': 'W', 'Th': 'R', 'Fr': 'F',
    'M': 'M', 'T': 'T', 'W': 'W', 'R': 'R', 'F': 'F',
    'MWF': ['M', 'W', 'F'], 'TuTh': ['T', 'R'], 'TTh': ['T', 'R'],
    'MW': ['M', 'W'],
  }
  if (dayMap[str] && Array.isArray(dayMap[str])) return dayMap[str]
  if (dayMap[str]) return [dayMap[str]]

  // Parse character by character
  const result = []
  let i = 0
  while (i < str.length) {
    if (str[i] === 'T' && str[i + 1] === 'h') { result.push('R'); i += 2 }
    else if (str[i] === 'T' && str[i + 1] === 'u') { result.push('T'); i += 2 }
    else if (str[i] === 'M') { result.push('M'); i++ }
    else if (str[i] === 'W') { result.push('W'); i++ }
    else if (str[i] === 'F') { result.push('F'); i++ }
    else i++
  }
  return result
}

function parseMinutes(timeStr, ampm) {
  if (!timeStr) return 0
  const [h, m] = timeStr.split(':').map(Number)
  let hours = h
  if (ampm?.toUpperCase() === 'PM' && h < 12) hours += 12
  if (ampm?.toUpperCase() === 'AM' && h === 12) hours = 0
  // 24h: treat anything < 8 as PM (heuristic for class times)
  if (!ampm && hours < 8) hours += 12
  return hours * 60 + (m || 0)
}

function timesOverlap(s1, e1, s2, e2) {
  return s1 < e2 && e1 > s2
}
