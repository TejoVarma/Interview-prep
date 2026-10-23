from fastapi import FastAPI

from app.api import tickets

app = FastAPI(title="Support Ticket Tracker")

app.include_router(tickets.router)


@app.get("/health")
def health():
    return {"status": "ok"}
