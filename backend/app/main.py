"""
Vedo WebApp - FastAPI Backend
Optimized with caching, async processing, and lazy Vedo loading
"""
import asyncio
from functools import lru_cache
from concurrent.futures import ThreadPoolExecutor

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import mesh, scene

# Thread pool for running blocking Vedo operations
# Allows async endpoints to remain responsive
_executor = ThreadPoolExecutor(max_workers=2)

# In-memory cache for mesh operations
# Note: In production, consider Redis for distributed caching
_mesh_cache: dict = {}

app = FastAPI(
    title="Vedo WebApp API",
    description="REST API for mesh processing with Vedo",
    version="0.1.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(mesh.router, prefix="/mesh", tags=["mesh"])
app.include_router(scene.router, prefix="/api", tags=["scene"])


@app.get("/")
async def root():
    return {"message": "Vedo WebApp API", "version": "0.1.0"}


@app.get("/health")
async def health():
    return {"status": "healthy"}


# ============================================================================
# Cache Management Utilities
# ============================================================================

def get_cached_mesh(mesh_id: str) -> dict | None:
    """Get cached mesh data if available"""
    return _mesh_cache.get(mesh_id)


def set_cached_mesh(mesh_id: str, data: dict) -> None:
    """Cache mesh data"""
    _mesh_cache[mesh_id] = data


def invalidate_mesh_cache(mesh_id: str) -> None:
    """Invalidate cache for a specific mesh"""
    _mesh_cache.pop(mesh_id, None)


def clear_all_cache() -> int:
    """Clear all cached mesh data - returns count of cleared items"""
    count = len(_mesh_cache)
    _mesh_cache.clear()
    return count
