"""
Mesh API Routes - Optimized with caching, async processing, and lazy Vedo loading
"""
import asyncio
import io
import os
import uuid
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import Optional, List, Dict, Any

from fastapi import APIRouter, File, HTTPException, UploadFile, Query
from fastapi.responses import Response
from pydantic import BaseModel, Field
import numpy as np

# Lazy import for Vedo - only load when needed
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

# Temp storage
MESH_DIR = Path("/tmp/vedo_meshes")
MESH_DIR.mkdir(exist_ok=True)

# Supported export formats
EXPORT_FORMATS = ["stl", "obj", "ply", "vtk", "wrl", "off"]

# In-memory mesh storage with metadata
mesh_store: Dict[str, Dict[str, Any]] = {}

# Cache for mesh operations
_mesh_cache: Dict[str, Dict[str, Any]] = {}

# ============================================================================
# Pydantic Models
# ============================================================================

class MeshInfo(BaseModel):
    """Basic mesh information"""
    id: str
    filename: str
    n_points: int
    n_cells: int
    volume: Optional[float] = None
    area: Optional[float] = None
    bounding_box: Optional[List[float]] = None


class MeshMetadata(BaseModel):
    """Extended mesh metadata"""
    id: str
    filename: str
    n_points: int
    n_cells: int
    volume: Optional[float] = None
    area: Optional[float] = None
    bounding_box: Optional[List[float]] = None
    center_of_mass: Optional[List[float]] = None
    file_size: int
    created_at: Optional[str] = None


class TransformRequest(BaseModel):
    """Mesh transformation request"""
    operation: str = Field(..., description="rotate, scale, translate")
    params: Dict[str, Any] = Field(default_factory=dict)


class FixRequest(BaseModel):
    """Mesh fixing request"""
    operation: str = Field(..., description="fill_holes, smooth, decimate, compute_normals, clean")
    params: Dict[str, Any] = Field(default_factory=dict)


class AnalysisResult(BaseModel):
    """Mesh analysis result"""
    id: str
    n_points: int
    n_cells: int
    volume: Optional[float] = None
    area: Optional[float] = None
    bounding_box: List[float]
    center_of_mass: Optional[List[float]] = None
    curvature: Optional[Dict[str, Any]] = None
    normals: Optional[Dict[str, Any]] = None


class VisualizeResponse(BaseModel):
    """Three.js compatible mesh data"""
    vertices: List[List[float]]
    faces: List[List[int]]
    normals: Optional[List[List[float]]] = None
    metadata: Optional[Dict[str, Any]] = None


# ============================================================================
# Utility Functions
# ============================================================================

def get_file_size(file_path: Path) -> int:
    """Get file size in bytes"""
    try:
        return os.path.getsize(file_path)
    except OSError:
        return 0


def cleanup_mesh(mesh_id: str) -> None:
    """Clean up mesh from store, cache, and disk"""
    if mesh_id in mesh_store:
        mesh_data = mesh_store[mesh_id]
        file_path = mesh_data.get("path")
        if file_path and os.path.exists(file_path):
            try:
                os.remove(file_path)
            except OSError:
                pass
        mesh_store.pop(mesh_id, None)
    
    # Also invalidate cache
    _mesh_cache.pop(mesh_id, None)


def _load_mesh_async(file_path: str):
    """Load mesh in thread pool - for async processing"""
    vedo = get_vedo()
    return vedo.load(file_path)


def _get_or_compute_cache(mesh_id: str, compute_fn, *args):
    """Get from cache or compute and cache result"""
    cache_key = f"{mesh_id}:{args}"
    if cache_key in _mesh_cache:
        return _mesh_cache[cache_key]
    
    result = compute_fn(*args)
    _mesh_cache[cache_key] = result
    return result


# ============================================================================
# API Endpoints
# ============================================================================

