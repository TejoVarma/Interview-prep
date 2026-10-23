import { create } from 'zustand'
import * as api from '../api/client'
import type { Ticket, TicketCreate, TicketStatus, TicketUpdate } from '../types'
import { normalizeApiError } from '../utils/normalizeApiError'

interface TicketState {
  tickets: Ticket[]
  statusFilter: TicketStatus | null
  loading: boolean
  error: string | null

  fetchTickets: () => Promise<void>
  setStatusFilter: (status: TicketStatus | null) => Promise<void>
  createTicket: (ticket: TicketCreate) => Promise<boolean>
  updateTicket: (id: string, changes: TicketUpdate) => Promise<void>
  deleteTicket: (id: string) => Promise<void>
  clearError: () => void
}

export const useTicketStore = create<TicketState>((set, get) => ({
  tickets: [],
  statusFilter: null,
  loading: false,
  error: null,

  fetchTickets: async () => {
    set({ loading: true, error: null })
    try {
      const tickets = await api.listTickets(get().statusFilter ?? undefined)
      set({ tickets })
    } catch (err) {
      set({ error: normalizeApiError(err) })
    } finally {
      set({ loading: false })
    }
  },

  setStatusFilter: async (status) => {
    set({ statusFilter: status })
    await get().fetchTickets()
  },

  createTicket: async (ticket) => {
    try {
      const created = await api.createTicket(ticket)
      const { statusFilter } = get()
      if (!statusFilter || statusFilter === created.status) {
        set((state) => ({ tickets: [created, ...state.tickets], error: null }))
      }
      return true
    } catch (err) {
      set({ error: normalizeApiError(err) })
      return false
    }
  },

  updateTicket: async (id, changes) => {
    try {
      const updated = await api.updateTicket(id, changes)
      const { statusFilter } = get()
      set((state) => ({
        error: null,
        // a ticket whose new status no longer matches the filter drops out of the list
        tickets:
          statusFilter && updated.status !== statusFilter
            ? state.tickets.filter((t) => t.id !== id)
            : state.tickets.map((t) => (t.id === id ? updated : t)),
      }))
    } catch (err) {
      set({ error: normalizeApiError(err) })
    }
  },

  deleteTicket: async (id) => {
    try {
      await api.deleteTicket(id)
      set((state) => ({ tickets: state.tickets.filter((t) => t.id !== id), error: null }))
    } catch (err) {
      set({ error: normalizeApiError(err) })
    }
  },

  clearError: () => set({ error: null }),
}))
