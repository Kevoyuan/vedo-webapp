"""
Mesh API Routes - Improved with better error handling, visualization, export, and analysis
"""
import io
import os
import uuid
from pathlib import Path
from typing import Optional, List, Dict, Any

from fastapi import APIRouter, File, HTTPException, UploadFile, Query
from fastapi.responses import Response
from pydantic import BaseModel, Field
import numpy as np

router = APIRouter()

# Temp storage
MESH_DIR = Path("/tmp/vedo_meshes")
MESH_DIR.mkdir(exist_ok=True)

# Supported export formats
EXPORT_FORMATS = ["stl", "obj", "ply", "vtk", "wrl", "off"]

# In-memory mesh storage with metadata
mesh_store: Dict[str, Dict[str, Any]] = {}


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
    vertices: List[List[float]]  # [[x,y,z], ...]
    faces: List[List[int]]      # [[i,j,k], ...]
    normals: Optional[List[List[float]]] = None  # Vertex normals
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
    """Clean up mesh from store and disk"""
    if mesh_id in mesh_store:
        mesh_data = mesh_store[mesh_id]
        # Remove file from disk
        file_path = mesh_data.get("path")
        if file_path and os.path.exists(file_path):
            try:
                os.remove(file_path)
            except OSError:
                pass
        # Remove from store (use dict.pop to avoid iteration issues)
        mesh_store.pop(mesh_id, None)


# ============================================================================
# API Endpoints
# ============================================================================

@router.post("/import", response_model=MeshInfo, status_code=201)
async def import_mesh(file: UploadFile = File(...)):
    """Import a mesh file (STL, OBJ, PLY, VTK, WRL, OFF supported)"""
    # Validate file extension
    ext = Path(file.filename).suffix.lower().lstrip('.')
    if ext not in EXPORT_FORMATS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format: {ext}. Supported: {', '.join(EXPORT_FORMATS)}"
        )
    
    # Generate ID
    mesh_id = str(uuid.uuid4())[:8]
    
    # Save file
    file_path = MESH_DIR / f"{mesh_id}_{file.filename}"
    try:
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
    
    # Load with Vedo
    try:
        import vedo
        mesh = vedo.load(str(file_path))
        
        # Get bounds safely
        bounds = mesh.bounds() or [0, 0, 0, 0, 0, 0]
        
        info = MeshInfo(
            id=mesh_id,
            filename=file.filename,
            n_points=mesh.npoints,
            n_cells=mesh.ncells,
            volume=float(mesh.volume()) if mesh.volume() is not None else None,
            area=float(mesh.area()) if mesh.area() is not None else None,
            bounding_box=list(bounds),
        )
        
        # Store mesh metadata (don't keep mesh object in memory for large files)
        mesh_store[mesh_id] = {
            "path": str(file_path),
            "filename": file.filename,
            "n_points": mesh.npoints,
            "n_cells": mesh.ncells,
        }
        
        return info
        
    except Exception as e:
        # Cleanup on failure
        if file_path.exists():
            file_path.unlink()
        raise HTTPException(status_code=400, detail=f"Failed to load mesh: {str(e)}")