@router.post("/import", response_model=MeshInfo, status_code=201)
async def import_mesh(file: UploadFile = File(...)):
    """
    Import a mesh file (STL, OBJ, PLY, VTK, WRL, OFF supported)
    Uses async file handling for better performance
    """
    # Validate file extension
    ext = Path(file.filename).suffix.lower().lstrip('.')
    if ext not in EXPORT_FORMATS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format: {ext}. Supported: {', '.join(EXPORT_FORMATS)}"
        )
    
    # Generate ID
    mesh_id = str(uuid.uuid4())[:8]
    
    # Save file - async write
    file_path = MESH_DIR / f"{mesh_id}_{file.filename}"
    try:
        content = await file.read()
        # Run blocking file write in thread pool
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(_executor, lambda: open(file_path, "wb").write(content))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
    
    # Load with Vedo - run in thread pool to avoid blocking
    try:
        loop = asyncio.get_event_loop()
        mesh = await loop.run_in_executor(_executor, _load_mesh_async, str(file_path))
        
        # Get bounds safely - run in thread pool
        def get_bounds():
            return mesh.bounds() or [0, 0, 0, 0, 0, 0]
        
        bounds = await loop.run_in_executor(_executor, get_bounds)
        
        # Get volume and area - cache these computations
        def get_volume():
            vol = mesh.volume()
            return float(vol) if vol is not None else None
        
        def get_area():
            ar = mesh.area()
            return float(ar) if ar is not None else None
        
        volume = await loop.run_in_executor(_executor, get_volume)
        area = await loop.run_in_executor(_executor, get_area)
        
        info = MeshInfo(
            id=mesh_id,
            filename=file.filename,
            n_points=mesh.npoints,
            n_cells=mesh.ncells,
            volume=volume,
            area=area,
            bounding_box=list(bounds),
        )
        
        # Store mesh metadata
        mesh_store[mesh_id] = {
            "path": str(file_path),
            "filename": file.filename,
            "n_points": mesh.npoints,
            "n_cells": mesh.ncells,
        }
        
        return info
        
    except Exception as e:
        if file_path.exists():
            file_path.unlink()
        raise HTTPException(status_code=400, detail=f"Failed to load mesh: {str(e)}")


