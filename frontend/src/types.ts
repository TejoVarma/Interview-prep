export const PRIORITIES = ['low', 'medium', 'high'] as const
export const STATUSES = ['open', 'in-progress', 'done'] as const

export type TicketPriority = (typeof PRIORITIES)[number]
export type TicketStatus = (typeof STATUSES)[number]

export interface Ticket {
  id: string
  title: string
  description: string | null
  priority: TicketPriority
  status: TicketStatus
  created_date: string
  last_modified_date: string
}

export interface TicketCreate {
  title: string
  description?: string | null
  priority: TicketPriority
}

export type TicketUpdate = Partial<Pick<Ticket, 'title' | 'description' | 'priority' | 'status'>>
