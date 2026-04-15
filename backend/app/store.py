from __future__ import annotations

from datetime import date
from typing import Dict, List, Optional
import uuid


class InMemoryStore:
    def __init__(self) -> None:
        self._entries: Dict[str, dict] = {}
        self._seed()

    def _seed(self) -> None:
        example_entries = [
            {
                "id": str(uuid.uuid4()),
                "date": date(2024, 4, 10).isoformat(),
                "person_name": "Samuel Abbey",
                "activity": "Implemented time entry listing UI",
                "hours": 6.5,
            },
            {
                "id": str(uuid.uuid4()),
                "date": date(2024, 4, 9).isoformat(),
                "person_name": "Kofi Mensah",
                "activity": "Backend API design and documentation",
                "hours": 4.0,
            },
            {
                "id": str(uuid.uuid4()),
                "date": date(2024, 4, 9).isoformat(),
                "person_name": "Ama Serwaa",
                "activity": "Testing and QA for time tracker MVP",
                "hours": 3.5,
            },
        ]
        for entry in example_entries:
            self._entries[entry["id"]] = entry

    def list_entries(self) -> List[dict]:
        return sorted(
            self._entries.values(),
            key=lambda e: (e["date"], e["id"]),
            reverse=True,
        )

    def get_entry(self, entry_id: str) -> Optional[dict]:
        return self._entries.get(entry_id)

    def create_entry(self, data: dict) -> dict:
        entry_id = str(uuid.uuid4())
        entry = {"id": entry_id, **data}
        self._entries[entry_id] = entry
        return entry

    def update_entry(self, entry_id: str, data: dict) -> Optional[dict]:
        if entry_id not in self._entries:
            return None
        self._entries[entry_id].update(data)
        return self._entries[entry_id]

    def delete_entry(self, entry_id: str) -> bool:
        if entry_id not in self._entries:
            return False
        del self._entries[entry_id]
        return True


store = InMemoryStore()