@router.get("/{mesh_id}", response_model=MeshMetadata)
async def get_mesh_info(mesh_id: str):
    """Get detailed mesh information"""
    if mesh_id not in mesh_store:
        raise HTTPException(status_code=404, detail="Mesh not found")
    
    vedo = get_vedo()
    mesh_data = mesh_store[mesh_id]
    file_path = mesh_data["path"]
    
    try:
        loop = asyncio.get_event_loop()
        
        # Load mesh in thread pool
        mesh = await loop.run_in_executor(_executor, vedo.load, file_path)
        
        # Get bounds in thread pool
        bounds = await loop.run_in_executor(_executor, lambda: mesh.bounds() or [0, 0, 0, 0, 0, 0])
        
        # Get center of mass if available
        def get_com():
            return list(mesh.centerOfMass()) if hasattr(mesh, 'centerOfMass') else None
        
        com = await loop.run_in_executor(_executor, get_com)
        
        return MeshMetadata(
            id=mesh_id,
            filename=mesh_data["filename"],
            n_points=mesh.npoints,
            n_cells=mesh.ncells,
            volume=float(mesh.volume()) if mesh.volume() is not None else None,
            area=float(mesh.area()) if mesh.area() is not None else None,
            bounding_box=list(bounds),
            center_of_mass=com,
            file_size=get_file_size(Path(file_path)),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load mesh: {str(e)}")


@router.get("/{mesh_id}/analyze", response_model=AnalysisResult)
async def analyze_mesh(mesh_id: str, compute_curvature: bool = False):
    """Analyze a mesh with optional curvature computation"""
    if mesh_id not in mesh_store:
        raise HTTPException(status_code=404, detail="Mesh not found")
    
    vedo = get_vedo()
    mesh_data = mesh_store[mesh_id]
    
    # Check cache first
    cache_key = f"analyze:{mesh_id}:{compute_curvature}"
    if cache_key in _mesh_cache:
        return _mesh_cache[cache_key]
    
    try:
        loop = asyncio.get_event_loop()
        mesh = await loop.run_in_executor(_executor, vedo.load, mesh_data["path"])
        
        bounds = await loop.run_in_executor(_executor, lambda: mesh.bounds() or [0, 0, 0, 0, 0, 0])
        
        def get_com():
            return list(mesh.centerOfMass()) if hasattr(mesh, 'centerOfMass') else None
        
        com = await loop.run_in_executor(_executor, get_com)
        
        result = AnalysisResult(
            id=mesh_id,
            n_points=mesh.npoints,
            n_cells=mesh.ncells,
            volume=float(mesh.volume()) if mesh.volume() is not None else None,
            area=float(mesh.area()) if mesh.area() is not None else None,
            bounding_box=list(bounds),
            center_of_mass=com,
        )
        
        # Compute curvature if requested
        if compute_curvature:
            try:
                def compute_pcv():
                    pcv = mesh.pcv()
                    if pcv is not None and hasattr(pcv, 'points'):
                        return pcv.points()
                    return None
                
                curvature_values = await loop.run_in_executor(_executor, compute_pcv)
                if curvature_values is not None and len(curvature_values) > 0:
                    result.curvature = {
                        "min": float(np.min(curvature_values[:, 0])),
                        "max": float(np.max(curvature_values[:, 0])),
                        "mean": float(np.mean(curvature_values[:, 0])),
                        "n_points": len(curvature_values),
                    }
            except Exception as e:
                result.curvature = {"error": str(e)}
        
        # Cache the result
        _mesh_cache[cache_key] = result
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze mesh: {str(e)}")


@router.post("/{mesh_id}/transform")
async def transform_mesh(mesh_id: str, request: TransformRequest):
    """
    Transform a mesh (rotate, scale, translate)
    Uses async processing with thread pool
    """
    if mesh_id not in mesh_store:
        raise HTTPException(status_code=404, detail="Mesh not found")
    
    vedo = get_vedo()
    mesh_data = mesh_store[mesh_id]
    
    try:
        loop = asyncio.get_event_loop()
        
        # Load mesh in thread pool
        mesh = await loop.run_in_executor(_executor, vedo.load, mesh_data["path"])
        
        op = request.operation
        params = request.params
        
        # Perform transformation in thread pool
        def do_transform():
            if op == "rotate":
                angle = params.get("angle", 0)
                axis = params.get("axis", "z")
                axis_map = {"x": [1, 0, 0], "y": [0, 1, 0], "z": [0, 0, 1]}
                mesh.rotate(angle, axis=axis_map.get(axis, [0, 0, 1]))
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
            elif op == "flip":
                mesh.flipNormals()
            elif op == "center":
                mesh.alignToOrigin()
            else:
                raise ValueError(f"Unknown operation: {op}")
            
            # Save transformed mesh
            mesh.write(mesh_data["path"])
            return mesh
        
        mesh = await loop.run_in_executor(_executor, do_transform)
        
        # Update metadata
        mesh_store[mesh_id]["n_points"] = mesh.npoints
        mesh_store[mesh_id]["n_cells"] = mesh.ncells
        
        # Invalidate cache
        for key in list(_mesh_cache.keys()):
            if key.startswith(f"analyze:{mesh_id}") or key.startswith(f"visualize:{mesh_id}"):
                _mesh_cache.pop(key, None)
        
        return {
            "success": True,
            "operation": op,
            "n_points": mesh.npoints,
            "n_cells": mesh.ncells,
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transform failed: {str(e)}")


@router.post("/{mesh_id}/fix")
async def fix_mesh(mesh_id: str, request: FixRequest):
    """Fix mesh issues - async processing"""
    if mesh_id not in mesh_store:
        raise HTTPException(status_code=404, detail="Mesh not found")
    
    vedo = get_vedo()
    mesh_data = mesh_store[mesh_id]
    
    try:
        loop = asyncio.get_event_loop()
        
        # Load mesh in thread pool
        mesh = await loop.run_in_executor(_executor, vedo.load, mesh_data["path"])
        
        def do_fix():
            op = request.operation
            if op == "fill_holes":
                mesh.fillHoles()
            elif op == "smooth":
                iterations = request.params.get("iterations", 20)
                mesh.smooth(iterations=iterations)
            elif op == "decimate":
                target_reduction = request.params.get("reduction", 0.5)
                mesh.decimate(target_reduction=target_reduction)
            elif op == "compute_normals":
                mesh.computeNormals()
            elif op == "clean":
                mesh.clean()
                mesh.computeNormals()
            else:
                raise ValueError(f"Unknown fix operation: {op}")
            
            mesh.write(mesh_data["path"])
            return mesh
        
        mesh = await loop.run_in_executor(_executor, do_fix)
        
        # Update metadata
        mesh_store[mesh_id]["n_points"] = mesh.npoints
        mesh_store[mesh_id]["n_cells"] = mesh.ncells
        
        # Invalidate cache
        for key in list(_mesh_cache.keys()):
            if key.startswith(f"analyze:{mesh_id}") or key.startswith(f"visualize:{mesh_id}"):
                _mesh_cache.pop(key, None)
        
        return {
            "success": True,
            "operation": request.operation,
            "n_points": mesh.npoints,
            "n_cells": mesh.ncells,
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fix operation failed: {str(e)}")


@router.get("/{mesh_id}/visualize", response_model=VisualizeResponse)
async def visualize_mesh(mesh_id: str, include_normals: bool = False):
    """
    Get mesh data optimized for Three.js BufferGeometry
    Includes caching for improved performance
    """
    if mesh_id not in mesh_store:
        raise HTTPException(status_code=404, detail="Mesh not found")
    
    # Check cache
    cache_key = f"visualize:{mesh_id}:{include_normals}"
    if cache_key in _mesh_cache:
        return _mesh_cache[cache_key]
    
    vedo = get_vedo()
    mesh_data = mesh_store[mesh_id]
    
    try:
        loop = asyncio.get_event_loop()
        
        # Load mesh in thread pool
        mesh = await loop.run_in_executor(_executor, vedo.load, mesh_data["path"])
        
        # Get vertices and cells in thread pool
        def get_mesh_data():
            points = mesh.points()
            vertices = points.tolist() if hasattr(points, 'tolist') else points
            
            cells = mesh.cells()
            faces = []
            
            i = 0
            while i < len(cells):
                n_verts = cells[i]
                if n_verts == 3:
                    faces.append([int(cells[i+1]), int(cells[i+2]), int(cells[i+3])])
                elif n_verts == 4:
                    faces.append([int(cells[i+1]), int(cells[i+2]), int(cells[i+3])])
                    faces.append([int(cells[i+1]), int(cells[i+3]), int(cells[i+4])])
                i += n_verts + 1
            
            return vertices, faces
        
        vertices, faces = await loop.run_in_executor(_executor, get_mesh_data)
        
        # Get normals if requested
        normals = None
        if include_normals:
            def get_normals():
                mesh.computeNormals()
                norm_data = mesh.normals(cells=False)
                if norm_data is not None:
                    return norm_data.tolist() if hasattr(norm_data, 'tolist') else list(norm_data)
                return None
            
            normals = await loop.run_in_executor(_executor, get_normals)
        
        response = VisualizeResponse(
            vertices=vertices,
            faces=faces,
            normals=normals,
            metadata={
                "n_vertices": len(vertices),
                "n_faces": len(faces),
                "filename": mesh_data["filename"],
            }
        )
        
        # Cache the response
        _mesh_cache[cache_key] = response
        
        return response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get visualization data: {str(e)}")


@router.get("/{mesh_id}/visualize/buffer")
async def visualize_mesh_buffer(mesh_id: str):
    """Get mesh data as flat typed arrays for optimal Three.js performance"""
    if mesh_id not in mesh_store:
        raise HTTPException(status_code=404, detail="Mesh not found")
    
    vedo = get_vedo()
    mesh_data = mesh_store[mesh_id]
    
    try:
        loop = asyncio.get_event_loop()
        
        # Load mesh in thread pool
        mesh = await loop.run_in_executor(_executor, vedo.load, mesh_data["path"])
        
        # Get buffer data in thread pool
        def get_buffer_data():
            points = mesh.points()
            vertices_flat = points.flatten().astype(np.float32).tobytes()
            
            cells = mesh.cells()
            indices = []
            
            i = 0
            while i < len(cells):
                n_verts = cells[i]
                if n_verts == 3:
                    indices.extend([cells[i+1], cells[i+2], cells[i+3]])
                elif n_verts == 4:
                    indices.extend([cells[i+1], cells[i+2], cells[i+3]])
                    indices.extend([cells[i+1], cells[i+3], cells[i+4]])
                i += n_verts + 1
            
            indices_array = np.array(indices, dtype=np.uint32).tobytes()
            return vertices_flat, indices_array, len(points), len(indices)
        
        vertices_flat, indices_array, n_vert, n_idx = await loop.run_in_executor(_executor, get_buffer_data)
        
        # Create combined binary response
        import struct
        n_vert_bytes = struct.pack('I', n_vert)
        n_idx_bytes = struct.pack('I', n_idx)
        
        binary_data = n_vert_bytes + vertices_flat + n_idx_bytes + indices_array
        
        return Response(
            content=binary_data,
            media_type="application/octet-stream",
            headers={
                "X-N-Vertices": str(n_vert),
                "X-N-Indices": str(n_idx),
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get buffer data: {str(e)}")


@router.delete("/{mesh_id}")
async def delete_mesh(mesh_id: str):
    """Delete a mesh and invalidate cache"""
    if mesh_id not in mesh_store:
        raise HTTPException(status_code=404, detail="Mesh not found")
    
    cleanup_mesh(mesh_id)
    
    return {"success": True, "message": f"Mesh {mesh_id} deleted"}


@router.get("/")
async def list_meshes():
    """List all imported meshes"""
    meshes = []
    for mesh_id, data in mesh_store.items():
        meshes.append({
            "id": mesh_id,
            "filename": data["filename"],
            "n_points": data.get("n_points", 0),
            "n_cells": data.get("n_cells", 0),
        })
    return {"meshes": meshes, "count": len(meshes)}


@router.delete("/")
async def cleanup_all():
    """Clean up all meshes (admin)"""
    count = len(mesh_store)
    for mesh_id in list(mesh_store.keys()):
        cleanup_mesh(mesh_id)
    
    return {"success": True, "deleted": count}
