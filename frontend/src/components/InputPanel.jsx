import { useEffect, useRef, useState } from 'react'

const SEMESTERS = ['Fall 2025', 'Spring 2026', 'Summer 2026', 'Fall 2026']

export default function InputPanel({ onSubmit, errorMessage }) {
  const [pdfFile, setPdfFile] = useState(null)
  const [major, setMajor] = useState('')
  const [targetUnits, setTargetUnits] = useState(15)
  const [semester, setSemester] = useState(SEMESTERS[1])
  const [calcentralCookie, setCalcentralCookie] = useState('')
  const [showCookieHelp, setShowCookieHelp] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef()
  const isCompact = useCompactLayout(980)

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f?.type === 'application/pdf') setPdfFile(f)
  }

  const handleSubmit = () => {
    if (!pdfFile || !major.trim()) return
    onSubmit({
      pdfFile,
      major: major.trim(),
      targetUnits: Number(targetUnits),
      semester,
      calcentralCookie,
    })
  }

  const isReady = pdfFile && major.trim().length > 0
  const unitLabel = Number.isInteger(targetUnits) ? `${targetUnits}` : targetUnits.toFixed(1)

  return (
    <div style={{
      maxWidth: 1180,
      margin: '0 auto',
      paddingTop: 48,
      animation: 'fadeUp 0.6s ease forwards',
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: isCompact ? '1fr' : 'minmax(0, 1.15fr) minmax(360px, 0.85fr)',
        gap: 24,
        alignItems: 'start',
      }}>
        <section style={{
          background: 'linear-gradient(180deg, rgba(18, 33, 49, 0.92), rgba(10, 20, 31, 0.98))',
          border: '1px solid var(--border)',
          borderRadius: 26,
          padding: '34px 34px 30px',
          boxShadow: 'var(--shadow-panel)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute',
            inset: 'auto -120px -140px auto',
            width: 280,
            height: 280,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(253,181,21,0.18), transparent 70%)',
            pointerEvents: 'none',
          }} />

          <div style={{ marginBottom: 28 }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              borderRadius: 999,
              border: '1px solid rgba(126, 215, 208, 0.18)',
              background: 'rgba(126, 215, 208, 0.08)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.66rem',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--cyan-signal)',
              marginBottom: 18,
            }}>
              <span style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: 'var(--cyan-signal)',
                display: 'inline-block',
              }} />
              Ready to orchestrate
            </div>

            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2.9rem, 6vw, 4.8rem)',
              color: 'var(--text-primary)',
              lineHeight: 1,
              letterSpacing: '-0.04em',
              marginBottom: 18,
              maxWidth: 700,
            }}>
              Build a Berkeley schedule that looks deliberate.
            </h1>

            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: '1rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.75,
              maxWidth: 660,
            }}>
              Upload your degree progress PDF, define your semester load, and let the orchestration stack narrow the catalog into a schedule that satisfies requirements, avoids conflicts, and still looks sane.
            </p>
          </div>

          {errorMessage && (
            <div style={{
              marginBottom: 20,
              borderRadius: 18,
              border: '1px solid rgba(222, 106, 95, 0.26)',
              background: 'rgba(222, 106, 95, 0.08)',
              padding: '16px 18px',
            }}>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.68rem',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: 'var(--red-signal)',
                marginBottom: 8,
              }}>
                Setup needed
              </div>
              <p style={{
                fontSize: '0.92rem',
                lineHeight: 1.6,
                color: 'var(--text-primary)',
              }}>
                {errorMessage}
              </p>
            </div>
          )}

          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            style={{
              border: `1px dashed ${dragOver ? 'var(--california-gold)' : pdfFile ? 'rgba(105,196,139,0.45)' : 'var(--border-bright)'}`,
              borderRadius: 20,
              padding: '28px 24px',
              textAlign: 'left',
              cursor: 'pointer',
              background: dragOver
                ? 'rgba(253, 181, 21, 0.08)'
                : pdfFile
                  ? 'rgba(105,196,139,0.08)'
                  : 'rgba(255,255,255,0.02)',
              transition: 'all 0.2s',
              marginBottom: 22,
            }}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".pdf"
              style={{ display: 'none' }}
              onChange={(e) => setPdfFile(e.target.files[0])}
            />

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              flexWrap: 'wrap',
            }}>
              <div>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.64rem',
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  marginBottom: 10,
                }}>
                  Degree progress source
                </div>
                <div style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '1rem',
                  color: 'var(--text-primary)',
                  marginBottom: 6,
                }}>
                  {pdfFile ? pdfFile.name : 'Drop your CalCentral PDF here or click to browse'}
                </div>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.7rem',
                  color: pdfFile ? 'var(--green-signal)' : 'var(--text-secondary)',
                }}>
                  {pdfFile
                    ? `${(pdfFile.size / 1024).toFixed(1)} KB uploaded`
                    : 'CalCentral -> My Academics -> Degree Progress -> Download as PDF'}
                </div>
              </div>

              <div style={{
                minWidth: 160,
                padding: '12px 14px',
                borderRadius: 16,
                border: '1px solid var(--border)',
                background: 'rgba(0,0,0,0.16)',
              }}>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.58rem',
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  marginBottom: 6,
                }}>
                  Parser status
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.85rem',
                  color: pdfFile ? 'var(--green-signal)' : 'var(--text-primary)',
                }}>
                  <span style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: pdfFile ? 'var(--green-signal)' : 'var(--text-secondary)',
                    display: 'inline-block',
                  }} />
                  {pdfFile ? 'Ready to parse' : 'Waiting for PDF'}
                </div>
              </div>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: isCompact ? '1fr' : '1fr 1fr',
            gap: 16,
            marginBottom: 18,
          }}>
            <Field label="Major / Intended Major">
              <Input
                placeholder="e.g. Computer Science"
                value={major}
                onChange={e => setMajor(e.target.value)}
              />
            </Field>

            <Field label="Target Semester">
              <Select value={semester} onChange={e => setSemester(e.target.value)}>
                {SEMESTERS.map(s => <option key={s} value={s}>{s}</option>)}
              </Select>
            </Field>
          </div>

          <div style={{
            marginBottom: 22,
            borderRadius: 20,
            border: '1px solid var(--border)',
            background: 'rgba(255,255,255,0.02)',
            padding: '18px 18px 16px',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              marginBottom: 14,
              flexWrap: 'wrap',
            }}>
              <Label>Target Units</Label>
              <div style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 8,
              }}>
                <span style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '2rem',
                  color: 'var(--california-gold)',
                  letterSpacing: '-0.04em',
                  lineHeight: 1,
                }}>
                  {unitLabel}
                </span>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.68rem',
                  color: 'var(--text-secondary)',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                }}>
                  units
                </span>
              </div>
            </div>

            <input
              type="range"
              min="0"
              max="22.5"
              step="0.5"
              value={targetUnits}
              onChange={e => setTargetUnits(Number(e.target.value))}
            />

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: 10,
              fontFamily: 'var(--font-mono)',
              fontSize: '0.62rem',
              color: 'var(--text-secondary)',
            }}>
              <span>0</span>
              <span>11.5</span>
              <span>22.5</span>
            </div>
          </div>

          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, gap: 12 }}>
              <Label>
                CalCentral Session Cookie <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>(optional for conflict checking)</span>
              </Label>
              <button
                onClick={() => setShowCookieHelp(v => !v)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--blue-signal)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.66rem',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                How to get this
              </button>
            </div>

            {showCookieHelp && (
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border)',
                borderRadius: 16,
                padding: 16,
                marginBottom: 12,
                fontFamily: 'var(--font-mono)',
                fontSize: '0.68rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.9,
              }}>
                1. Log in to CalCentral in Chrome or Firefox.<br />
                2. Open DevTools {'->'} Application {'->'} Cookies {'->'} calcentral.berkeley.edu.<br />
                3. Copy the <span style={{ color: 'var(--california-gold)' }}>_calcentral_session</span> value.<br />
                4. Paste it below to enable schedule conflict checks.
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

          <button
            onClick={handleSubmit}
            disabled={!isReady}
            style={{
              width: '100%',
              padding: '18px 24px',
              background: isReady
                ? 'linear-gradient(90deg, rgba(253,181,21,1), rgba(247,207,109,1))'
                : 'rgba(255,255,255,0.04)',
              color: isReady ? '#09131d' : 'var(--text-secondary)',
              border: `1px solid ${isReady ? 'rgba(253,181,21,0.8)' : 'var(--border)'}`,
              borderRadius: 18,
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
              fontSize: '1rem',
              cursor: isReady ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
              letterSpacing: '-0.01em',
            }}
          >
            {isReady ? 'Launch orchestration' : 'Upload a PDF and add your major to continue'}
          </button>

          <p style={{
            textAlign: 'center',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.62rem',
            color: 'var(--text-secondary)',
            marginTop: 14,
            lineHeight: 1.7,
          }}>
            PDFs are parsed in memory and discarded. Schedule cookies are only used for conflict checks.
          </p>
        </section>

        <aside style={{
          display: 'grid',
          gap: 18,
        }}>
          <SystemCard />
          <ExampleScheduleCard />
        </aside>
      </div>
    </div>
  )
}

