from pydantic import BaseModel
from typing import List, Tuple, Optional
from datetime import date, datetime

class RunCreate(BaseModel):
    distance: float
    calories: int
    duration_minutes: int
    route_coordinates: List[Tuple[float, float]]

class RunResponse(RunCreate):
    id: str
    user_id: str
    run_date: date
    created_at: datetime
