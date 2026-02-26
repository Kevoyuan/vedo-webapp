"""
Vedo WebApp - FastAPI Backend
Optimized with caching, async processing, and lazy Vedo loading
"""
import asyncio
from functools import lru_cache
from concurrent.futures import ThreadPoolExecutor

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from app.routes import mesh, scene

# Thread pool for running blocking Vedo operations
# Allows async endpoints to remain responsive
_executor = ThreadPoolExecutor(max_workers=2)

# In-memory cache for mesh operations
# Note: In production, consider Redis for distributed caching
_mesh_cache: dict = {}

app = FastAPI(
    title="Vedo WebApp API",
    description="""
    REST API for 3D mesh processing with Vedo.
    
    ## Features
    * **Mesh Import/Export** - Support for STL, OBJ, PLY, VTK, GLTF/GLB, 3MF, OFF, WRL, XYZ
    * **Mesh Analysis** - Volume, area, bounding box, center of mass, curvature
    * **Mesh Transformations** - Rotate, scale, translate, flip, center
    * **Mesh Fixing** - Fill holes, smooth, decimate, compute normals, clean
    * **Visualization** - Three.js compatible mesh data
    * **Scene Management** - Multi-mesh scenes with visibility control
    * **Mesh Merging** - Merge, union, intersect operations
    """,
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    contact={
        "name": "Vedo WebApp",
        "url": "https://github.com/vedo-webapp"
    },
    license_info={
        "name": "MIT",
        "url": "https://opensource.org/licenses/MIT"
    }
)

# Custom OpenAPI schema
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    
    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )
    
    # Add common schema definitions
    openapi_schema["components"]["schemas"]["ErrorResponse"] = {
        "type": "object",
        "properties": {
            "detail": {"type": "string", "description": "Error message"}
        },
        "required": ["detail"]
    }
    
    # Add tag descriptions
    openapi_schema["tags"] = [
        {
            "name": "mesh",
            "description": "Mesh operations - import, export, transform, analyze"
        },
        {
            "name": "scene",
            "description": "Scene management - create scenes, add/remove meshes"
        },
        {
            "name": "health",
            "description": "Health check endpoints"
        }
    ]
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

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
