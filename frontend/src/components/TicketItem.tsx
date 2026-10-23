import { useState } from 'react'
import { useTicketStore } from '../store/useTicketStore'
import { PRIORITIES, STATUSES, type Ticket, type TicketPriority, type TicketStatus } from '../types'

const dateFormat = new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' })

export default function TicketItem({ ticket }: { ticket: Ticket }) {
  const updateTicket = useTicketStore((s) => s.updateTicket)
  const deleteTicket = useTicketStore((s) => s.deleteTicket)
  const [busy, setBusy] = useState(false)

  async function run(action: () => Promise<void>) {
    setBusy(true)
    await action()
    setBusy(false)
  }

  function handleDelete() {
    if (window.confirm(`Delete "${ticket.title}"?`)) {
      run(() => deleteTicket(ticket.id))
    }
  }

  const edited = ticket.last_modified_date !== ticket.created_date

  return (
    <li className={`card ticket status-${ticket.status}`}>
      <div className="ticket-head">
        <h3>{ticket.title}</h3>
        <span className={`badge priority-${ticket.priority}`}>{ticket.priority}</span>
      </div>

      {ticket.description && <p className="ticket-desc">{ticket.description}</p>}

      <div className="ticket-controls">
        <label>
          Status
          <select
            value={ticket.status}
            disabled={busy}
            onChange={(e) => run(() => updateTicket(ticket.id, { status: e.target.value as TicketStatus }))}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <label>
          Priority
          <select
            value={ticket.priority}
            disabled={busy}
            onChange={(e) =>
              run(() => updateTicket(ticket.id, { priority: e.target.value as TicketPriority }))
            }
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>

        <button type="button" className="danger" disabled={busy} onClick={handleDelete}>
          Delete
        </button>
      </div>

      <p className="ticket-meta muted">
        Created {dateFormat.format(new Date(ticket.created_date))}
        {edited && <> · Updated {dateFormat.format(new Date(ticket.last_modified_date))}</>}
      </p>
    </li>
  )
}
