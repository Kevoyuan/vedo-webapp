# Vedo Research Report

**Research Date:** 2026-02-26  
**Source:** https://github.com/marcomusy/vedo

## 1. Project Overview

**Vedo** is a Python library for scientific analysis and visualization of 3D objects and point clouds. It is built on top of VTK (Visualization Toolkit) and NumPy, providing a user-friendly interface for working with 3D mesh data.

- **License:** MIT
- **Installation:** `pip install vedo` or `conda install -c conda-forge vedo`
- **Documentation:** https://vedo.embl.es
- **GitHub:** https://github.com/marcomusy/vedo

---

## 2. Main Features and Capabilities

### 2.1 Mesh & Point Cloud Processing

| Category | Features |
|----------|----------|
| **Import/Export** | VTK, STL, OBJ, 3DS, Dolfin-XML, GMSH, OFF, PCD, PLY |
| **Mesh Analysis** | Area, volume, center of mass calculations; vertex/face normals, curvatures, feature edges |
| **Mesh Editing** | Cutting, slicing, normalizing, moving vertex positions, hole filling |
| **Mesh Transformation** | Subdivision, simplification, smoothing, registration/alignment |
| **Topology** | Split by connectivity, extract largest connected region |
| **Geometric Operations** | Delaunay triangulation (2D/3 from lines, closest path findingD), mesh |
| **Intersections** | Mesh-plane, mesh-line, mesh-mesh intersections |
| **Point Operations** | Nearest point search, point-in-mesh tests |
| **Interpolation** | Radial Basis Functions (RBF), Thin Plate Splines |

### 2.2 Volumetric Data

- **Import:** VTK, volumetric TIFF, DICOM, SLC, MHD
- **Visualization:** Isosurfacing, ray-casting (composite/maximum projection)
- **Processing:** Volume slicing, cropping, probing with lines/planes
- **Advanced:** Stream-lines/tubes from vector fields, signed-distance generation

### 2.3 2D/3D Plotting

- 3D text with LaTeX syntax (30 fonts)
- Scatter plots (2D/3D), histograms, donut/pie charts
- Surface function plotting
- Polar, spherical plots
- Quiver, violin, whisker plots

### 2.4 Visualization & Interaction

- Custom lighting (point lights, colored lights)
- Multiple sync-ed or independent renderers
- Animation support with trailing lines and shadows
- Interactive sliders and buttons
- Glyph generation (associate mesh to each vertex)
- Tensor visualization

---

## 3. Example Use Cases & Demos

Vedo includes **300+ working examples** and notebooks demonstrating:

- Basic mesh loading and rendering
- Volume visualization (embryo data, DICOM)
- Geological scene visualization
- Point cloud analysis
- Mesh deformation and morphing
- Scientific plotting
- Animation sequences

### Key Demo Files (from vedo.embl.es/examples)

| File | Description |
|------|-------------|
| `embryo.tif` | Volumetric embryo data |
| `panther.stl.gz` | STL mesh example |
| `man.vtk` | VTK mesh example |
| `geo_scene.npz` | Geological scene |
| `embryo.x3d` | Web-exportable 3D scene |

---

## 4. Related Projects

### 4.1 Integration Libraries

| Library | Purpose |
|---------|---------|
| **trimesh** | Python library for loading and working with triangle meshes |
| **pyvista** | 3D plotting and mesh analysis (VTK wrapper) |
| **pymeshlab** | Python bindings for MeshLab surface reconstruction |
| **K3D-jupyter** | Jupyter notebook integration for interactive 3D |
| **Qt5** | Desktop GUI framework integration |

### 4.2 Web Export Capabilities

Vedo can export scenes to **X3D** format for web embedding:
- `export_x3d.html` - Embeddable 3D scenes in browsers
- Uses X3DOM for rendering in WebGL

---

## 5. Advanced Features for Web-Based Mesh Processing

