"""
Mesh API Routes
"""
import os
import uuid
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel

router = APIRouter()

# Temp storage
MESH_DIR = Path("/tmp/vedo_meshes")
MESH_DIR.mkdir(exist_ok=True)

# In-memory mesh storage (for MVP)
mesh_store = {}


class MeshInfo(BaseModel):
    id: str
    filename: str
    n_points: int
    n_cells: int
    volume: Optional[float] = None
    area: Optional[float] = None
    bounding_box: Optional[list] = None


class TransformRequest(BaseModel):
    operation: str  # rotate, scale, translate
    params: dict


class FixRequest(BaseModel):
    operation: str  # fill_holes, smooth, decimate, normals


@router.post("/import", response_model=MeshInfo)
async def import_mesh(file: UploadFile = File(...)):
    """Import a mesh file"""
    # Generate ID
    mesh_id = str(uuid.uuid4())[:8]
    
    # Save file
    file_path = MESH_DIR / f"{mesh_id}_{file.filename}"
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)
    
    # Load with Vedo (lazy import for faster startup)
    try:
        import vedo
        mesh = vedo.load(str(file_path))
        
        info = MeshInfo(
            id=mesh_id,
            filename=file.filename,
            n_points=mesh.npoints,
            n_cells=mesh.ncells,
            volume=float(mesh.volume()) if hasattr(mesh, 'volume') else None,
            area=float(mesh.area()) if hasattr(mesh, 'area') else None,
        )
        
        # Store mesh path
        mesh_store[mesh_id] = {
            "path": str(file_path),
            "mesh": mesh,
            "filename": file.filename
        }
        
        return info
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to load mesh: {str(e)}")


@router.get("/{mesh_id}/analyze")
async def analyze_mesh(mesh_id: str):
    """Analyze a mesh"""
    if mesh_id not in mesh_store:
        raise HTTPException(status_code=404, detail="Mesh not found")
    
    import vedo
    mesh = vedo.load(mesh_store[mesh_id]["path"])
    
    return {
        "id": mesh_id,
        "n_points": mesh.npoints,
        "n_cells": mesh.ncells,
        "volume": float(mesh.volume()) if mesh.volume() else None,
        "area": float(mesh.area()) if mesh.area() else None,
        "bounding_box": mesh.bounds(),
        "center_of_mass": mesh.centerOfMass() if hasattr(mesh, 'centerOfMass') else None,
    }


@router.post("/{mesh_id}/transform")
async def transform_mesh(mesh_id: str, request: TransformRequest):
    """Transform a mesh (rotate, scale, translate)"""
    if mesh_id not in mesh_store:
        raise HTTPException(status_code=404, detail="Mesh not found")
    
    import vedo
    mesh = vedo.load(mesh_store[mesh_id]["path"])
    
    op = request.operation
    params = request.params
    
    if op == "rotate":
        angle = params.get("angle", 0)
        axis = params.get("axis", "z")
        mesh.rotate(angle, axis=axis)
    elif op == "scale":
        sx = params.get("x", 1.0)
        sy = params.get("y", 1.0)
        sz = params.get("z", 1.0)
        mesh.scale([sx, sy, sz])
    elif op == "translate":
        tx = params.get("x", 0)
        ty = params.get("y", 0)
        tz = params.get("z", 0)
        mesh.translate([tx, ty, tz])
    
    # Save
    mesh.write(mesh_store[mesh_id]["path"])
    
    return {"success": True, "operation": op}


@router.post("/{mesh_id}/fix")
async def fix_mesh(mesh_id: str, request: FixRequest):
    """Fix mesh issues"""
    if mesh_id not in mesh_store:
        raise HTTPException(status_code=404, detail="Mesh not found")
    
    import vedo
    mesh = vedo.load(mesh_store[mesh_id]["path"])
    
    op = request.operation
    
    if op == "fill_holes":
        mesh.fillHoles()
    elif op == "smooth":
        mesh.smooth()
    elif op == "normals":
        mesh.computeNormals()
    
    # Save
    mesh.write(mesh_store[mesh_id]["path"])
    
    return {"success": True, "operation": op}


@router.get("/{mesh_id}/visualize")
async def visualize_mesh(mesh_id: str):
    """Get mesh data for 3D visualization"""
    if mesh_id not in mesh_store:
        raise HTTPException(status_code=404, detail="Mesh not found")
    
    import vedo
    mesh = vedo.load(mesh_store[mesh_id]["path"])
    
    # Get vertices and faces
    vertices = mesh.points().tolist()
    faces = []
    
    # Convert cells to face list
    cells = mesh.cells()
    for i in range(0, len(cells), 4):
        if cells[i] == 3:  # Triangle
            faces.append([cells[i+1], cells[i+2], cells[i+3]])
    
    return {
        "vertices": vertices,
        "faces": faces,
    }


@router.get("/{mesh_id}/export")
async def export_mesh(mesh_id: str, format: str = "stl"):
    """Export mesh to different format"""
    if mesh_id not in mesh_store:
        raise HTTPException(status_code=404, detail="Mesh not found")
    
    # This would return file bytes in production
    return {"message": f"Export to {format} not implemented yet"}
