import { useEffect, useState } from 'react'

export default function Header({ phase, parsedProfile, onReset }) {
  const [timeLabel, setTimeLabel] = useState(() => formatTime())

  useEffect(() => {
    const t = setInterval(() => setTimeLabel(formatTime()), 1000)
    return () => clearInterval(t)
  }, [])

  const phaseLabel = phase === 'input' ? 'Ready' : phase === 'running' ? 'Analyzing' : 'Complete'
  const phaseColor = phase === 'running'
    ? 'var(--california-gold)'
    : phase === 'results'
      ? 'var(--green-signal)'
      : 'var(--cyan-signal)'

  return (
    <header style={{
      borderBottom: '1px solid var(--border)',
      padding: '18px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      background: 'rgba(8, 17, 26, 0.84)',
      backdropFilter: 'blur(18px)',
      zIndex: 100,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
        <button
          onClick={onReset}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'baseline',
            gap: 12,
          }}
        >
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.32rem',
            color: 'var(--california-gold)',
            letterSpacing: '-0.02em',
          }}>
            BearCourses
          </span>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.6rem',
            color: 'var(--text-secondary)',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}>
            AI Course Planner
          </span>
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        {parsedProfile && (
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.7rem',
            color: 'var(--text-secondary)',
            display: 'flex',
            gap: 16,
          }}>
            <span style={{ color: 'var(--california-gold)' }}>{parsedProfile.major}</span>
            <span>Cat. {parsedProfile.catalogYear}</span>
            <span>{parsedProfile.completedUnits} units done</span>
          </div>
        )}

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 12px',
          borderRadius: 999,
          border: '1px solid var(--border)',
          background: 'rgba(255,255,255,0.02)',
        }}>
          <span style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: phaseColor,
            display: 'inline-block',
            animation: phase === 'running' ? 'pulse-soft 1.4s infinite' : 'none',
          }} />
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.65rem',
            color: phase === 'input' ? 'var(--text-primary)' : phaseColor,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}>
            {phaseLabel}
          </span>
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 2,
        }}>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.58rem',
            color: 'var(--text-secondary)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}>
            Local time
          </span>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.7rem',
            color: 'var(--text-primary)',
          }}>
            {timeLabel}
          </span>
        </div>
      </div>
    </header>
  )
}

function formatTime() {
  return new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}