Based on the Vedo feature set, here are features that would be valuable for a **Vedo WebApp**:

### 5.1 Core Mesh Processing (High Priority)

| Feature | Web Implementation | Notes |
|---------|-------------------|-------|
| **Mesh Import** | File upload (drag-drop) for STL, OBJ, VTK, PLY, OFF | Web-based file parsing |
| **Mesh Export** | Download processed meshes in STL/OBJ/VTK | Use WebAssembly VTK bindings |
| **Mesh Statistics** | Area, volume, vertex/face count, bounds | Real-time calculation |
| **Normals Computation** | Vertex/face normals, curvatures | GPU-accelerated in WebGL |
| **Mesh Smoothing** | Laplacian smoothing, Moving Least Squares | Iterative algorithms |
| **Mesh Simplification** | Decimation, subdivision controls | Quality vs. poly count |
| **Hole Filling** | Close gaps in meshes | Topology-aware filling |

### 5.2 Geometric Operations (Medium Priority)

| Feature | Description |
|---------|-------------|
| **Mesh Slicing** | Plane-based cross-section cutting |
| **Mesh Boolean** | Union, intersection, difference operations |
| **Mesh Registration** | Align multiple meshes (ICP algorithm) |
| **Closest Path** | Path finding along mesh edges |
| **Point Projections** | Project points onto mesh surface |

### 5.3 Visualization Features (High Priority)

| Feature | Web Implementation |
|---------|-------------------|
| **PBR Materials** | Physically-based rendering with lighting |
| **Scalar Coloring** | Color by curvature, distance, custom data |
| **Clipping Planes** | Interactive plane-based clipping |
| **Annotation** | Add labels, measurements, arrows |
| **Multiple Views** | Split-screen synchronized viewports |

### 5.4 Analysis Tools (Medium Priority)

| Feature | Description |
|---------|-------------|
| **Geodesic Distance** | Distance along mesh surface |
| **Thickness Analysis** | Local thickness computation |
| **Curvature Analysis** | Gaussian, mean, principal curvatures |
| **Feature Edges** | Detect sharp edges and corners |
| **Convex Hull** | Generate convex hull envelope |

### 5.5 UI/UX Features (High Priority)

| Feature | Description |
|---------|-------------|
| **Transform Controls** | Translate, rotate, scale mesh via gizmos |
| **Undo/Redo** | History stack for operations |
| **Layers/Scene Graph** | Manage multiple objects |
| **Measurements** | Distance, angle, area tools |
| **Screenshots** | High-resolution export |

---

## 6. Technology Stack Recommendations

For building a web-based mesh processing tool using Vedo concepts:

### Frontend
- **Three.js** or **VTK.js** for WebGL rendering
- **React** for UI components
- **WebAssembly** for performance-critical mesh operations

### Key Libraries to Study
- **VTK.js** - WebGL port of VTK (most relevant)
- **Three.js** - General WebGL framework
- **trimesh.js** - JavaScript mesh processing
- **gl-matrix** - Matrix/vector math

### Backend (Optional)
- Python with Vedo for heavy processing
- WebSocket for real-time updates
- File conversion pipeline

---

## 7. Summary

Vedo is a comprehensive Python library for 3D scientific visualization with a strong focus on mesh processing, volumetric data analysis, and interactive visualization. Its key strengths include:

✅ Rich mesh manipulation tools (edit, transform, analyze)  
✅ Volume rendering capabilities  
✅ Integration with scientific Python ecosystem  
✅ 300+ examples and solid documentation  
✅ MIT licensed  

For a web-based mesh processing tool, prioritize:

1. **Core:** File import/export, basic statistics, normals, smoothing
2. **Visualization:** PBR materials, scalar coloring, clipping
3. **Advanced:** Boolean operations, registration, thickness analysis
4. **UI:** Transform gizmos, undo/redo, measurements

---

*Research completed for Vedo WebApp project*
