import { useTicketStore } from '../store/useTicketStore'
import { STATUSES, type TicketStatus } from '../types'
import TicketItem from './TicketItem'

export default function TicketList() {
  const tickets = useTicketStore((s) => s.tickets)
  const loading = useTicketStore((s) => s.loading)
  const statusFilter = useTicketStore((s) => s.statusFilter)
  const setStatusFilter = useTicketStore((s) => s.setStatusFilter)

  return (
    <section className="ticket-list">
      <div className="list-head">
        <h2>
          Tickets <span className="muted">({tickets.length})</span>
        </h2>
        <label className="inline">
          Show
          <select
            value={statusFilter ?? ''}
            onChange={(e) => setStatusFilter((e.target.value || null) as TicketStatus | null)}
          >
            <option value="">all</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading && tickets.length === 0 ? (
        <p className="muted">Loading tickets…</p>
      ) : tickets.length === 0 ? (
        <p className="muted">No tickets {statusFilter ? `with status "${statusFilter}"` : 'yet'}.</p>
      ) : (
        <ul>
          {tickets.map((t) => (
            <TicketItem key={t.id} ticket={t} />
          ))}
        </ul>
      )}
    </section>
  )
}
