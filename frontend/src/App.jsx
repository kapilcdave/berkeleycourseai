import { useState, useCallback } from 'react'
import InputPanel from './components/InputPanel.jsx'
import AgentDashboard from './components/AgentDashboard.jsx'
import ResultsView from './components/ResultsView.jsx'
import Header from './components/Header.jsx'
import { runPipeline } from './lib/pipeline.js'

const PHASE = { INPUT: 'input', RUNNING: 'running', RESULTS: 'results' }

export default function App() {
  const [phase, setPhase] = useState(PHASE.INPUT)
  const [agentStates, setAgentStates] = useState({})
  const [results, setResults] = useState(null)
  const [parsedProfile, setParsedProfile] = useState(null)
  const [submitError, setSubmitError] = useState('')

  const updateAgent = useCallback((agentId, update) => {
    setAgentStates(prev => ({
      ...prev,
      [agentId]: { ...prev[agentId], ...update }
    }))
  }, [])

  const handleSubmit = useCallback(async ({ pdfFile, major, targetUnits, semester, calcentralCookie }) => {
    setSubmitError('')
    setPhase(PHASE.RUNNING)
    setAgentStates({})
    setResults(null)
    setParsedProfile(null)

    try {
      const finalResults = await runPipeline({
        pdfFile,
        major,
        targetUnits,
        semester,
        calcentralCookie,
        onAgentUpdate: updateAgent,
        onProfileParsed: setParsedProfile,
      })
      setResults(finalResults)
      setPhase(PHASE.RESULTS)
    } catch (err) {
      console.error('Pipeline error:', err)
      setSubmitError(err.userMessage || err.message || 'The analysis could not start.')
      setPhase(PHASE.INPUT)
    }
  }, [updateAgent])

  const handleReset = useCallback(() => {
    setPhase(PHASE.INPUT)
    setAgentStates({})
    setResults(null)
    setParsedProfile(null)
    setSubmitError('')
  }, [])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header phase={phase} parsedProfile={parsedProfile} onReset={handleReset} />

      <main style={{ flex: 1, padding: '0 24px 48px' }}>
        {phase === PHASE.INPUT && (
          <InputPanel onSubmit={handleSubmit} errorMessage={submitError} />
        )}
        {phase === PHASE.RUNNING && (
          <AgentDashboard agentStates={agentStates} parsedProfile={parsedProfile} />
        )}
        {phase === PHASE.RESULTS && results && (
          <ResultsView results={results} parsedProfile={parsedProfile} agentStates={agentStates} />
        )}
      </main>
    </div>
  )
}
