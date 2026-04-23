import { useEffect, useMemo, useState } from 'react'

const AGENTS = [
  { id: 'parse-pdf', name: 'Profile', description: 'Parse degree progress PDF', tier: 0 },
  { id: 'requirements', name: 'Requirements', description: 'Map catalog-year requirements', tier: 1 },
  { id: 'courses', name: 'Catalog', description: 'Load semester offerings', tier: 1 },
  { id: 'berkeleytime', name: 'Berkeleytime', description: 'Attach GPA history', tier: 2 },
  { id: 'rmp', name: 'Prof signal', description: 'Attach professor ratings', tier: 2 },
  { id: 'scheduler', name: 'Conflicts', description: 'Check schedule overlap', tier: 2 },
  { id: 'reddit', name: 'Community', description: 'Pull course sentiment', tier: 2 },
  { id: 'score', name: 'Composer', description: 'Rank and assemble output', tier: 3 },
]

const STATUS_META = {
  idle: { label: 'Queued', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.02)' },
  running: { label: 'Running', color: 'var(--california-gold)', background: 'rgba(253,181,21,0.06)' },
  done: { label: 'Ready', color: 'var(--green-signal)', background: 'rgba(105,196,139,0.06)' },
  error: { label: 'Issue', color: 'var(--red-signal)', background: 'rgba(222,106,95,0.06)' },
  skipped: { label: 'Skipped', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.02)' },
}

const EXAMPLE_SCHEDULE = [
  { day: 'Mon', time: '10:00', course: 'CS 188', tag: 'Core', units: '4u', color: 'var(--california-gold)' },
  { day: 'Tue', time: '12:30', course: 'INFO 159', tag: 'Policy breadth', units: '4u', color: 'var(--cyan-signal)' },
  { day: 'Wed', time: '14:00', course: 'DATA 140', tag: 'Probability', units: '4u', color: 'var(--blue-signal)' },
  { day: 'Thu', time: '16:00', course: 'DES INV 15', tag: 'Light breadth', units: '1u', color: 'var(--green-signal)' },
]

