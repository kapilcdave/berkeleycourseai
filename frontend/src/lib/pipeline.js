/**
 * BearCourses Pipeline Orchestrator
 * Tiered parallel execution: parse → filter → enrich → score
 */

const API = (path) => `/api/${path}`

export async function runPipeline({
  pdfFile,
  major,
  targetUnits,
  semester,
  calcentralCookie,
  onAgentUpdate,
  onProfileParsed,
}) {
  // ─── TIER 0: Parse PDF ───────────────────────────────────────────────────
  onAgentUpdate('parse-pdf', { status: 'running', message: 'Extracting degree progress data...' })

  const pdfFormData = new FormData()
  pdfFormData.append('pdf', pdfFile)
  pdfFormData.append('major', major)

  let profile
  try {
    const res = await fetch(API('parse-pdf'), { method: 'POST', body: pdfFormData })
    if (!res.ok) throw await toPipelineError(res, 'We could not parse that PDF yet.')
    profile = await res.json()
    onAgentUpdate('parse-pdf', {
      status: 'done',
      message: `Found ${profile.completedCourses.length} completed courses`,
      count: profile.completedCourses.length,
    })
    onProfileParsed(profile)
  } catch (err) {
    onAgentUpdate('parse-pdf', {
      status: err.silent ? 'skipped' : 'error',
      message: err.message,
    })
    throw err
  }

  // ─── TIER 1: Requirements + Course Catalog (parallel) ────────────────────
  onAgentUpdate('requirements', { status: 'running', message: `Searching requirements for ${major}...` })
  onAgentUpdate('courses', { status: 'running', message: `Fetching ${semester} offerings...` })

  const [reqsResult, coursesResult] = await Promise.allSettled([
    fetchRequirements({ major, catalogYear: profile.catalogYear }),
    fetchCourses({ semester }),
  ])

  let requirementMap = {}
  if (reqsResult.status === 'fulfilled') {
    requirementMap = reqsResult.value
    onAgentUpdate('requirements', {
      status: 'done',
      message: `${Object.keys(requirementMap.unmet ?? {}).length} unmet requirements mapped`,
      count: Object.keys(requirementMap.requirements ?? {}).length,
    })
  } else {
    onAgentUpdate('requirements', { status: 'error', message: reqsResult.reason?.message })
    requirementMap = { requirements: {}, unmet: profile.unmetRequirements ?? {} }
  }

  let allCourses = []
  if (coursesResult.status === 'fulfilled') {
    allCourses = coursesResult.value
    onAgentUpdate('courses', {
      status: 'done',
      message: `${allCourses.length} courses this semester`,
      count: allCourses.length,
    })
  } else {
    onAgentUpdate('courses', { status: 'error', message: coursesResult.reason?.message })
    throw new Error('Course catalog fetch failed — cannot continue')
  }

  // ─── ORCHESTRATOR: Build candidate list + double-count map ───────────────
  const { candidates, doubleCounts } = buildCandidateList({
    allCourses,
    requirementMap,
    completedCourses: profile.completedCourses,
  })

  onAgentUpdate('courses', {
    candidateCount: candidates.length,
    doubleCountCount: doubleCounts.length,
  })

  // ─── TIER 2: Enrichment (all parallel, on candidates only) ───────────────
  const courseCodesParam = candidates.map(c => c.courseCode).join(',')
  const professorsParam = [...new Set(candidates.map(c => c.instructor).filter(Boolean))].join(',')

  onAgentUpdate('berkeleytime', { status: 'running', message: `Fetching grade data for ${candidates.length} courses...` })
  onAgentUpdate('rmp', { status: 'running', message: `Looking up ${new Set(candidates.map(c => c.instructor)).size} professors...` })
  onAgentUpdate('scheduler', { status: calcentralCookie ? 'running' : 'skipped', message: calcentralCookie ? 'Checking your schedule...' : 'No session cookie — skipping' })
  onAgentUpdate('reddit', { status: 'running', message: 'Searching r/berkeley for community takes...' })

  const enrichmentPromises = [
    fetchBerkeleyTime({ courseCodes: courseCodesParam }),
    fetchRMP({ professors: professorsParam }),
    calcentralCookie
      ? fetchScheduler({ calcentralCookie, candidates })
      : Promise.resolve({}),
    fetchReddit({ candidates }),
  ]

  const [btResult, rmpResult, schedulerResult, redditResult] = await Promise.allSettled(enrichmentPromises)

  const btData = btResult.status === 'fulfilled' ? btResult.value : {}
  onAgentUpdate('berkeleytime', btResult.status === 'fulfilled'
    ? { status: 'done', count: Object.keys(btData).length, message: 'Grade distributions loaded' }
    : { status: 'error', message: btResult.reason?.message })

  const rmpData = rmpResult.status === 'fulfilled' ? rmpResult.value : {}
  onAgentUpdate('rmp', rmpResult.status === 'fulfilled'
    ? { status: 'done', count: Object.keys(rmpData).length, message: 'Professor ratings loaded' }
    : { status: 'error', message: rmpResult.reason?.message })

  const conflictData = schedulerResult.status === 'fulfilled' ? schedulerResult.value : {}
  if (calcentralCookie) {
    onAgentUpdate('scheduler', schedulerResult.status === 'fulfilled'
      ? { status: 'done', message: 'Conflict check complete' }
      : { status: 'error', message: schedulerResult.reason?.message })
  }

  const redditData = redditResult.status === 'fulfilled' ? redditResult.value : {}
  onAgentUpdate('reddit', redditResult.status === 'fulfilled'
    ? { status: 'done', message: 'Community signals collected' }
    : { status: 'error', message: redditResult.reason?.message })

  // ─── TIER 3: Score + Rank ────────────────────────────────────────────────
  onAgentUpdate('score', { status: 'running', message: 'Scoring and ranking candidates...' })

  const scoredCourses = candidates.map(course => {
    const bt = btData[course.courseCode] ?? {}
    const prof = rmpData[course.instructor] ?? {}
    const hasConflict = conflictData[course.courseCode] ?? false
    const reddit = redditData[course.courseCode] ?? {}

    const score = computeScore({ course, bt, prof, hasConflict, reddit, targetUnits })

    return {
      ...course,
      gpa: bt.avgGpa,
      gradeDistribution: bt.distribution,
      btSlug: bt.slug,
      rmpScore: prof.rating,
      rmpDifficulty: prof.difficulty,
      wouldTakeAgain: prof.wouldTakeAgain,
      rmpTags: prof.tags,
      hasConflict,
      redditSnippets: reddit.snippets ?? [],
      redditSentiment: reddit.sentiment,
      score,
    }
  })

  onAgentUpdate('score', { status: 'done', message: `Ranked ${scoredCourses.length} courses` })

  return {
    courses: scoredCourses,
    doubleCounts,
    summary: {
      reqsCoverable: [...new Set(scoredCourses.flatMap(c => c.satisfies))].length,
      totalCandidates: candidates.length,
      conflictFree: scoredCourses.filter(c => !c.hasConflict).length,
    },
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function buildCandidateList({ allCourses, requirementMap, completedCourses }) {
  const completedSet = new Set(completedCourses.map(c => c.toUpperCase()))
  const unmetReqs = requirementMap.unmet ?? {}

  const candidates = []
  const doubleCountMap = {}

  for (const course of allCourses) {
    if (completedSet.has(course.courseCode?.toUpperCase())) continue

    // Which unmet requirements does this course satisfy?
    const satisfies = []
    for (const [reqKey, reqCourses] of Object.entries(unmetReqs)) {
      if (Array.isArray(reqCourses) && reqCourses.some(r =>
        r.toUpperCase() === course.courseCode?.toUpperCase() ||
        r.toUpperCase() === course.subject?.toUpperCase()
      )) {
        satisfies.push(reqKey)
      }
    }

    if (satisfies.length === 0) continue // doesn't satisfy any unmet req

    const candidate = { ...course, satisfies }
    candidates.push(candidate)

    if (satisfies.length > 1) {
      doubleCountMap[course.courseCode] = { courseCode: course.courseCode, satisfies }
    }
  }

  return {
    candidates,
    doubleCounts: Object.values(doubleCountMap),
  }
}

function computeScore({ course, bt, prof, hasConflict, reddit, targetUnits }) {
  if (hasConflict) return 0 // Hard filter

  let score = 50 // base

  // GPA signal (0–4.0 → 0–30 pts)
  if (bt.avgGpa != null) score += (bt.avgGpa / 4.0) * 30

  // RMP score (0–5 → 0–25 pts)
  if (prof.rating != null) score += (prof.rating / 5.0) * 25

  // Would take again (0–100% → 0–15 pts)
  if (prof.wouldTakeAgain != null) score += (prof.wouldTakeAgain / 100) * 15

  // Double-count bonus
  if (course.satisfies.length > 1) score += course.satisfies.length * 10

  // Reddit sentiment (-5 to +5 pts)
  if (reddit.sentiment != null) score += reddit.sentiment * 5

  // Units proximity to selected semester load, approximated per course
  const idealUnits = Math.max(1, Math.min(5, (targetUnits || 16) / 4))
  const unitDiff = Math.abs((course.units ?? idealUnits) - idealUnits)
  score -= unitDiff * 1

  return Math.max(0, Math.min(100, score))
}

// ─── API fetch helpers ───────────────────────────────────────────────────────

async function fetchRequirements({ major, catalogYear }) {
  const res = await fetch(API('requirements'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ major, catalogYear }),
  })
  if (!res.ok) throw await toPipelineError(res, 'Requirements lookup failed.')
  return res.json()
}