@router.get("/{mesh_id}", response_model=MeshMetadata)
async def get_mesh_info(mesh_id: str):
    """Get detailed mesh information"""
    if mesh_id not in mesh_store:
        raise HTTPException(status_code=404, detail="Mesh not found")
    
    import vedo
    
    mesh_data = mesh_store[mesh_id]
    file_path = mesh_data["path"]
    
    try:
        mesh = vedo.load(file_path)
        
        bounds = mesh.bounds() or [0, 0, 0, 0, 0, 0]
        
        return MeshMetadata(
            id=mesh_id,
            filename=mesh_data["filename"],
            n_points=mesh.npoints,
            n_cells=mesh.ncells,
            volume=float(mesh.volume()) if mesh.volume() is not None else None,
            area=float(mesh.area()) if mesh.area() is not None else None,
            bounding_box=list(bounds),
            center_of_mass=list(mesh.centerOfMass()) if hasattr(mesh, 'centerOfMass') else None,
            file_size=get_file_size(Path(file_path)),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load mesh: {str(e)}")


@router.get("/{mesh_id}/analyze", response_model=AnalysisResult)
async def analyze_mesh(mesh_id: str, compute_curvature: bool = False):
    """Analyze a mesh with optional curvature computation"""
    if mesh_id not in mesh_store:
        raise HTTPException(status_code=404, detail="Mesh not found")
    
    import vedo
    
    mesh_data = mesh_store[mesh_id]
    
    try:
        mesh = vedo.load(mesh_data["path"])
        
        bounds = mesh.bounds() or [0, 0, 0, 0, 0, 0]
        
        result = AnalysisResult(
            id=mesh_id,
            n_points=mesh.npoints,
            n_cells=mesh.ncells,
            volume=float(mesh.volume()) if mesh.volume() is not None else None,
            area=float(mesh.area()) if mesh.area() is not None else None,
            bounding_box=list(bounds),
            center_of_mass=list(mesh.centerOfMass()) if hasattr(mesh, 'centerOfMass') else None,
        )
        
        # Compute curvature if requested
        if compute_curvature:
            try:
                # Use PCV (Principal Curvature Vectors) for curvature analysis
                pcv = mesh.pcv()
                if pcv is not None and hasattr(pcv, 'points'):
                    curvature_values = pcv.points()
                    if len(curvature_values) > 0:
                        # Get min/max/mean curvature
                        result.curvature = {
                            "min": float(np.min(curvature_values[:, 0])) if len(curvature_values) > 0 else None,
                            "max": float(np.max(curvature_values[:, 0])) if len(curvature_values) > 0 else None,
                            "mean": float(np.mean(curvature_values[:, 0])) if len(curvature_values) > 0 else None,
                            "n_points": len(curvature_values),
                        }
            except Exception as e:
                # Curvature computation can fail for some meshes
                result.curvature = {"error": str(e)}
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze mesh: {str(e)}")


@router.get("/{mesh_id}/normals")
async def compute_normals(mesh_id: str, recompute: bool = True):
    """Compute or retrieve vertex normals"""
    if mesh_id not in mesh_store:
        raise HTTPException(status_code=404, detail="Mesh not found")
    
    import vedo
    
    mesh_data = mesh_store[mesh_id]
    
    try:
        mesh = vedo.load(mesh_data["path"])
        
        if recompute:
            mesh.computeNormals()
        
        # Get normals
        normals = mesh.normals(cells=False)  # Vertex normals
        
        if normals is not None:
            normals_list = normals.tolist() if hasattr(normals, 'tolist') else list(normals)
        else:
            normals_list = []
        
        # Get vertex positions
        points = mesh.points()
        vertices_list = points.tolist() if hasattr(points, 'tolist') else list(points)
        
        return {
            "vertices": vertices_list,
            "normals": normals_list,
            "n_vertices": len(vertices_list),
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to compute normals: {str(e)}")


@router.post("/{mesh_id}/transform")
async def transform_mesh(mesh_id: str, request: TransformRequest):
    """Transform a mesh (rotate, scale, translate)"""
    if mesh_id not in mesh_store:
        raise HTTPException(status_code=404, detail="Mesh not found")
    
    import vedo
    
    mesh_data = mesh_store[mesh_id]
    
    try:
        mesh = vedo.load(mesh_data["path"])
        
        op = request.operation
        params = request.params
        
        if op == "rotate":
            angle = params.get("angle", 0)
            axis = params.get("axis", "z")
            if axis == "x":
                mesh.rotate(angle, axis=[1, 0, 0])
            elif axis == "y":
                mesh.rotate(angle, axis=[0, 1, 0])
            else:
                mesh.rotate(angle, axis=[0, 0, 1])
                
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
            # Flip mesh orientation
            mesh.flipNormals()
            
        elif op == "center":
            # Center mesh at origin
            mesh.alignToOrigin()
        
        else:
            raise HTTPException(status_code=400, detail=f"Unknown operation: {op}")
        
        # Save transformed mesh
        mesh.write(mesh_data["path"])
        
        # Update metadata
        mesh_store[mesh_id]["n_points"] = mesh.npoints
        mesh_store[mesh_id]["n_cells"] = mesh.ncells
        
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
    """Fix mesh issues"""
    if mesh_id not in mesh_store:
        raise HTTPException(status_code=404, detail="Mesh not found")
    
    import vedo
    
    mesh_data = mesh_store[mesh_id]
    
    try:
        mesh = vedo.load(mesh_data["path"])
        
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
            raise HTTPException(status_code=400, detail=f"Unknown fix operation: {op}")
        
        # Save fixed mesh
        mesh.write(mesh_data["path"])
        
        # Update metadata
        mesh_store[mesh_id]["n_points"] = mesh.npoints
        mesh_store[mesh_id]["n_cells"] = mesh.ncells
        
        return {
            "success": True,
            "operation": op,
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
    
    Returns:
        - vertices: array of [x, y, z] positions
        - faces: array of [a, b, c] vertex indices
        - normals: optional vertex normals
        - metadata: basic mesh info
    """
    if mesh_id not in mesh_store:
        raise HTTPException(status_code=404, detail="Mesh not found")
    
    import vedo
    
    mesh_data = mesh_store[mesh_id]
    
    try:
        mesh = vedo.load(mesh_data["path"])
        
        # Get vertices
        points = mesh.points()
        vertices = points.tolist() if hasattr(points, 'tolist') else points
        
        # Get faces (convert cells to triangle list)
        cells = mesh.cells()
        faces = []
        
        # Parse cell data - Vedo stores cells as [n_verts, v1, v2, ...]
        i = 0
        while i < len(cells):
            n_verts = cells[i]
            if n_verts == 3:  # Triangle
                faces.append([int(cells[i+1]), int(cells[i+2]), int(cells[i+3])])
            elif n_verts == 4:  # Quad - convert to 2 triangles
                faces.append([int(cells[i+1]), int(cells[i+2]), int(cells[i+3])])
                faces.append([int(cells[i+1]), int(cells[i+3]), int(cells[i+4])])
            i += n_verts + 1
        
        # Get normals if requested
        normals = None
        if include_normals:
            try:
                mesh.computeNormals()
                norm_data = mesh.normals(cells=False)
                if norm_data is not None:
                    normals = norm_data.tolist() if hasattr(norm_data, 'tolist') else list(norm_data)
            except Exception:
                pass
        
        return VisualizeResponse(
            vertices=vertices,
            faces=faces,
            normals=normals,
            metadata={
                "n_vertices": len(vertices),
                "n_faces": len(faces),
                "filename": mesh_data["filename"],
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get visualization data: {str(e)}")


@router.get("/{mesh_id}/visualize/buffer")
async def visualize_mesh_buffer(mesh_id: str):
    """
    Get mesh data as flat typed arrays for optimal Three.js performance
    
    Returns binary data with:
        - Float32Array of vertices (x,y,z per vertex)
        - Uint32Array of indices (a,b,c per face)
    """
    if mesh_id not in mesh_store:
        raise HTTPException(status_code=404, detail="Mesh not found")
    
    import vedo
    
    mesh_data = mesh_store[mesh_id]
    
    try:
        mesh = vedo.load(mesh_data["path"])
        
        # Get vertices as flat array
        points = mesh.points()
        vertices_flat = points.flatten().astype(np.float32).tobytes()
        
        # Get faces as flat array
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
        
        # Create combined binary response
        # Format: 4 bytes (n_vertices) | vertices bytes | 4 bytes (n_indices) | indices bytes
        import struct
        
        n_vert_bytes = struct.pack('I', len(points))
        n_idx_bytes = struct.pack('I', len(indices))
        
        binary_data = n_vert_bytes + vertices_flat + n_idx_bytes + indices_array
        
        return Response(
            content=binary_data,
            media_type="application/octet-stream",
            headers={
                "X-N-Vertices": str(len(points)),
                "X-N-Indices": str(len(indices)),
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get buffer data: {str(e)}")


@router.get("/{mesh_id}/export")
async def export_mesh(
    mesh_id: str,
    format: str = Query("stl", description=f"Export format: {', '.join(EXPORT_FORMATS)}")
):
    """Export mesh to different format, returns file bytes"""
    if mesh_id not in mesh_store:
        raise HTTPException(status_code=404, detail="Mesh not found")
    
    format = format.lower()
    if format not in EXPORT_FORMATS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported format: {format}. Supported: {', '.join(EXPORT_FORMATS)}"
        )
    
    import vedo
    
    mesh_data = mesh_store[mesh_id]
    
    try:
        mesh = vedo.load(mesh_data["path"])
        
        # Write to buffer
        buffer = io.BytesIO()
        
        # Vedo's write method can write to file - use temp file
        import tempfile
        with tempfile.NamedTemporaryFile(suffix=f".{format}", delete=False) as tmp:
            tmp_path = tmp.name
        
        mesh.write(tmp_path)
        
        # Read back
        with open(tmp_path, "rb") as f:
            file_bytes = f.read()
        
        # Cleanup temp file
        os.unlink(tmp_path)
        
        # Determine content type
        content_types = {
            "stl": "application/sla",
            "obj": "model/obj",
            "ply": "application/octet-stream",
            "vtk": "application/vtk",
            "wrl": "model/vrml",
            "off": "application/octet-stream",
        }
        
        filename = f"{mesh_data['filename']}.{format}"
        
        return Response(
            content=file_bytes,
            media_type=content_types.get(format, "application/octet-stream"),
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")


@router.delete("/{mesh_id}")
async def delete_mesh(mesh_id: str):
    """Delete a mesh"""
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
