"""
Scene API Routes - Multi-mesh scene management
"""
import asyncio
import uuid
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import Optional, List, Dict, Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

# Lazy import for Vedo
_vedo = None
_executor = ThreadPoolExecutor(max_workers=2)

def get_vedo():
    """Lazy load Vedo on first use"""
    global _vedo
    if _vedo is None:
        import vedo
        _vedo = vedo
    return _vedo

router = APIRouter()

# Scene storage - maps scene_id to scene data
scene_store: Dict[str, Dict[str, Any]] = {}

# ============================================================================
# Pydantic Models
# ============================================================================

class SceneInfo(BaseModel):
    """Scene information"""
    id: str
    name: str
    mesh_ids: List[str]
    created_at: Optional[str] = None


class SceneCreate(BaseModel):
    """Create scene request"""
    name: str = Field(default="New Scene")


class MeshInScene(BaseModel):
    """Mesh reference in a scene with visibility"""
    mesh_id: str
    visible: bool = True
    position: Optional[List[float]] = [0, 0, 0]
    rotation: Optional[List[float]] = [0, 0, 0]
    scale: Optional[List[float]] = [1, 1, 1]


class SceneUpdate(BaseModel):
    """Update scene request"""
    name: Optional[str] = None
    mesh_ids: Optional[List[str]] = None


class MergeRequest(BaseModel):
    """Merge meshes into a new mesh"""
    mesh_ids: List[str]
    operation: str = Field(default="merge", description="merge, union, subtract, intersect")
    output_name: str = Field(default="merged_mesh")


# ============================================================================
# Utility Functions
# ============================================================================

def get_scene_mesh_ids(scene_id: str) -> List[str]:
    """Get mesh IDs in a scene"""
    scene = scene_store.get(scene_id)
    if not scene:
        return []
    return scene.get("mesh_ids", [])


def cleanup_scene(scene_id: str) -> None:
    """Clean up scene from store"""
    scene_store.pop(scene_id, None)


# ============================================================================
# API Endpoints
# ============================================================================

@router.post("/scenes", response_model=SceneInfo, status_code=201)
async def create_scene(request: SceneCreate = SceneCreate()):
    """
    Create a new scene
    """
    scene_id = str(uuid.uuid4())[:8]
    
    scene_store[scene_id] = {
        "id": scene_id,
        "name": request.name,
        "mesh_ids": [],
        "created_at": None,
    }
    
    return SceneInfo(
        id=scene_id,
        name=request.name,
        mesh_ids=[],
    )


@router.get("/scenes", response_model=List[SceneInfo])
async def list_scenes():
    """
    List all scenes
    """
    scenes = []
    for scene_id, data in scene_store.items():
        scenes.append(SceneInfo(
            id=scene_id,
            name=data["name"],
            mesh_ids=data.get("mesh_ids", []),
            created_at=data.get("created_at"),
        ))
    return scenes


@router.get("/scenes/{scene_id}", response_model=SceneInfo)
async def get_scene(scene_id: str):
    """
    Get scene details
    """
    if scene_id not in scene_store:
        raise HTTPException(status_code=404, detail="Scene not found")
    
    scene = scene_store[scene_id]
    return SceneInfo(
        id=scene_id,
        name=scene["name"],
        mesh_ids=scene.get("mesh_ids", []),
        created_at=scene.get("created_at"),
    )


@router.delete("/scenes/{scene_id}")
async def delete_scene(scene_id: str):
    """
    Delete a scene
    """
    if scene_id not in scene_store:
        raise HTTPException(status_code=404, detail="Scene not found")
    
    cleanup_scene(scene_id)
    return {"success": True, "message": f"Scene {scene_id} deleted"}


@router.post("/scenes/{scene_id}/meshes/{mesh_id}")
async def add_mesh_to_scene(scene_id: str, mesh_id: str):
    """
    Add a mesh to a scene
    """
    if scene_id not in scene_store:
        raise HTTPException(status_code=404, detail="Scene not found")
    
    # Check if mesh exists (in mesh_store from mesh.py)
    from app.routes.mesh import mesh_store
    if mesh_id not in mesh_store:
        raise HTTPException(status_code=404, detail="Mesh not found")
    
    scene = scene_store[scene_id]
    mesh_ids = scene.get("mesh_ids", [])
    
    if mesh_id not in mesh_ids:
        mesh_ids.append(mesh_id)
        scene["mesh_ids"] = mesh_ids
    
    return {
        "success": True,
        "scene_id": scene_id,
        "mesh_id": mesh_id,
        "mesh_ids": mesh_ids
    }


@router.delete("/scenes/{scene_id}/meshes/{mesh_id}")
async def remove_mesh_from_scene(scene_id: str, mesh_id: str):
    """
    Remove a mesh from a scene
    """
    if scene_id not in scene_store:
        raise HTTPException(status_code=404, detail="Scene not found")
    
    scene = scene_store[scene_id]
    mesh_ids = scene.get("mesh_ids", [])
    
    if mesh_id in mesh_ids:
        mesh_ids.remove(mesh_id)
        scene["mesh_ids"] = mesh_ids
    
    return {
        "success": True,
        "scene_id": scene_id,
        "mesh_id": mesh_id,
        "mesh_ids": mesh_ids
    }