async function fetchCourses({ semester }) {
  const res = await fetch(API('courses'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ semester }),
  })
  if (!res.ok) throw await toPipelineError(res, 'Course inventory fetch failed.')
  return res.json()
}

async function fetchBerkeleyTime({ courseCodes }) {
  const res = await fetch(API('berkeleytime'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ courseCodes }),
  })
  if (!res.ok) throw await toPipelineError(res, 'Berkeleytime lookup failed.')
  return res.json()
}

async function fetchRMP({ professors }) {
  const res = await fetch(API('rmp'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ professors }),
  })
  if (!res.ok) throw await toPipelineError(res, 'Professor lookup failed.')
  return res.json()
}

async function fetchScheduler({ calcentralCookie, candidates }) {
  const res = await fetch(API('scheduler'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ calcentralCookie, candidates }),
  })
  if (!res.ok) throw await toPipelineError(res, 'Conflict check failed.')
  return res.json()
}

async function fetchReddit({ candidates }) {
  // Send only course codes and names to minimize payload
  const courses = candidates.slice(0, 30).map(c => ({  // cap at 30 to stay within rate limits
    courseCode: c.courseCode,
    title: c.title,
  }))
  const res = await fetch(API('reddit'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ courses }),
  })
  if (!res.ok) throw await toPipelineError(res, 'Community search failed.')
  return res.json()
}

async function toPipelineError(res, fallbackMessage) {
  let data = null

  try {
    const text = await res.text()
    data = text ? JSON.parse(text) : null
  } catch {
    data = null
  }

  const err = new Error(data?.error || fallbackMessage)
  err.code = data?.code
  err.silent = Boolean(data?.silent)
  err.userMessage = data?.userMessage || err.message || fallbackMessage
  return err
}
