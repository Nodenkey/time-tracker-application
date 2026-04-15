from __future__ import annotations

from datetime import date
from typing import Optional

from pydantic import BaseModel, Field, field_validator, model_validator


class TimeEntryBase(BaseModel):
    date: date = Field(..., description="Entry date as ISO date string (YYYY-MM-DD)")
    person_name: str = Field(..., min_length=1, description="Name of the person logging time")
    activity: str = Field(..., min_length=1, description="Description of the activity performed")
    hours: float = Field(..., gt=0, description="Number of hours spent, must be positive")

    @field_validator("person_name", "activity")
    @classmethod
    def not_blank(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("must not be blank")
        return v.strip()


class TimeEntryCreate(TimeEntryBase):
    """Payload model for creating a new time entry."""


class TimeEntryUpdate(BaseModel):
    date: Optional[date] = Field(None, description="Updated entry date")
    person_name: Optional[str] = Field(None, description="Updated person name")
    activity: Optional[str] = Field(None, description="Updated activity description")
    hours: Optional[float] = Field(None, gt=0, description="Updated hours, must be positive if provided")

    @field_validator("person_name", "activity")
    @classmethod
    def not_blank_optional(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        if not v.strip():
            raise ValueError("must not be blank")
        return v.strip()

    @model_validator(mode="after")
    def at_least_one_field_present(self) -> "TimeEntryUpdate":
        if not any([
            self.date is not None,
            self.person_name is not None,
            self.activity is not None,
            self.hours is not None,
        ]):
            raise ValueError("At least one field must be provided for update")
        return self


class TimeEntry(TimeEntryBase):
    id: str = Field(..., description="Unique identifier for the time entry")

    class Config:
        from_attributes = True
