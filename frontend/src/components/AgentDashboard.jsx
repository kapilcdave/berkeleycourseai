import { useEffect, useMemo, useState } from 'react'

const AGENTS = [
  { id: 'parse-pdf', name: 'Student Profile', description: 'Parse degree progress PDF', tier: 0 },
  { id: 'requirements', name: 'Requirement Planner', description: 'Map unmet requirements', tier: 1 },
  { id: 'courses', name: 'Course Catalog', description: 'Load live semester offerings', tier: 1 },
  { id: 'professors', name: 'Professor Signal', description: 'Blend GPA and rating signal', tier: 2 },
  { id: 'scheduler', name: 'Schedule Check', description: 'Validate timing and load', tier: 2 },
  { id: 'score', name: 'Schedule Composer', description: 'Assemble the final schedule', tier: 3 },
]

const STATUS_META = {
  idle: { label: 'Queued', color: 'var(--text-secondary)', background: 'var(--surface-soft)', border: 'var(--line-soft)' },
  running: { label: 'Running', color: 'var(--accent)', background: 'rgba(178, 129, 53, 0.12)', border: 'rgba(178, 129, 53, 0.24)' },
  done: { label: 'Ready', color: 'var(--success)', background: 'rgba(103, 124, 105, 0.14)', border: 'rgba(103, 124, 105, 0.24)' },
  error: { label: 'Issue', color: 'var(--danger)', background: 'rgba(150, 86, 72, 0.14)', border: 'rgba(150, 86, 72, 0.24)' },
  skipped: { label: 'Skipped', color: 'var(--text-secondary)', background: 'var(--surface-soft)', border: 'var(--line-soft)' },
}

const TREE = [
  ['parse-pdf'],
  ['requirements', 'courses'],
  ['professors', 'scheduler'],
  ['score'],
]

export default function AgentDashboard({ agentStates, parsedProfile }) {
  const [elapsed, setElapsed] = useState(0)
  const [startTime] = useState(Date.now())
  const isCompact = useCompactLayout(920)

  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 250)
    return () => clearInterval(t)
  }, [startTime])

  const counts = useMemo(() => {
    const statuses = AGENTS.map((agent) => agentStates[agent.id]?.status ?? 'idle')
    return {
      done: statuses.filter((status) => status === 'done').length,
      running: statuses.filter((status) => status === 'running').length,
      issues: statuses.filter((status) => status === 'error').length,
      total: AGENTS.length,
    }
  }, [agentStates])

  const progress = Math.round((counts.done / counts.total) * 100)
  const candidateCount = agentStates.courses?.candidateCount ?? 0
  const doubleCountCount = agentStates.courses?.doubleCountCount ?? 0

  return (
    <div style={{ maxWidth: 1120, margin: '0 auto', paddingTop: isCompact ? 28 : 44 }}>
      <section
        style={{
          textAlign: 'center',
          marginBottom: 28,
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '7px 12px',
            borderRadius: 999,
            background: 'var(--surface-soft)',
            border: '1px solid var(--line-soft)',
            marginBottom: 18,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: counts.running > 0 ? 'var(--accent)' : 'var(--success)',
              animation: counts.running > 0 ? 'pulse-soft 1.5s infinite' : 'none',
            }}
          />
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.68rem',
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            Multi-agent planner
          </span>
        </div>

        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2.2rem, 5vw, 4.5rem)',
            lineHeight: 0.96,
            letterSpacing: '-0.05em',
            color: 'var(--text-primary)',
            maxWidth: 820,
            margin: '0 auto 16px',
          }}
        >
          optimize your class schedule with ai agents
        </h1>

        <p
          style={{
            maxWidth: 700,
            margin: '0 auto',
            fontSize: '1rem',
            lineHeight: 1.7,
            color: 'var(--text-secondary)',
          }}
        >
          BearCourses reads your progress report, filters the catalog, attaches quality signals, and composes a cleaner semester plan.
        </p>
      </section>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: isCompact ? 'repeat(2, minmax(0, 1fr))' : 'repeat(4, minmax(0, 1fr))',
          gap: 12,
          marginBottom: 28,
        }}
      >
        <MinimalStat label="Progress" value={`${progress}%`} />
        <MinimalStat label="Elapsed" value={`${elapsed}s`} />
        <MinimalStat label="Candidates" value={candidateCount || '...'} />
        <MinimalStat label="Double counts" value={String(doubleCountCount)} />
      </section>

      {parsedProfile && (
        <section
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: 30,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              flexWrap: 'wrap',
              justifyContent: 'center',
              padding: '10px 16px',
              borderRadius: 999,
              background: 'var(--surface-soft)',
              border: '1px solid var(--line-soft)',
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                background: 'rgba(178, 129, 53, 0.16)',
                color: 'var(--accent)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.74rem',
              }}
            >
              AI
            </div>
            <span style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>{parsedProfile.major}</span>
            <span style={{ color: 'var(--text-secondary)' }}>catalog {parsedProfile.catalogYear}</span>
            <span style={{ color: 'var(--text-secondary)' }}>{parsedProfile.completedUnits} units completed</span>
          </div>
        </section>
      )}

      <section
        style={{
          border: '1px solid var(--line-soft)',
          borderRadius: 28,
          background: 'var(--surface)',
          padding: isCompact ? '18px 14px 22px' : '28px 24px 30px',
          boxShadow: 'var(--shadow-panel)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            gap: 16,
            flexWrap: 'wrap',
            marginBottom: 20,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.66rem',
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 8,
              }}
            >
              System map
            </div>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: 620 }}>
              Six linked agents move from intake to planning, validate quality and conflicts, then collapse into one final schedule recommendation.
            </p>
          </div>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.7rem',
              color: counts.issues > 0 ? 'var(--danger)' : 'var(--text-secondary)',
            }}
          >
            {counts.done}/{counts.total} complete
          </div>
        </div>

        <div style={{ display: 'grid', gap: isCompact ? 10 : 14 }}>
          {TREE.map((row, index) => (
            <TreeRow
              key={row.join('-')}
              row={row}
              index={index}
              isCompact={isCompact}
              agentStates={agentStates}
            />
          ))}
        </div>
      </section>
    </div>
  )
}

