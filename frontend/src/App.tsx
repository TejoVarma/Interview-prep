import { useEffect } from 'react'
import TicketForm from './components/TicketForm'
import TicketList from './components/TicketList'
import { useTicketStore } from './store/useTicketStore'

export default function App() {
  const fetchTickets = useTicketStore((s) => s.fetchTickets)
  const error = useTicketStore((s) => s.error)
  const clearError = useTicketStore((s) => s.clearError)

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  return (
    <main className="app">
      <header>
        <h1>Support Ticket Tracker</h1>
      </header>

      {error && (
        <div className="error-banner" role="alert">
          <span>{error}</span>
          <button type="button" onClick={clearError} aria-label="Dismiss error">
            ×
          </button>
        </div>
      )}

      <div className="layout">
        <TicketForm />
        <TicketList />
      </div>
    </main>
  )
}