@router.post("/scenes/{scene_id}/meshes/{mesh_id}/visibility")
async def set_mesh_visibility(scene_id: str, mesh_id: str, visible: bool = True):
    """
    Set mesh visibility in scene
    """
    if scene_id not in scene_store:
        raise HTTPException(status_code=404, detail="Scene not found")
    
    scene = scene_store[scene_id]
    mesh_ids = scene.get("mesh_ids", [])
    
    if mesh_id not in mesh_ids:
        raise HTTPException(status_code=404, detail="Mesh not in scene")
    
    # Initialize visibility dict if not present
    if "visibility" not in scene:
        scene["visibility"] = {}
    
    scene["visibility"][mesh_id] = visible
    
    return {
        "success": True,
        "mesh_id": mesh_id,
        "visible": visible
    }


@router.get("/scenes/{scene_id}/visualize")
async def visualize_scene(scene_id: str):
    """
    Get all meshes in scene for visualization
    """
    if scene_id not in scene_store:
        raise HTTPException(status_code=404, detail="Scene not found")
    
    scene = scene_store[scene_id]
    mesh_ids = scene.get("mesh_ids", [])
    visibility = scene.get("visibility", {})
    
    from app.routes.mesh import mesh_store
    
    meshes_data = []
    for mesh_id in mesh_ids:
        if mesh_id not in mesh_store:
            continue
        
        mesh_data = mesh_store[mesh_id]
        mesh_info = {
            "id": mesh_id,
            "filename": mesh_data["filename"],
            "visible": visibility.get(mesh_id, True),
        }
        meshes_data.append(mesh_info)
    
    return {
        "scene_id": scene_id,
        "meshes": meshes_data,
        "count": len(meshes_data)
    }


@router.post("/merge")
async def merge_meshes(request: MergeRequest):
    """
    Merge multiple meshes into one
    """
    from app.routes.mesh import mesh_store, MESH_DIR
    
    # Validate all meshes exist
    for mesh_id in request.mesh_ids:
        if mesh_id not in mesh_store:
            raise HTTPException(status_code=404, detail=f"Mesh {mesh_id} not found")
    
    vedo = get_vedo()
    
    try:
        loop = asyncio.get_event_loop()
        
        # Load all meshes
        meshes = []
        for mesh_id in request.mesh_ids:
            mesh_path = mesh_store[mesh_id]["path"]
            mesh = await loop.run_in_executor(_executor, vedo.load, mesh_path)
            meshes.append(mesh)
        
        # Merge meshes
        merged = None
        if request.operation == "merge" or request.operation == "union":
            def do_merge():
                result = meshes[0]
                for m in meshes[1:]:
                    result = result.merge(m)
                return result
            
            merged = await loop.run_in_executor(_executor, do_merge)
        elif request.operation == "intersect":
            def do_intersect():
                result = meshes[0]
                for m in meshes[1:]:
                    result = result.intersect(m)
                return result
            
            merged = await loop.run_in_executor(_executor, do_intersect)
        else:
            raise ValueError(f"Unknown operation: {request.operation}")
        
        # Generate new mesh ID and save
        new_mesh_id = str(uuid.uuid4())[:8]
        output_path = MESH_DIR / f"{new_mesh_id}_{request.output_name}.stl"
        
        await loop.run_in_executor(_executor, merged.write, str(output_path))
        
        # Get mesh info
        bounds = await loop.run_in_executor(_executor, lambda: merged.bounds() or [0, 0, 0, 0, 0, 0])
        volume = await loop.run_in_executor(_executor, lambda: merged.volume())
        area = await loop.run_in_executor(_executor, lambda: merged.area())
        
        # Store in mesh store
        mesh_store[new_mesh_id] = {
            "path": str(output_path),
            "filename": request.output_name,
            "n_points": merged.npoints,
            "n_cells": merged.ncells,
        }
        
        return {
            "success": True,
            "mesh_id": new_mesh_id,
            "filename": request.output_name,
            "n_points": merged.npoints,
            "n_cells": merged.ncells,
            "volume": float(volume) if volume is not None else None,
            "area": float(area) if area is not None else None,
            "bounding_box": list(bounds),
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Merge failed: {str(e)}")


@router.get("/mesh/store")
async def get_mesh_store():
    """
    Get all meshes in the mesh store
    """
    from app.routes.mesh import mesh_store
    
    meshes = []
    for mesh_id, data in mesh_store.items():
        meshes.append({
            "id": mesh_id,
            "filename": data.get("filename", "unknown"),
            "n_points": data.get("n_points", 0),
            "n_cells": data.get("n_cells", 0),
        })
    
    return {"meshes": meshes, "count": len(meshes)}
