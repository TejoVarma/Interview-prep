import { useState, type FormEvent } from 'react'
import { useTicketStore } from '../store/useTicketStore'
import { PRIORITIES, type TicketPriority } from '../types'

export default function TicketForm() {
  const createTicket = useTicketStore((s) => s.createTicket)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TicketPriority>('medium')
  const [submitting, setSubmitting] = useState(false)
  const [titleError, setTitleError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      setTitleError('Title is required')
      return
    }

    setSubmitting(true)
    const ok = await createTicket({
      title: title.trim(),
      description: description.trim() || null,
      priority,
    })
    setSubmitting(false)

    if (ok) {
      setTitle('')
      setDescription('')
      setPriority('medium')
    }
  }

  return (
    <form className="card ticket-form" onSubmit={handleSubmit} noValidate>
      <h2>New ticket</h2>

      <label>
        Title
        <input
          value={title}
          maxLength={200}
          placeholder="e.g. Can't reset password"
          onChange={(e) => {
            setTitle(e.target.value)
            setTitleError(null)
          }}
          aria-invalid={titleError ? true : undefined}
        />
      </label>
      {titleError && <p className="field-error">{titleError}</p>}

      <label>
        Description <span className="muted">(optional)</span>
        <textarea
          value={description}
          maxLength={5000}
          rows={3}
          onChange={(e) => setDescription(e.target.value)}
        />
      </label>

      <label>
        Priority
        <select value={priority} onChange={(e) => setPriority(e.target.value as TicketPriority)}>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </label>

      <button type="submit" disabled={submitting}>
        {submitting ? 'Creating…' : 'Create ticket'}
      </button>
    </form>
  )
}