function TreeRow({ row, index, isCompact, agentStates }) {
  const columns = isCompact ? Math.min(2, row.length) : row.length

  return (
    <div style={{ display: 'grid', gap: isCompact ? 10 : 14, justifyItems: 'center' }}>
      {index > 0 && <Connector compact={isCompact} />}
      <div
        style={{
          width: '100%',
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          justifyItems: 'center',
          gap: isCompact ? 10 : 14,
        }}
      >
        {row.map((id) => {
          const agent = AGENTS.find((item) => item.id === id)
          return (
            <AgentNode
              key={id}
              agent={agent}
              state={agentStates[id] || { status: 'idle' }}
            />
          )
        })}
      </div>
    </div>
  )
}

function Connector({ compact }) {
  return (
    <div
      style={{
        position: 'relative',
        width: compact ? '84%' : '92%',
        height: compact ? 24 : 34,
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: 0,
          width: 1,
          height: compact ? 10 : 14,
          background: 'var(--line-strong)',
          transform: 'translateX(-50%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: '12%',
          right: '12%',
          top: compact ? 10 : 14,
          height: 1,
          background: 'var(--line-strong)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: '12%',
          bottom: 0,
          width: 1,
          height: compact ? 10 : 14,
          background: 'var(--line-strong)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          right: '12%',
          bottom: 0,
          width: 1,
          height: compact ? 10 : 14,
          background: 'var(--line-strong)',
        }}
      />
    </div>
  )
}

function AgentNode({ agent, state }) {
  const meta = STATUS_META[state.status] ?? STATUS_META.idle

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 220,
        minHeight: 136,
        borderRadius: 22,
        padding: '16px 16px 14px',
        background: meta.background,
        border: `1px solid ${meta.border}`,
        display: 'grid',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
            background: 'rgba(255,255,255,0.68)',
            color: meta.color,
            fontFamily: 'var(--font-mono)',
            fontSize: '0.7rem',
          }}
        >
          {agent.id === 'parse-pdf' ? ':-)' : agent.name.slice(0, 2).toUpperCase()}
        </div>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.58rem',
            color: meta.color,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          {meta.label}
        </span>
      </div>

      <div>
        <div
          style={{
            fontSize: '0.96rem',
            color: 'var(--text-primary)',
            marginBottom: 6,
            lineHeight: 1.25,
          }}
        >
          {agent.name}
        </div>
        <div
          style={{
            fontSize: '0.8rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.55,
          }}
        >
          {state.message || agent.description}
        </div>
      </div>

      {(state.count != null || state.candidateCount != null || state.doubleCountCount > 0) && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {state.count != null && <NodeTag text={`${state.count}`} />}
          {state.candidateCount != null && <NodeTag text={`${state.candidateCount} candidates`} />}
          {state.doubleCountCount > 0 && <NodeTag text={`${state.doubleCountCount} doubles`} />}
        </div>
      )}
    </div>
  )
}

function MinimalStat({ label, value }) {
  return (
    <div
      style={{
        border: '1px solid var(--line-soft)',
        borderRadius: 20,
        background: 'var(--surface-soft)',
        padding: '14px 16px',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.62rem',
          color: 'var(--text-secondary)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.7rem',
          lineHeight: 1,
          letterSpacing: '-0.04em',
          color: 'var(--text-primary)',
        }}
      >
        {value}
      </div>
    </div>
  )
}

function NodeTag({ text }) {
  return (
    <span
      style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '0.56rem',
        color: 'var(--text-secondary)',
        borderRadius: 999,
        padding: '4px 8px',
        background: 'rgba(255,255,255,0.62)',
        border: '1px solid var(--line-soft)',
      }}
    >
      {text}
    </span>
  )
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
