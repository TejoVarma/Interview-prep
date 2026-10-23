from uuid import UUID

from app.db.supabase import supabase
from app.schemas.tickets import Priority, Status, TicketCreate, TicketUpdate

TABLE = "tickets"


def list_tickets(status: Status | None = None, priority: Priority | None = None) -> list[dict]:
    query = supabase.table(TABLE).select("*").order("created_date", desc=True)
    if status:
        query = query.eq("status", status.value)
    if priority:
        query = query.eq("priority", priority.value)
    return query.execute().data


def get_ticket(ticket_id: UUID) -> dict | None:
    rows = supabase.table(TABLE).select("*").eq("id", str(ticket_id)).limit(1).execute().data
    return rows[0] if rows else None


def create_ticket(ticket: TicketCreate) -> dict:
    return supabase.table(TABLE).insert(ticket.model_dump(mode="json")).execute().data[0]


def update_ticket(ticket_id: UUID, changes: TicketUpdate) -> dict | None:
    rows = (
        supabase.table(TABLE)
        .update(changes.model_dump(mode="json", exclude_unset=True))
        .eq("id", str(ticket_id))
        .execute()
        .data
    )
    return rows[0] if rows else None


def delete_ticket(ticket_id: UUID) -> bool:
    rows = supabase.table(TABLE).delete().eq("id", str(ticket_id)).execute().data
    return bool(rows)
