# Vedo WebApp API Documentation

## Accessing the Docs

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc
- **OpenAPI JSON:** http://localhost:8000/openapi.json

## Running the Server

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## API Overview

### Mesh Operations (`/mesh`)
- `POST /mesh/import` - Import 3D mesh files
- `GET /mesh/{mesh_id}` - Get mesh metadata
- `GET /mesh/{mesh_id}/analyze` - Analyze mesh geometry
- `POST /mesh/{mesh_id}/transform` - Transform mesh (rotate, scale, translate)
- `POST /mesh/{mesh_id}/fix` - Fix mesh issues
- `GET /mesh/{mesh_id}/visualize` - Get Three.js compatible data
- `POST /mesh/{mesh_id}/export` - Export mesh to various formats
- `DELETE /mesh/{mesh_id}` - Delete mesh

### Scene Operations (`/api`)
- `POST /api/scenes` - Create a new scene
- `GET /api/scenes` - List all scenes
- `GET /api/scenes/{scene_id}` - Get scene details
- `DELETE /api/scenes/{scene_id}` - Delete scene
- `POST /api/scenes/{scene_id}/meshes/{mesh_id}` - Add mesh to scene
- `DELETE /api/scenes/{scene_id}/meshes/{mesh_id}` - Remove mesh from scene
- `POST /api/merge` - Merge multiple meshes

### Health Checks
- `GET /` - Root endpoint
- `GET /health` - Health check

## Supported Mesh Formats

Import: STL, OBJ, PLY, VTK, GLTF, GLB, 3MF, OFF, WRL, XYZ
Export: STL, OBJ, PLY, VTK, GLTF, GLB, 3MF, OFF, WRL, XYZ
