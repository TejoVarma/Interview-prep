from uuid import UUID

from fastapi import APIRouter, HTTPException, Response

from app.schemas.tickets import Priority, Status, TicketCreate, TicketResponse, TicketUpdate
from app.services import tickets as service

router = APIRouter(prefix="/tickets", tags=["tickets"])


def _not_found() -> HTTPException:
    return HTTPException(status_code=404, detail="Ticket not found")


@router.get("", response_model=list[TicketResponse])
def list_tickets(status: Status | None = None, priority: Priority | None = None):
    return service.list_tickets(status, priority)


@router.get("/{ticket_id}", response_model=TicketResponse)
def get_ticket(ticket_id: UUID):
    ticket = service.get_ticket(ticket_id)
    if ticket is None:
        raise _not_found()
    return ticket


@router.post("", response_model=TicketResponse, status_code=201)
def create_ticket(payload: TicketCreate):
    return service.create_ticket(payload)


@router.patch("/{ticket_id}", response_model=TicketResponse)
def update_ticket(ticket_id: UUID, payload: TicketUpdate):
    ticket = service.update_ticket(ticket_id, payload)
    if ticket is None:
        raise _not_found()
    return ticket


@router.delete("/{ticket_id}", status_code=204)
def delete_ticket(ticket_id: UUID):
    if not service.delete_ticket(ticket_id):
        raise _not_found()
    return Response(status_code=204)