export default function AgentDashboard({ agentStates, parsedProfile }) {
  const [elapsed, setElapsed] = useState(0)
  const [startTime] = useState(Date.now())
  const isCompact = useCompactLayout(980)

  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 250)
    return () => clearInterval(t)
  }, [startTime])

  const counts = useMemo(() => {
    const statuses = AGENTS.map(agent => agentStates[agent.id]?.status ?? 'idle')
    return {
      done: statuses.filter(status => status === 'done').length,
      running: statuses.filter(status => status === 'running').length,
      issues: statuses.filter(status => status === 'error').length,
      total: AGENTS.length,
    }
  }, [agentStates])

  const progress = Math.round((counts.done / counts.total) * 100)
  const candidateCount = agentStates.courses?.candidateCount ?? 0
  const doubleCountCount = agentStates.courses?.doubleCountCount ?? 0

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', paddingTop: 24 }}>
      <section style={{
        border: '1px solid var(--border)',
        borderRadius: 22,
        background: 'linear-gradient(180deg, rgba(16, 29, 43, 0.92), rgba(9, 18, 28, 0.98))',
        boxShadow: 'var(--shadow-panel)',
        padding: isCompact ? 18 : 20,
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isCompact ? '1fr' : 'minmax(0, 1.45fr) 320px',
          gap: 18,
          alignItems: 'start',
        }}>
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: 16,
              flexWrap: 'wrap',
              marginBottom: 14,
            }}>
              <div>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.6rem',
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.14em',
                  marginBottom: 6,
                }}>
                  Live pipeline
                </div>
                <h2 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(1.7rem, 3vw, 2.4rem)',
                  letterSpacing: '-0.04em',
                  lineHeight: 1,
                  color: 'var(--text-primary)',
                }}>
                  Schedule orchestration
                </h2>
              </div>

              <div style={{
                display: 'flex',
                gap: 8,
                flexWrap: 'wrap',
                justifyContent: isCompact ? 'flex-start' : 'flex-end',
              }}>
                <SummaryPill label="Elapsed" value={`${elapsed}s`} />
                <SummaryPill label="Ready" value={`${counts.done}/${counts.total}`} tone="var(--green-signal)" />
                <SummaryPill label="Candidates" value={candidateCount || '...'} tone="var(--blue-signal)" />
                <SummaryPill label="Double" value={doubleCountCount || '0'} tone="var(--cyan-signal)" />
              </div>
            </div>

            <div style={{
              height: 6,
              borderRadius: 999,
              background: 'rgba(255,255,255,0.05)',
              overflow: 'hidden',
              marginBottom: 14,
            }}>
              <div style={{
                width: `${progress}%`,
                height: '100%',
                borderRadius: 999,
                background: 'linear-gradient(90deg, rgba(253,181,21,1), rgba(126,215,208,0.94))',
                transition: 'width 0.35s ease',
              }} />
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: isCompact ? '1fr' : 'repeat(3, minmax(0, 1fr))',
              gap: 10,
              marginBottom: 16,
            }}>
              <CompactStat label="Pipeline" value={counts.running > 0 ? `${counts.running} active` : `${progress}% complete`} />
              <CompactStat label="Issues" value={String(counts.issues)} />
              <CompactStat
                label="Profile"
                value={parsedProfile ? `${parsedProfile.major} · ${parsedProfile.catalogYear}` : 'Waiting for intake'}
              />
            </div>

            <div style={{ display: 'grid', gap: 10 }}>
              {[0, 1, 2, 3].map((tier) => (
                <TierRow
                  key={tier}
                  tier={tier}
                  agents={AGENTS.filter(agent => agent.tier === tier)}
                  agentStates={agentStates}
                  isCompact={isCompact}
                />
              ))}
            </div>
          </div>

          <aside style={{
            position: isCompact ? 'static' : 'sticky',
            top: 92,
            display: 'grid',
            gap: 12,
          }}>
            <MiniPanel title="Run state">
              <div style={{ display: 'grid', gap: 8 }}>
                <MiniMetric label="Running" value={String(counts.running)} tone="var(--california-gold)" />
                <MiniMetric label="Ready" value={String(counts.done)} tone="var(--green-signal)" />
                <MiniMetric label="Issues" value={String(counts.issues)} tone="var(--red-signal)" />
              </div>
            </MiniPanel>

            <MiniPanel title="Example schedule">
              <div style={{ display: 'grid', gap: 8 }}>
                {EXAMPLE_SCHEDULE.map((item) => (
                  <div key={item.day + item.time + item.course} style={{
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 14,
                    background: 'rgba(255,255,255,0.02)',
                    padding: '10px 12px',
                    display: 'grid',
                    gridTemplateColumns: '38px 50px 1fr auto',
                    gap: 8,
                    alignItems: 'center',
                  }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--text-secondary)' }}>{item.day}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--text-secondary)' }}>{item.time}</span>
                    <div>
                      <div style={{ fontSize: '0.82rem', color: item.color, marginBottom: 2 }}>{item.course}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.56rem', color: 'var(--text-secondary)' }}>{item.tag}</div>
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--text-primary)' }}>{item.units}</span>
                  </div>
                ))}
              </div>
            </MiniPanel>
          </aside>
        </div>
      </section>
    </div>
  )
}

function TierRow({ tier, agents, agentStates, isCompact }) {
  const labels = ['Intake', 'Planning', 'Evidence', 'Assembly']

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: isCompact ? '1fr' : '100px 1fr',
      gap: 10,
      alignItems: 'start',
    }}>
      <div style={{
        paddingTop: isCompact ? 0 : 10,
        fontFamily: 'var(--font-mono)',
        fontSize: '0.58rem',
        color: 'var(--text-secondary)',
        textTransform: 'uppercase',
        letterSpacing: '0.14em',
      }}>
        Tier {tier}
        <div style={{ marginTop: 4, color: 'var(--text-primary)', letterSpacing: '0.06em' }}>
          {labels[tier]}
        </div>
      </div>

      <div style={{
        position: 'relative',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 18,
        background: 'rgba(255,255,255,0.02)',
        padding: 10,
      }}>
        <div style={{
          position: 'absolute',
          left: 16,
          top: 18,
          bottom: 18,
          width: 1,
          background: 'rgba(255,255,255,0.08)',
        }} />

        <div style={{ display: 'grid', gap: 8 }}>
          {agents.map((agent) => (
            <AgentRow key={agent.id} agent={agent} state={agentStates[agent.id] || { status: 'idle' }} />
          ))}
        </div>
      </div>
    </div>
  )
}

