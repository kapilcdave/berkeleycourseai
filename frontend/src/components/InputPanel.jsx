import { useState, useRef } from 'react'

const SEMESTERS = ['Fall 2025', 'Spring 2026', 'Summer 2026', 'Fall 2026']

export default function InputPanel({ onSubmit }) {
  const [pdfFile, setPdfFile] = useState(null)
  const [major, setMajor] = useState('')
  const [targetUnits, setTargetUnits] = useState(15)
  const [semester, setSemester] = useState(SEMESTERS[1])
  const [calcentralCookie, setCalcentralCookie] = useState('')
  const [showCookieHelp, setShowCookieHelp] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef()

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f?.type === 'application/pdf') setPdfFile(f)
  }

  const handleSubmit = () => {
    if (!pdfFile || !major.trim()) return
    onSubmit({ pdfFile, major: major.trim(), targetUnits, semester, calcentralCookie })
  }

  const isReady = pdfFile && major.trim().length > 0
  const sliderPct = (targetUnits / 22.5) * 100

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', paddingTop: 72, animation: 'fadeUp 0.6s ease forwards' }}>
      <div style={{ marginBottom: 56, textAlign: 'center' }}>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(2.4rem, 5.5vw, 3.8rem)',
          color: 'var(--text-primary)',
          lineHeight: 1.08,
          letterSpacing: '-0.03em',
          marginBottom: 18,
        }}>
          Find your perfect<br />
          <em style={{ color: 'var(--california-gold)' }}>next semester.</em>
        </h1>
        <p style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.75rem',
          color: 'var(--text-secondary)',
          letterSpacing: '0.04em',
          maxWidth: 460,
          margin: '0 auto',
          lineHeight: 1.8,
        }}>
          Upload your degree progress PDF. Six agents analyze Berkeley Time,
          RateMyProfessors, the course catalog, your schedule, and community
          signals — then surface the classes that actually fit.
        </p>
      </div>

      {/* PDF Drop */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        style={{
          border: `1px dashed ${dragOver ? 'var(--california-gold)' : pdfFile ? 'var(--green-signal)' : 'var(--border-bright)'}`,
          borderRadius: 10,
          padding: '40px 24px',
          textAlign: 'center',
          cursor: 'pointer',
          background: dragOver ? 'var(--gold-glow)' : pdfFile ? 'rgba(76,175,110,0.04)' : 'var(--bg-panel)',
          transition: 'all 0.2s',
          marginBottom: 24,
        }}
      >
        <input ref={fileRef} type="file" accept=".pdf" style={{ display: 'none' }}
          onChange={(e) => setPdfFile(e.target.files[0] || null)} />
        {pdfFile ? (
          <>
            <div style={{ fontSize: '1.8rem', marginBottom: 10 }}>📄</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--green-signal)', marginBottom: 4 }}>{pdfFile.name}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{(pdfFile.size / 1024).toFixed(1)} KB · click to replace</div>
          </>
        ) : (
          <>
            <div style={{ width: 40, height: 40, border: '1px solid var(--border-bright)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: '1.1rem' }}>↑</div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.88rem', color: 'var(--text-primary)', marginBottom: 6 }}>Drop your degree progress PDF</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-secondary)' }}>CalCentral → My Academics → Degree Progress → Download PDF</div>
          </>
        )}
      </div>

      {/* Major + Semester */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div>
          <Label>Major / Intended Major</Label>
          <Input placeholder="e.g. Computer Science" value={major} onChange={e => setMajor(e.target.value)} />
        </div>
        <div>
          <Label>Target Semester</Label>
          <Select value={semester} onChange={e => setSemester(e.target.value)}>
            {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
          </Select>
        </div>
      </div>

      {/* Units slider */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>
          <Label style={{ margin: 0 }}>Target Units This Semester</Label>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--california-gold)', letterSpacing: '-0.04em', lineHeight: 1 }}>
            {targetUnits % 1 === 0 ? targetUnits : targetUnits.toFixed(1)}
          </span>
        </div>
        <div style={{ position: 'relative', height: 20, display: 'flex', alignItems: 'center' }}>
          {/* track bg */}
          <div style={{ position: 'absolute', inset: '0 0', height: 2, top: '50%', transform: 'translateY(-50%)', background: 'var(--border)', borderRadius: 1 }} />
          {/* track fill */}
          <div style={{ position: 'absolute', left: 0, width: `${sliderPct}%`, height: 2, top: '50%', transform: 'translateY(-50%)', background: 'var(--california-gold)', borderRadius: 1, transition: 'width 0.05s' }} />
          <input
            type="range" min={0} max={22.5} step={0.5} value={targetUnits}
            onChange={e => setTargetUnits(parseFloat(e.target.value))}
            style={{ position: 'relative', width: '100%', appearance: 'none', WebkitAppearance: 'none', background: 'transparent', cursor: 'pointer', height: 20, margin: 0, zIndex: 1 }}
          />
        </div>
        <style>{`
          input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;border-radius:50%;background:var(--california-gold);border:2px solid var(--bg-base);box-shadow:0 0 0 1px var(--california-gold);cursor:pointer;}
          input[type=range]::-moz-range-thumb{width:16px;height:16px;border-radius:50%;background:var(--california-gold);border:2px solid var(--bg-base);cursor:pointer;border:none;}
          input[type=range]:focus{outline:none;}
        `}</style>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--text-secondary)', opacity: 0.6, marginTop: 6 }}>
          <span>0</span><span>Light 12</span><span>Standard 15</span><span>Heavy 18</span><span>22.5</span>
        </div>
      </div>

      {/* Cookie */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <Label style={{ margin: 0 }}>CalCentral Session Cookie <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>(optional)</span></Label>
          <button onClick={() => setShowCookieHelp(v => !v)} style={{ background: 'none', border: 'none', color: 'var(--blue-signal)', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', cursor: 'pointer', textDecoration: 'underline' }}>
            {showCookieHelp ? 'hide' : 'how to get this →'}
          </button>
        </div>
        {showCookieHelp && (
          <div style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 8, padding: '14px 16px', marginBottom: 10, fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-secondary)', lineHeight: 1.9 }}>
            1. Log in to <span style={{ color: 'var(--text-primary)' }}>calcentral.berkeley.edu</span><br />
            2. Open DevTools (F12) → Application → Cookies → calcentral.berkeley.edu<br />
            3. Copy value of <span style={{ color: 'var(--california-gold)' }}>_calcentral_session</span><br />
            4. Paste below — only used locally for conflict checking, never stored<br />
            <span style={{ color: 'var(--red-signal)', marginTop: 4, display: 'block' }}>⚠ Expires when you log out. Never share publicly.</span>
          </div>
        )}
        <Input placeholder="_calcentral_session=..." value={calcentralCookie} onChange={e => setCalcentralCookie(e.target.value)} type="password" mono />
      </div>

      {/* Submit */}
      <button onClick={handleSubmit} disabled={!isReady} style={{
        width: '100%', padding: '17px 24px',
        background: isReady ? 'var(--california-gold)' : 'transparent',
        color: isReady ? '#08090c' : 'var(--text-secondary)',
        border: `1px solid ${isReady ? 'var(--california-gold)' : 'var(--border)'}`,
        borderRadius: 8, fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.95rem',
        cursor: isReady ? 'pointer' : 'not-allowed', transition: 'all 0.2s', letterSpacing: '-0.01em',
      }}>
        {isReady ? '→  Launch Analysis' : 'Upload PDF and enter your major to continue'}
      </button>
      <p style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-secondary)', opacity: 0.5, marginTop: 14, lineHeight: 1.7 }}>
        PDF processed in-memory, never stored. Session cookie only used for conflict checking.
      </p>
    </div>
  )
}

function Label({ children, style = {} }) {
  return (
    <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, ...style }}>
      {children}
    </label>
  )
}

function Input({ mono, style = {}, ...props }) {
  return (
    <input {...props} style={{
      width: '100%', background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 6,
      padding: '11px 14px', color: 'var(--text-primary)',
      fontFamily: mono ? 'var(--font-mono)' : 'var(--font-body)',
      fontSize: mono ? '0.72rem' : '0.88rem',
      outline: 'none', transition: 'border-color 0.15s', ...style,
    }}
      onFocus={e => e.target.style.borderColor = 'var(--border-bright)'}
      onBlur={e => e.target.style.borderColor = 'var(--border)'}
    />
  )
}

function Select({ children, ...props }) {
  return (
    <select {...props} style={{
      width: '100%', background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 6,
      padding: '11px 14px', color: 'var(--text-primary)', fontFamily: 'var(--font-body)',
      fontSize: '0.88rem', outline: 'none', appearance: 'none', cursor: 'pointer',
    }}>
      {children}
    </select>
  )
}
