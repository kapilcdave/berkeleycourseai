import { useState, useRef } from 'react'

const SEMESTERS = ['Fall 2025', 'Spring 2026', 'Summer 2026', 'Fall 2026']

export default function InputPanel({ onSubmit }) {
  const [pdfFile, setPdfFile] = useState(null)
  const [major, setMajor] = useState('')
  const [targetUnits, setTargetUnits] = useState('15')
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
    onSubmit({ pdfFile, major: major.trim(), targetUnits: parseInt(targetUnits), semester, calcentralCookie })
  }

  const isReady = pdfFile && major.trim().length > 0

  return (
    <div style={{
      maxWidth: 760,
      margin: '0 auto',
      paddingTop: 64,
      animation: 'fadeUp 0.6s ease forwards',
    }}>
      {/* Hero */}
      <div style={{ marginBottom: 48, textAlign: 'center' }}>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(2.5rem, 6vw, 4rem)',
          color: 'var(--text-primary)',
          lineHeight: 1.1,
          letterSpacing: '-0.03em',
          marginBottom: 16,
        }}>
          Find your perfect<br />
          <em style={{ color: 'var(--california-gold)' }}>next semester.</em>
        </h1>
        <p style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.8rem',
          color: 'var(--text-secondary)',
          letterSpacing: '0.05em',
          maxWidth: 480,
          margin: '0 auto',
          lineHeight: 1.7,
        }}>
          Upload your degree progress PDF. Six agents will analyze Berkeley Time,<br />
          RateMyProfessors, the course catalog, your schedule, and more —<br />
          then surface the classes that actually fit your life.
        </p>
      </div>

      {/* PDF Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        style={{
          border: `1px dashed ${dragOver ? 'var(--california-gold)' : pdfFile ? 'var(--green-signal)' : 'var(--border-bright)'}`,
          borderRadius: 8,
          padding: '36px 24px',
          textAlign: 'center',
          cursor: 'pointer',
          background: dragOver ? 'var(--gold-glow)' : pdfFile ? 'rgba(76,175,110,0.05)' : 'var(--bg-panel)',
          transition: 'all 0.2s',
          marginBottom: 24,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".pdf"
          style={{ display: 'none' }}
          onChange={(e) => setPdfFile(e.target.files[0])}
        />
        {pdfFile ? (
          <>
            <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>📄</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--green-signal)' }}>
              {pdfFile.name}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: 4 }}>
              {(pdfFile.size / 1024).toFixed(1)} KB — click to replace
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: '2rem', marginBottom: 12, opacity: 0.5 }}>⬆</div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: 6 }}>
              Drop your degree progress PDF
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
              CalCentral → Degree Progress → Download as PDF
            </div>
          </>
        )}
      </div>

      {/* Form Fields */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div>
          <Label>Major / Intended Major</Label>
          <Input
            placeholder="e.g. Computer Science"
            value={major}
            onChange={e => setMajor(e.target.value)}
          />
        </div>
        <div>
          <Label>Target Semester</Label>
          <Select value={semester} onChange={e => setSemester(e.target.value)}>
            {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
          </Select>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Label>Target Units (this semester)</Label>
        <div style={{ display: 'flex', gap: 8 }}>
          {['12', '13', '14', '15', '16', '17', '18'].map(u => (
            <button
              key={u}
              onClick={() => setTargetUnits(u)}
              style={{
                flex: 1,
                padding: '10px 0',
                border: `1px solid ${targetUnits === u ? 'var(--california-gold)' : 'var(--border)'}`,
                borderRadius: 6,
                background: targetUnits === u ? 'var(--gold-glow)' : 'var(--bg-panel)',
                color: targetUnits === u ? 'var(--california-gold)' : 'var(--text-secondary)',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {u}
            </button>
          ))}
        </div>
      </div>

      {/* CalCentral Cookie */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <Label>CalCentral Session Cookie <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>(optional — for conflict checking)</span></Label>
          <button
            onClick={() => setShowCookieHelp(v => !v)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--blue-signal)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.65rem',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            How to get this?
          </button>
        </div>
        {showCookieHelp && (
          <div style={{
            background: 'var(--bg-panel)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            padding: 16,
            marginBottom: 10,
            fontFamily: 'var(--font-mono)',
            fontSize: '0.68rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.8,
          }}>
            1. Log in to CalCentral in Chrome/Firefox<br />
            2. Open DevTools (F12) → Application tab → Cookies → calcentral.berkeley.edu<br />
            3. Copy the value of the <span style={{ color: 'var(--california-gold)' }}>_calcentral_session</span> cookie<br />
            4. Paste it below — it's only sent to our serverless function to check your schedule<br />
            <span style={{ color: 'var(--red-signal)', marginTop: 8, display: 'block' }}>⚠ Never share this value publicly. It expires when you log out.</span>
          </div>
        )}
        <Input
          placeholder="_calcentral_session=..."
          value={calcentralCookie}
          onChange={e => setCalcentralCookie(e.target.value)}
          type="password"
          style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}
        />
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!isReady}
        style={{
          width: '100%',
          padding: '18px 24px',
          background: isReady ? 'var(--california-gold)' : 'var(--bg-panel)',
          color: isReady ? 'var(--bg-base)' : 'var(--text-secondary)',
          border: `1px solid ${isReady ? 'var(--california-gold)' : 'var(--border)'}`,
          borderRadius: 8,
          fontFamily: 'var(--font-body)',
          fontWeight: 600,
          fontSize: '1rem',
          cursor: isReady ? 'pointer' : 'not-allowed',
          transition: 'all 0.2s',
          letterSpacing: '-0.01em',
        }}
      >
        {isReady ? '→ Launch Analysis' : 'Upload PDF and enter your major to continue'}
      </button>

      <p style={{
        textAlign: 'center',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.62rem',
        color: 'var(--text-secondary)',
        marginTop: 16,
        lineHeight: 1.7,
      }}>
        Your PDF is processed server-side and never stored. Session cookies are used only for schedule conflict checking.
      </p>
    </div>
  )
}

function Label({ children }) {
  return (
    <label style={{
      display: 'block',
      fontFamily: 'var(--font-mono)',
      fontSize: '0.68rem',
      color: 'var(--text-secondary)',
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      marginBottom: 8,
    }}>
      {children}
    </label>
  )
}

function Input({ style = {}, ...props }) {
  return (
    <input
      {...props}
      style={{
        width: '100%',
        background: 'var(--bg-panel)',
        border: '1px solid var(--border)',
        borderRadius: 6,
        padding: '12px 14px',
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-body)',
        fontSize: '0.9rem',
        outline: 'none',
        transition: 'border-color 0.15s',
        ...style,
      }}
      onFocus={e => e.target.style.borderColor = 'var(--border-bright)'}
      onBlur={e => e.target.style.borderColor = 'var(--border)'}
    />
  )
}

function Select({ children, ...props }) {
  return (
    <select
      {...props}
      style={{
        width: '100%',
        background: 'var(--bg-panel)',
        border: '1px solid var(--border)',
        borderRadius: 6,
        padding: '12px 14px',
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-body)',
        fontSize: '0.9rem',
        outline: 'none',
        appearance: 'none',
        cursor: 'pointer',
      }}
    >
      {children}
    </select>
  )
}
