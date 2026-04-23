import { useState } from 'react'

const SORT_OPTIONS = [
  { value: 'score', label: 'Overall Score' },
  { value: 'gpa', label: 'Avg GPA' },
  { value: 'rmp', label: 'Prof Rating' },
  { value: 'double', label: 'Double Counts First' },
]

export default function ResultsView({ results, parsedProfile }) {
  const [sort, setSort] = useState('score')
  const [filterReq, setFilterReq] = useState('all')
  const [expanded, setExpanded] = useState(null)

  const { courses = [], doubleCounts = [], summary = {} } = results

  const filtered = courses
    .filter(c => filterReq === 'all' || c.satisfies.includes(filterReq))
    .sort((a, b) => {
      if (sort === 'score') return b.score - a.score
      if (sort === 'gpa') return (b.gpa ?? 0) - (a.gpa ?? 0)
      if (sort === 'rmp') return (b.rmpScore ?? 0) - (a.rmpScore ?? 0)
      if (sort === 'double') return (b.satisfies.length - a.satisfies.length) || (b.score - a.score)
      return 0
    })

  const allReqs = [...new Set(courses.flatMap(c => c.satisfies))].sort()

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', paddingTop: 40 }}>
      {/* Summary bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 16,
        marginBottom: 40,
        animation: 'fadeUp 0.4s ease forwards',
      }}>
        {[
          { label: 'Courses Found', value: courses.length, color: 'var(--california-gold)' },
          { label: 'Double Counts', value: doubleCounts.length, color: 'var(--green-signal)' },
          { label: 'Reqs Coverable', value: summary.reqsCoverable ?? '—', color: 'var(--blue-signal)' },
          { label: 'Conflict-Free', value: courses.filter(c => !c.hasConflict).length, color: 'var(--text-mono)' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            padding: '16px 20px',
          }}>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: '2rem',
              color: s.color,
              letterSpacing: '-0.03em',
              lineHeight: 1,
              marginBottom: 6,
            }}>
              {s.value}
            </div>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.65rem',
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Double count spotlight */}
      {doubleCounts.length > 0 && (
        <div style={{
          background: 'rgba(76,175,110,0.06)',
          border: '1px solid rgba(76,175,110,0.25)',
          borderRadius: 8,
          padding: '20px 24px',
          marginBottom: 32,
          animation: 'fadeUp 0.5s ease 0.1s both',
        }}>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.65rem',
            color: 'var(--green-signal)',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            marginBottom: 12,
          }}>
            ◆ Double-Count Opportunities — Max Efficiency
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {doubleCounts.slice(0, 6).map(dc => (
              <div key={dc.courseCode} style={{
                background: 'var(--bg-card)',
                border: '1px solid rgba(76,175,110,0.3)',
                borderRadius: 6,
                padding: '8px 14px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
              }}>
                <span style={{ color: 'var(--california-gold)', fontWeight: 500 }}>{dc.courseCode}</span>
                <span style={{ color: 'var(--text-secondary)', margin: '0 6px' }}>satisfies</span>
                <span style={{ color: 'var(--green-signal)' }}>{dc.satisfies.join(' + ')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Controls */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        marginBottom: 24,
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {SORT_OPTIONS.map(o => (
            <button
              key={o.value}
              onClick={() => setSort(o.value)}
              style={{
                padding: '7px 14px',
                border: `1px solid ${sort === o.value ? 'var(--california-gold)' : 'var(--border)'}`,
                borderRadius: 6,
                background: sort === o.value ? 'var(--gold-glow)' : 'var(--bg-panel)',
                color: sort === o.value ? 'var(--california-gold)' : 'var(--text-secondary)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.68rem',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {o.label}
            </button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Filter req:</span>
          <select
            value={filterReq}
            onChange={e => setFilterReq(e.target.value)}
            style={{
              background: 'var(--bg-panel)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              padding: '7px 12px',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.68rem',
              outline: 'none',
            }}
          >
            <option value="all">All requirements</option>
            {allReqs.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>

      {/* Course list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map((course, i) => (
          <CourseCard
            key={course.courseCode + course.section}
            course={course}
            rank={i + 1}
            isExpanded={expanded === (course.courseCode + course.section)}
            onToggle={() => setExpanded(prev =>
              prev === (course.courseCode + course.section) ? null : (course.courseCode + course.section)
            )}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '64px 24px',
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-secondary)',
          fontSize: '0.8rem',
        }}>
          No courses match this filter.
        </div>
      )}
    </div>
  )
}

function ScoreBar({ value, max = 100, color = 'var(--california-gold)' }) {
  return (
    <div style={{ height: 3, background: 'var(--border)', borderRadius: 2, overflow: 'hidden', flex: 1 }}>
      <div style={{
        height: '100%',
        width: `${Math.min(100, (value / max) * 100)}%`,
        background: color,
        borderRadius: 2,
        transition: 'width 0.6s ease',
      }} />
    </div>
  )
}

function CourseCard({ course, rank, isExpanded, onToggle }) {
  const isDoubleCount = course.satisfies.length > 1
  const hasConflict = course.hasConflict

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: `1px solid ${isDoubleCount ? 'rgba(76,175,110,0.25)' : hasConflict ? 'rgba(207,68,68,0.2)' : 'var(--border)'}`,
        borderRadius: 8,
        overflow: 'hidden',
        animation: 'fadeUp 0.4s ease forwards',
        opacity: hasConflict ? 0.6 : 1,
        transition: 'border-color 0.2s',
      }}
    >
      {/* Main row */}
      <div
        onClick={onToggle}
        style={{
          padding: '18px 20px',
          cursor: 'pointer',
          display: 'grid',
          gridTemplateColumns: '40px 1fr auto',
          gap: 16,
          alignItems: 'center',
        }}
      >
        {/* Rank */}
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.4rem',
          color: rank <= 3 ? 'var(--california-gold)' : 'var(--text-secondary)',
          letterSpacing: '-0.03em',
          lineHeight: 1,
        }}>
          {rank}
        </div>

        {/* Course info */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.85rem',
              color: 'var(--california-gold)',
              fontWeight: 500,
            }}>
              {course.courseCode}
            </span>
            <span style={{
              fontFamily: 'var(--font-body)',
              fontSize: '0.9rem',
              color: 'var(--text-primary)',
              fontWeight: 500,
            }}>
              {course.title}
            </span>
            {isDoubleCount && (
              <span style={{
                background: 'rgba(76,175,110,0.12)',
                border: '1px solid rgba(76,175,110,0.3)',
                borderRadius: 4,
                padding: '2px 8px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.6rem',
                color: 'var(--green-signal)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}>
                Double Count
              </span>
            )}
            {hasConflict && (
              <span style={{
                background: 'rgba(207,68,68,0.1)',
                border: '1px solid rgba(207,68,68,0.3)',
                borderRadius: 4,
                padding: '2px 8px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.6rem',
                color: 'var(--red-signal)',
              }}>
                Time Conflict
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <Stat label="Instructor" value={course.instructor ?? 'TBA'} />
            <Stat label="Time" value={course.time ?? 'TBA'} />
            <Stat label="Units" value={course.units ?? '?'} />
            <Stat label="Satisfies" value={course.satisfies.join(', ')} color="var(--blue-signal)" />
          </div>
        </div>

        {/* Score + signals */}
        <div style={{ textAlign: 'right', minWidth: 120 }}>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.8rem',
            color: scoreColor(course.score),
            letterSpacing: '-0.03em',
            lineHeight: 1,
          }}>
            {Math.round(course.score)}
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.6rem',
            color: 'var(--text-secondary)',
            marginTop: 4,
          }}>
            GPA {course.gpa?.toFixed(2) ?? '—'} · RMP {course.rmpScore?.toFixed(1) ?? '—'}
          </div>
        </div>
      </div>

      {/* Expanded detail */}
      {isExpanded && (
        <div style={{
          borderTop: '1px solid var(--border)',
          padding: '20px',
          background: 'var(--bg-base)',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 24,
          animation: 'fadeUp 0.25s ease forwards',
        }}>
          {/* Signal breakdown */}
          <div>
            <SectionLabel>Signal Breakdown</SectionLabel>
            {[
              { label: 'Berkeley Time GPA', value: course.gpa, max: 4, format: v => v?.toFixed(2), color: 'var(--california-gold)' },
              { label: 'RateMyProf Score', value: course.rmpScore, max: 5, format: v => v?.toFixed(1), color: 'var(--blue-signal)' },
              { label: 'Would Take Again', value: course.wouldTakeAgain, max: 100, format: v => v ? `${v}%` : null, color: 'var(--green-signal)' },
              { label: 'Difficulty (lower=easier)', value: course.rmpDifficulty ? 5 - course.rmpDifficulty : null, max: 5, format: v => course.rmpDifficulty?.toFixed(1), color: 'var(--text-mono)' },
            ].map(s => s.value != null && (
              <div key={s.label} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-secondary)' }}>{s.label}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: s.color }}>{s.format(s.value)}</span>
                </div>
                <ScoreBar value={s.value} max={s.max} color={s.color} />
              </div>
            ))}
          </div>

          {/* Reddit + description */}
          <div>
            {course.description && (
              <>
                <SectionLabel>Course Description</SectionLabel>
                <p style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.7,
                  marginBottom: 16,
                }}>
                  {course.description}
                </p>
              </>
            )}

            {course.redditSnippets?.length > 0 && (
              <>
                <SectionLabel>Community Signal</SectionLabel>
                {course.redditSnippets.map((s, i) => (
                  <div key={i} style={{
                    background: 'var(--bg-card)',
                    borderRadius: 6,
                    padding: '10px 12px',
                    marginBottom: 8,
                    borderLeft: '2px solid var(--border)',
                  }}>
                    <div style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '0.75rem',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.5,
                      marginBottom: 4,
                    }}>
                      {s.snippet}
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.6rem',
                      color: 'var(--text-secondary)',
                      opacity: 0.6,
                    }}>
                      r/berkeley · {s.date}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Enrollment link */}
          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 12 }}>
            <a
              href={`https://classes.berkeley.edu/content/${course.courseCode.toLowerCase().replace(' ', '-')}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '10px 20px',
                background: 'var(--california-gold)',
                color: 'var(--bg-base)',
                borderRadius: 6,
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                fontSize: '0.82rem',
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              View on Berkeley Classes →
            </a>
            <a
              href={`https://berkeleytime.com/catalog/${course.btSlug ?? ''}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '10px 20px',
                background: 'var(--bg-panel)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                fontFamily: 'var(--font-body)',
                fontSize: '0.82rem',
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              Berkeley Time →
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, color = 'var(--text-secondary)' }) {
  return (
    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem' }}>
      <span style={{ color: 'var(--text-secondary)', marginRight: 4 }}>{label}:</span>
      <span style={{ color }}>{value}</span>
    </span>
  )
}

function SectionLabel({ children }) {
  return (
    <div style={{
      fontFamily: 'var(--font-mono)',
      fontSize: '0.6rem',
      color: 'var(--text-secondary)',
      textTransform: 'uppercase',
      letterSpacing: '0.12em',
      marginBottom: 10,
    }}>
      {children}
    </div>
  )
}

function scoreColor(score) {
  if (score >= 80) return 'var(--green-signal)'
  if (score >= 60) return 'var(--california-gold)'
  return 'var(--text-secondary)'
}
