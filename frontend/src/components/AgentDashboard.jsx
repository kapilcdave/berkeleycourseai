import { useEffect, useState } from 'react'

const AGENTS = [
  {
    id: 'parse-pdf',
    name: 'PDF Parser',
    description: 'Extracting degree progress & completed courses',
    icon: '📄',
    tier: 0,
  },
  {
    id: 'requirements',
    name: 'Req. Mapper',
    description: 'Pulling major requirements for your catalog year',
    icon: '🗺',
    tier: 1,
  },
  {
    id: 'courses',
    name: 'Course Catalog',
    description: 'Fetching current semester offerings & time slots',
    icon: '📚',
    tier: 1,
  },
  {
    id: 'berkeleytime',
    name: 'Berkeley Time',
    description: 'Grade distributions & GPA data per course',
    icon: '📊',
    tier: 2,
  },
  {
    id: 'rmp',
    name: 'RateMyProf',
    description: 'Professor ratings & difficulty scores',
    icon: '⭐',
    tier: 2,
  },
  {
    id: 'scheduler',
    name: 'CalCentral',
    description: 'Checking your schedule for time conflicts',
    icon: '🗓',
    tier: 2,
  },
  {
    id: 'reddit',
    name: 'Community Signal',
    description: 'Surfacing Reddit opinions with dates',
    icon: '💬',
    tier: 2,
  },
  {
    id: 'score',
    name: 'Orchestrator',
    description: 'Scoring, ranking & finding double-counts',
    icon: '🧠',
    tier: 3,
  },
]

const STATUS_COLORS = {
  idle: 'var(--text-secondary)',
  running: 'var(--california-gold)',
  done: 'var(--green-signal)',
  error: 'var(--red-signal)',
  skipped: 'var(--text-secondary)',
}

const STATUS_LABELS = {
  idle: 'WAITING',
  running: 'RUNNING',
  done: 'DONE',
  error: 'ERROR',
  skipped: 'SKIPPED',
}

export default function AgentDashboard({ agentStates, parsedProfile }) {
  const [elapsed, setElapsed] = useState(0)
  const [startTime] = useState(Date.now())

  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 200)
    return () => clearInterval(t)
  }, [startTime])

  const doneCount = Object.values(agentStates).filter(a => a?.status === 'done').length
  const totalAgents = AGENTS.length

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', paddingTop: 48 }}>
      {/* Status bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 32,
        animation: 'fadeUp 0.4s ease forwards',
      }}>
        <div>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.8rem',
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
            marginBottom: 4,
          }}>
            Analyzing your options
          </h2>
          {parsedProfile && (
            <p style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              color: 'var(--text-secondary)',
            }}>
              {parsedProfile.major} · {parsedProfile.unmetRequirements?.length ?? '?'} requirements to fill · {parsedProfile.completedUnits} units completed
            </p>
          )}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '2rem',
            color: 'var(--california-gold)',
            letterSpacing: '-0.04em',
          }}>
            {elapsed}s
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.65rem',
            color: 'var(--text-secondary)',
          }}>
            {doneCount}/{totalAgents} agents complete
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{
        height: 2,
        background: 'var(--border)',
        borderRadius: 1,
        marginBottom: 40,
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          background: 'var(--california-gold)',
          width: `${(doneCount / totalAgents) * 100}%`,
          transition: 'width 0.5s ease',
          borderRadius: 1,
        }} />
      </div>

      {/* Tier labels + agent cards */}
      {[0, 1, 2, 3].map(tier => {
        const tierAgents = AGENTS.filter(a => a.tier === tier)
        const tierLabels = ['TIER 0 — PARSE', 'TIER 1 — CANDIDATE FILTER', 'TIER 2 — ENRICHMENT', 'TIER 3 — SYNTHESIS']
        return (
          <div key={tier} style={{ marginBottom: 32 }}>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.6rem',
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              marginBottom: 12,
              paddingBottom: 8,
              borderBottom: '1px solid var(--border)',
            }}>
              {tierLabels[tier]}
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: tier === 0 || tier === 3 ? '1fr' : 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 12,
            }}>
              {tierAgents.map((agent, i) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  state={agentStates[agent.id] || { status: 'idle' }}
                  delay={i * 80}
                />
              ))}
            </div>
          </div>
        )
      })}

      {/* Candidate count if available */}
      {agentStates['courses']?.candidateCount && (
        <div style={{
          background: 'var(--gold-glow)',
          border: '1px solid var(--border-bright)',
          borderRadius: 8,
          padding: '16px 20px',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.75rem',
          color: 'var(--california-gold)',
          animation: 'fadeUp 0.4s ease forwards',
        }}>
          ↓ Tier 1 complete — enrichment agents running on <strong>{agentStates['courses'].candidateCount}</strong> candidate courses
          {agentStates['courses']?.doubleCountCount > 0 && (
            <span style={{ marginLeft: 16, color: 'var(--green-signal)' }}>
              · {agentStates['courses'].doubleCountCount} potential double-counts identified
            </span>
          )}
        </div>
      )}
    </div>
  )
}

function AgentCard({ agent, state, delay }) {
  const color = STATUS_COLORS[state.status] || 'var(--text-secondary)'
  const isRunning = state.status === 'running'

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: `1px solid ${isRunning ? 'var(--border-bright)' : state.status === 'done' ? 'rgba(76,175,110,0.2)' : 'var(--border)'}`,
      borderRadius: 8,
      padding: '16px 20px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: 14,
      animation: `fadeUp 0.4s ease ${delay}ms both`,
      transition: 'border-color 0.3s, background 0.3s',
      background: isRunning ? 'rgba(253,181,21,0.03)' : 'var(--bg-card)',
    }}>
      <div style={{ fontSize: '1.3rem', lineHeight: 1, marginTop: 2 }}>{agent.icon}</div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
            fontSize: '0.85rem',
            color: 'var(--text-primary)',
          }}>
            {agent.name}
          </span>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.6rem',
            color,
            letterSpacing: '0.1em',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          }}>
            {isRunning && (
              <span style={{
                width: 5, height: 5,
                borderRadius: '50%',
                background: 'var(--california-gold)',
                display: 'inline-block',
                animation: 'pulse-gold 0.8s infinite',
              }} />
            )}
            {STATUS_LABELS[state.status]}
          </span>
        </div>

        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.68rem',
          color: 'var(--text-secondary)',
          marginBottom: state.message ? 8 : 0,
        }}>
          {agent.description}
        </div>

        {state.message && (
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.68rem',
            color: state.status === 'error' ? 'var(--red-signal)' : 'var(--text-mono)',
            marginTop: 6,
            padding: '6px 10px',
            background: 'rgba(0,0,0,0.3)',
            borderRadius: 4,
            borderLeft: `2px solid ${color}`,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {state.message}
          </div>
        )}

        {state.status === 'done' && state.count !== undefined && (
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.65rem',
            color: 'var(--green-signal)',
            marginTop: 4,
          }}>
            ✓ {state.count} records
          </div>
        )}
      </div>
    </div>
  )
}
