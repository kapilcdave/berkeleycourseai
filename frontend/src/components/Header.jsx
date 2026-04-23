import { useState, useEffect } from 'react'

export default function Header({ phase, parsedProfile, onReset }) {
  const [tick, setTick] = useState(true)

  useEffect(() => {
    const t = setInterval(() => setTick(v => !v), 800)
    return () => clearInterval(t)
  }, [])

  return (
    <header style={{
      borderBottom: '1px solid var(--border)',
      padding: '20px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      background: 'rgba(8,9,12,0.92)',
      backdropFilter: 'blur(12px)',
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
            fontSize: '1.5rem',
            color: 'var(--california-gold)',
            letterSpacing: '-0.02em',
          }}>
            BearCourses
          </span>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.65rem',
            color: 'var(--text-secondary)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}>
            UC Berkeley · Course Intelligence
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

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: phase === 'running'
              ? 'var(--california-gold)'
              : phase === 'results'
              ? 'var(--green-signal)'
              : 'var(--text-secondary)',
            display: 'inline-block',
            animation: phase === 'running' ? 'pulse-gold 1s infinite' : 'none',
          }} />
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.65rem',
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
          }}>
            {phase === 'input' ? 'Ready' : phase === 'running' ? 'Analyzing' : 'Complete'}
          </span>
        </div>

        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.65rem',
          color: 'var(--border-bright)',
          opacity: tick ? 1 : 0,
          transition: 'opacity 0.1s',
        }}>
          {new Date().toLocaleTimeString('en-US', { hour12: false })}
        </span>
      </div>
    </header>
  )
}
