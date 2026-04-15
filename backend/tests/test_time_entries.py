from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_list_time_entries_seed_data_present():
    response = client.get("/api/time-entries")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 2


def test_create_time_entry_success():
    payload = {
        "date": "2024-04-11",
        "person_name": "John Doe",
        "activity": "Code review for time tracker",
        "hours": 2.5,
    }
    response = client.post("/api/time-entries", json=payload)
    assert response.status_code == 201
    body = response.json()
    assert body["person_name"] == payload["person_name"]
    assert body["activity"] == payload["activity"]
    assert body["hours"] == payload["hours"]
    assert "id" in body


def test_create_time_entry_invalid_hours_rejected():
    payload = {
        "date": "2024-04-11",
        "person_name": "John Doe",
        "activity": "Invalid hours test",
        "hours": 0,
    }
    response = client.post("/api/time-entries", json=payload)
    assert response.status_code == 422


def test_update_time_entry_success():
    create_payload = {
        "date": "2024-04-11",
        "person_name": "Jane Doe",
        "activity": "Initial activity",
        "hours": 1.0,
    }
    create_resp = client.post("/api/time-entries", json=create_payload)
    assert create_resp.status_code == 201
    entry_id = create_resp.json()["id"]

    update_payload = {"activity": "Updated activity", "hours": 1.5}
    update_resp = client.put(f"/api/time-entries/{entry_id}", json=update_payload)
    assert update_resp.status_code == 200
    updated = update_resp.json()
    assert updated["activity"] == "Updated activity"
    assert updated["hours"] == 1.5


def test_update_time_entry_not_found():
    update_payload = {"activity": "Updated activity"}
    response = client.put("/api/time-entries/non-existent-id", json=update_payload)
    assert response.status_code == 404
    body = response.json()
    assert body["error"] == "not_found"


def test_delete_time_entry_success():
    create_payload = {
        "date": "2024-04-11",
        "person_name": "Delete Me",
        "activity": "To be deleted",
        "hours": 0.5,
    }
    create_resp = client.post("/api/time-entries", json=create_payload)
    assert create_resp.status_code == 201
    entry_id = create_resp.json()["id"]

    delete_resp = client.delete(f"/api/time-entries/{entry_id}")
    assert delete_resp.status_code == 200
    assert delete_resp.json()["status"] == "deleted"


def test_delete_time_entry_not_found():
    response = client.delete("/api/time-entries/non-existent-id")
    assert response.status_code == 404
    body = response.json()
    assert body["error"] == "not_found"