function SystemCard() {
  const layers = [
    { label: 'Intake', detail: 'PDF parse + profile extraction', color: 'var(--cyan-signal)' },
    { label: 'Filter', detail: 'Requirement map + live course inventory', color: 'var(--california-gold)' },
    { label: 'Enrich', detail: 'GPA, RMP, Reddit, conflict scan', color: 'var(--blue-signal)' },
    { label: 'Rank', detail: 'Compose viable schedules + score tradeoffs', color: 'var(--green-signal)' },
  ]

  return (
    <div style={{
      background: 'linear-gradient(180deg, rgba(18, 33, 49, 0.9), rgba(10, 20, 31, 0.96))',
      border: '1px solid var(--border)',
      borderRadius: 24,
      padding: 24,
      boxShadow: 'var(--shadow-panel)',
    }}>
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '0.64rem',
        color: 'var(--text-secondary)',
        textTransform: 'uppercase',
        letterSpacing: '0.14em',
        marginBottom: 16,
      }}>
        Orchestration map
      </div>

      <div style={{ display: 'grid', gap: 12 }}>
        {layers.map((layer, index) => (
          <div key={layer.label} style={{
            display: 'grid',
            gridTemplateColumns: '54px 1fr',
            gap: 14,
            alignItems: 'center',
          }}>
            <div style={{
              height: 54,
              width: 54,
              borderRadius: 16,
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.03)',
              display: 'grid',
              placeItems: 'center',
              fontFamily: 'var(--font-display)',
              fontSize: '1.3rem',
              color: layer.color,
            }}>
              {index + 1}
            </div>

            <div style={{
              borderRadius: 16,
              border: '1px solid var(--border)',
              background: 'rgba(255,255,255,0.02)',
              padding: '12px 14px',
            }}>
              <div style={{ fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: 4 }}>
                {layer.label}
              </div>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.68rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
              }}>
                {layer.detail}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ExampleScheduleCard() {
  const schedule = [
    { time: '09:30', course: 'CS 170', room: 'Soda 306', units: '4.0u', tone: 'var(--california-gold)' },
    { time: '11:00', course: 'DATA C104', room: 'Evans 10', units: '4.0u', tone: 'var(--cyan-signal)' },
    { time: '13:00', course: 'UGBA 10', room: 'Wheeler 150', units: '3.0u', tone: 'var(--blue-signal)' },
    { time: '15:00', course: 'ART W23AC', room: 'Online', units: '1.5u', tone: 'var(--green-signal)' },
  ]

  return (
    <div style={{
      background: 'linear-gradient(180deg, rgba(18, 33, 49, 0.9), rgba(10, 20, 31, 0.96))',
      border: '1px solid var(--border)',
      borderRadius: 24,
      padding: 24,
      boxShadow: 'var(--shadow-panel)',
      overflow: 'hidden',
      position: 'relative',
    }}>
      <div style={{
        position: 'absolute',
        inset: '-40px auto auto 58%',
        width: 180,
        height: 180,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(126,215,208,0.14), transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '0.64rem',
        color: 'var(--text-secondary)',
        textTransform: 'uppercase',
        letterSpacing: '0.14em',
        marginBottom: 16,
      }}>
        Example schedule output
      </div>

      <div style={{
        borderRadius: 20,
        border: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(5, 12, 18, 0.52)',
        padding: 18,
        marginBottom: 16,
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 16,
          gap: 12,
        }}>
          <div>
            <div style={{ fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: 4 }}>
              Tuesday / Thursday lane
            </div>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.68rem',
              color: 'var(--text-secondary)',
            }}>
              Balanced for 12.5 units, two breadth hits, zero conflicts
            </div>
          </div>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: '2rem',
            color: 'var(--california-gold)',
            letterSpacing: '-0.04em',
          }}>
            92
          </div>
        </div>

        <div style={{ display: 'grid', gap: 10 }}>
          {schedule.map((item) => (
            <div key={item.time + item.course} style={{
              display: 'grid',
              gridTemplateColumns: '62px 1fr auto',
              gap: 12,
              alignItems: 'center',
              padding: '12px 12px',
              borderRadius: 14,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                color: 'var(--text-secondary)',
              }}>
                {item.time}
              </div>
              <div>
                <div style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.92rem',
                  color: item.tone,
                  fontWeight: 600,
                  marginBottom: 3,
                }}>
                  {item.course}
                </div>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.66rem',
                  color: 'var(--text-secondary)',
                }}>
                  {item.room}
                </div>
              </div>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.68rem',
                color: 'var(--text-primary)',
              }}>
                {item.units}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
        gap: 10,
      }}>
        {[
          ['Breadth fit', '2 / 2'],
          ['Double counts', '1'],
          ['Idle gaps', '35 min'],
        ].map(([label, value]) => (
          <div key={label} style={{
            borderRadius: 16,
            border: '1px solid var(--border)',
            background: 'rgba(255,255,255,0.02)',
            padding: '12px 12px',
          }}>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.3rem',
              color: 'var(--text-primary)',
              marginBottom: 6,
              lineHeight: 1,
            }}>
              {value}
            </div>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.62rem',
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}>
              {label}
            </div>
          </div>
        ))}
      </div>
    </div>
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

function Field({ label, children }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
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
      letterSpacing: '0.12em',
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
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: '14px 16px',
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-body)',
        fontSize: '0.92rem',
        outline: 'none',
        transition: 'border-color 0.15s, background 0.15s',
        ...style,
      }}
      onFocus={e => {
        e.target.style.borderColor = 'var(--border-bright)'
        e.target.style.background = 'rgba(255,255,255,0.05)'
      }}
      onBlur={e => {
        e.target.style.borderColor = 'var(--border)'
        e.target.style.background = 'rgba(255,255,255,0.03)'
      }}
    />
  )
}

function Select({ children, ...props }) {
  return (
    <select
      {...props}
      style={{
        width: '100%',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: '14px 16px',
        color: 'var(--text-primary)',
        outline: 'none',
      }}
    >
      {children}
    </select>
  )
}
