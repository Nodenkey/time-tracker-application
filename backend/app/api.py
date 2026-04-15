from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

from .models import TimeEntry, TimeEntryCreate, TimeEntryUpdate
from .store import store

router = APIRouter(prefix="/api/time-entries", tags=["time-entries"])


@router.get("", response_model=list[TimeEntry])
async def list_time_entries() -> list[TimeEntry]:
    """Return all time entries sorted by newest date first, then id."""
    return [TimeEntry(**entry) for entry in store.list_entries()]


@router.post("", response_model=TimeEntry, status_code=status.HTTP_201_CREATED)
async def create_time_entry(payload: TimeEntryCreate) -> TimeEntry:
    """Create a new time entry from the provided payload."""
    entry_dict = payload.model_dump()
    created = store.create_entry(entry_dict)
    return TimeEntry(**created)


@router.put("/{entry_id}", response_model=TimeEntry)
async def update_time_entry(entry_id: str, payload: TimeEntryUpdate) -> TimeEntry:
    """Update an existing time entry by id.

    Raises 404 if the entry does not exist.
    """
    existing = store.get_entry(entry_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": "not_found",
                "message": f"Time entry with id {entry_id} does not exist",
                "detail": None,
            },
        )

    updated_data = payload.model_dump(exclude_unset=True)
    updated = store.update_entry(entry_id, updated_data)
    assert updated is not None
    return TimeEntry(**updated)


@router.delete("/{entry_id}")
async def delete_time_entry(entry_id: str) -> dict:
    """Delete a time entry by id.

    Returns a confirmation object or 404 if not found.
    """
    deleted = store.delete_entry(entry_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": "not_found",
                "message": f"Time entry with id {entry_id} does not exist",
                "detail": None,
            },
        )
    return {"status": "deleted", "id": entry_id}
