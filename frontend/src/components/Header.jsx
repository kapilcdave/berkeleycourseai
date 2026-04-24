export default function Header({ phase, parsedProfile, onReset }) {
  const phaseLabel = phase === 'input' ? 'Ready' : phase === 'running' ? 'Analyzing' : 'Results'
  return (
    <header
      style={{
        borderBottom: '1px solid var(--line-soft)',
        padding: '18px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        position: 'sticky',
        top: 0,
        background: 'rgba(7, 16, 25, 0.84)',
        backdropFilter: 'blur(18px)',
        zIndex: 100,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0 }}>
        <button
          onClick={onReset}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
        >
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.48rem',
              color: 'var(--text-primary)',
              letterSpacing: '-0.04em',
            }}
          >
            bearcourses
          </span>
        </button>

        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.64rem',
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            whiteSpace: 'nowrap',
          }}
        >
          {phaseLabel}
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        {parsedProfile && (
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.66rem',
              color: 'var(--text-secondary)',
              display: 'flex',
              gap: 12,
              flexWrap: 'wrap',
              justifyContent: 'flex-end',
            }}
          >
            <span style={{ color: 'var(--california-gold)' }}>{parsedProfile.major}</span>
            <span>Catalog {parsedProfile.catalogYear}</span>
            <span>{parsedProfile.completedUnits} units done</span>
          </div>
        )}
      </div>
    </header>
  )
}
