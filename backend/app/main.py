"""
Vedo WebApp - FastAPI Backend
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import mesh

app = FastAPI(
    title="Vedo WebApp API",
    description="REST API for mesh processing with Vedo",
    version="0.1.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(mesh.router, prefix="/mesh", tags=["mesh"])


@app.get("/")
async def root():
    return {"message": "Vedo WebApp API", "version": "0.1.0"}


@app.get("/health")
async def health():
    return {"status": "healthy"}