function AgentRow({ agent, state }) {
  const meta = STATUS_META[state.status] ?? STATUS_META.idle

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '12px minmax(0, 1fr) auto',
      gap: 10,
      alignItems: 'start',
      borderRadius: 14,
      background: meta.background,
      padding: '10px 10px',
    }}>
      <span style={{
        width: 10,
        height: 10,
        borderRadius: '50%',
        background: meta.color,
        marginTop: 4,
        animation: state.status === 'running' ? 'pulse-soft 1.4s infinite' : 'none',
      }} />

      <div style={{ minWidth: 0 }}>
        <div style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 8,
          flexWrap: 'wrap',
          marginBottom: 3,
        }}>
          <span style={{ fontSize: '0.84rem', color: 'var(--text-primary)' }}>{agent.name}</span>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.56rem',
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}>
            {agent.description}
          </span>
        </div>

        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.6rem',
          color: state.status === 'error' ? 'var(--text-secondary)' : 'var(--text-secondary)',
          lineHeight: 1.5,
        }}>
          {state.message || defaultMessage(state.status)}
        </div>

        {(state.count != null || state.candidateCount != null || state.doubleCountCount > 0) && (
          <div style={{
            display: 'flex',
            gap: 6,
            flexWrap: 'wrap',
            marginTop: 6,
          }}>
            {state.count != null && <Tag text={`${state.count}`} />}
            {state.candidateCount != null && <Tag text={`${state.candidateCount} cand.`} />}
            {state.doubleCountCount > 0 && <Tag text={`${state.doubleCountCount} dbl`} />}
          </div>
        )}
      </div>

      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '0.56rem',
        color: meta.color,
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        whiteSpace: 'nowrap',
        paddingTop: 2,
      }}>
        {meta.label}
      </span>
    </div>
  )
}

function MiniPanel({ title, children }) {
  return (
    <div style={{
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 18,
      background: 'rgba(255,255,255,0.025)',
      padding: 14,
    }}>
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '0.58rem',
        color: 'var(--text-secondary)',
        textTransform: 'uppercase',
        letterSpacing: '0.14em',
        marginBottom: 10,
      }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function SummaryPill({ label, value, tone = 'var(--california-gold)' }) {
  return (
    <div style={{
      borderRadius: 999,
      border: '1px solid rgba(255,255,255,0.06)',
      background: 'rgba(255,255,255,0.025)',
      padding: '8px 10px',
      minWidth: 88,
    }}>
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '0.52rem',
        color: 'var(--text-secondary)',
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        marginBottom: 4,
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: '1.1rem',
        color: tone,
        lineHeight: 1,
      }}>
        {value}
      </div>
    </div>
  )
}

function CompactStat({ label, value }) {
  return (
    <div style={{
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 14,
      background: 'rgba(255,255,255,0.025)',
      padding: '10px 12px',
    }}>
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '0.54rem',
        color: 'var(--text-secondary)',
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        marginBottom: 5,
      }}>
        {label}
      </div>
      <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', lineHeight: 1.35 }}>
        {value}
      </div>
    </div>
  )
}

function MiniMetric({ label, value, tone }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderRadius: 12,
      padding: '8px 10px',
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.05)',
    }}>
      <span style={{ fontSize: '0.76rem', color: 'var(--text-primary)' }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: tone }}>{value}</span>
    </div>
  )
}

function Tag({ text }) {
  return (
    <span style={{
      fontFamily: 'var(--font-mono)',
      fontSize: '0.52rem',
      color: 'var(--text-secondary)',
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 999,
      padding: '3px 7px',
      background: 'rgba(255,255,255,0.03)',
    }}>
      {text}
    </span>
  )
}

function defaultMessage(status) {
  if (status === 'running') return 'Processing current stage.'
  if (status === 'done') return 'Stage completed.'
  if (status === 'error') return 'Signal unavailable. Continuing.'
  if (status === 'skipped') return 'Skipped by configuration.'
  return 'Waiting on upstream stage.'
}

function useCompactLayout(breakpoint) {
  const [compact, setCompact] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
  )

  useEffect(() => {
    const onResize = () => setCompact(window.innerWidth < breakpoint)
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [breakpoint])

  return compact
}
