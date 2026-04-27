from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from database import supabase
from dependencies import get_current_user
from models import RunCreate, RunResponse
from typing import List

app = FastAPI(title="Run Planner API")

# Configure CORS so our React frontend can communicate with the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Run Planner API"}

@app.post("/runs", response_model=RunResponse)
def create_run(run: RunCreate, current_user = Depends(get_current_user)):
    """
    Save a new run to the database.
    Because of 'Depends(get_current_user)', this endpoint requires a valid JWT token.
    """
    run_data = run.dict()
    
    # Tie this run to the exact user who sent the token!
    run_data["user_id"] = current_user.id
    
    # Insert the dictionary into Supabase
    response = supabase.table("runs").insert(run_data).execute()
    
    return response.data[0]

@app.get("/runs", response_model=List[RunResponse])
def get_runs(current_user = Depends(get_current_user)):
    """
    Get all runs for the currently logged in user.
    """
    response = supabase.table("runs").select("*").eq("user_id", current_user.id).execute()
    
    return response.data
