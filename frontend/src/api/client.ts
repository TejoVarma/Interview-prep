import axios from 'axios'
import type { Ticket, TicketCreate, TicketStatus, TicketUpdate } from '../types'

const api = axios.create({ baseURL: '/api', timeout: 10000 })

export async function listTickets(status?: TicketStatus) {
  const { data } = await api.get<Ticket[]>('/tickets', { params: status ? { status } : undefined })
  return data
}

export async function createTicket(ticket: TicketCreate) {
  const { data } = await api.post<Ticket>('/tickets', ticket)
  return data
}

export async function updateTicket(id: string, changes: TicketUpdate) {
  const { data } = await api.patch<Ticket>(`/tickets/${id}`, changes)
  return data
}

export async function deleteTicket(id: string) {
  await api.delete(`/tickets/${id}`)
}
