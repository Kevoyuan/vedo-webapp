# Vedo WebApp Feature Roadmap

A feature wishlist and implementation roadmap for advanced 3D web capabilities.

---

## 1. WebGL Enhancements

### Post-Processing Effects
- **Bloom/Glow** - HDR bloom for emissive materials
- **Depth of Field (DOF)** - Bokeh effects for cinematic renders
- **Motion Blur** - Velocity-based blur for animations
- **SSAO** - Screen-space ambient occlusion for depth
- **SSRR** - Screen-space reflection
- **Color Grading** - LUT-based color correction
- **FXAA/SMAA** - Anti-aliasing options
- **Tone Mapping** - ACES, Reinhard, Filmic

**Tech**: Three.js postprocessing, @react-three/postprocessing

### PBR Materials
- **Environment Maps** - HDRIBL lighting (RGBE format support)
- **Material Editor** - Real-time PBR parameter tweaking
- **Preset Library** - Metal, plastic, glass, ceramic, fabric
- **Custom Shaders** - GLSL shader support for advanced effects
- **Texture Baking** - Bake AO/normals for web optimization
- **Anisotropic Materials** - Brushed metal, hair rendering

**Tech**: Three.js MeshStandardMaterial, MeshPhysicalMaterial, custom ShaderMaterial

### Performance Optimizations
- **LOD (Level of Detail)** - Automatic mesh simplification
- **Instanced Rendering** - For repeated geometry
- **Frustum Culling** - Built-in Three.js optimization
- **Texture Compression** - KTX2/Basis Universal
- **Geometry Compression** - Dracos/Meshopt

---

## 2. Collaborative Editing (Real-Time Multi-User)

### Core Infrastructure
- **WebSocket Server** - Real-time state sync
- **CRDT/OT** - Conflict-free replicated data types for concurrent edits
- **User Presence** - Show other users' cursors/selections
- **Session Management** - Create/join/share sessions

### Features
- **Live Cursor Tracking** - See where others are working
- **Selection Locking** - Prevent edit conflicts
- **Undo/Redo History** - Per-user or global
- **Change Highlighting** - Show who changed what
- **Commenting/Annotations** - Pin comments to 3D positions
- **Chat/Video** - Integrated communication

**Tech**: Yjs (CRDT), Socket.io/WebSocket, Liveblocks, PartyKit

### Implementation Phases
1. Basic: Shared scene viewing
2. Medium: Simultaneous transforms
3. Advanced: Full concurrent editing with conflict resolution

---

## 3. Cloud Storage Integration

### Storage Providers
- **AWS S3** - Primary cloud storage
- **Google Drive** - Personal file sync
- **Dropbox** - Alternative cloud
- **OneDrive** - Microsoft ecosystem
- **Custom Server** - Self-hosted option

### Features
- **Auto-Save** - Periodic background saves
- **Version History** - Restore previous versions
- **Share Links** - Public/private sharing
- **File Browser** - In-app cloud file explorer
- **Import from URL** - Load meshes directly from cloud
- **Export Formats** - OBJ, STL, PLY, GLTF, USDZ

### Data Management
- **Project Organization** - Folders, tags, favorites
- **Offline Support** - Local cache with sync
- **Collaboration Sharing** - Team workspaces

**Tech**: AWS SDK, Google Drive API, FilePond, react-dropzone

---

## 4. AI-Powered Features

### Mesh Processing
- **Auto-Fix** - Detect and repair mesh issues (holes, non-manifold, flipped normals)
- **Mesh Simplification** - AI-driven LOD generation
- **Denoising** - Clean up noisy scans
- **Completion** - Fill missing geometry
- **Semantic Segmentation** - Auto-detect parts (bolts, holes, surfaces)

### Search & Discovery
- **Natural Language Search** - "Find cylinder with hole"
- **Similar Shape Search** - Visual similarity matching
- **AI Tagging** - Auto-categorize meshes
- **Sketch-to-3D** - Convert 2D drawings to 3D

### Generative Features
- **Parametric Variations** - Generate variants of a design
- **Style Transfer** - Apply visual styles
- **AI Material Picker** - Suggest materials based on context
- **Auto-Layout** - Optimize part placement

**Tech**: Open3D, PyTorch3D, Transformers.js, Vertex AI

---

## 5. Tool Integrations

### Blender
- **Import/Export** - Native Blender file support (.blend)
- **Live Link** - Real-time sync with Blender
- **Plugin** - One-click send to web viewer
- **Geometry Nodes** - Support for node-based operations

### Unity
- **GLTF Pipeline** - Seamless Unity integration
- **USD Export** - Universal Scene Description
- **Prefab Generation** - Auto-create Unity prefabs

### CAD Software
- **STEP/IGES** - Industry-standard CAD formats
- **Fusion 360** - Direct integration
- **SolidWorks** - Parametric CAD support
- **Onshape** - Cloud CAD sync

### Other Tools
- **Sketchfab** - Publish directly to Sketchfab
- **ShapeDiver** - Parametric CAD viewer
- **Microsoft Mesh** - VR/AR collaboration
- **Autodesk Construction Cloud** - BIM integration

**Tech**: OpenCASCADE, PythonOCC, web-ifc, scene-graph-utils

---

## 6. Mobile Support

### Responsive Design
- **Touch Controls** - Pinch zoom, rotate, pan
- **Gesture Recognition** - Two-finger rotate, three-finger pan
- **Mobile Layout** - Adapted UI for small screens

### Performance
- **Reduced Quality** - Lower resolution rendering
- **Simplified Effects** - Disable heavy post-processing
- **Progressive Loading** - LOD streaming for mobile
- **Hardware Acceleration** - WebGL 2.0 on mobile

### Mobile Features
- **AR Preview** - View models in AR (WebXR)
- **Camera Capture** - Import from device camera
- **Touch-Based Modeling** - Simple sculpting on touch
- **Offline Mode** - Cache projects locally

**Tech**: @react-three/fiber, react-xr, WebXR Device API

---

## Priority Roadmap

### Phase 1: Foundation (0-3 months)
- [ ] PBR material editor with environment maps
- [ ] Post-processing pipeline (bloom, DOF, SSAO)
- [ ] Mobile-responsive UI
- [ ] Touch controls
- [ ] Basic cloud storage (S3)

### Phase 2: Collaboration (3-6 months)
- [ ] Real-time multi-user sessions (Yjs)
- [ ] User presence & cursors
- [ ] Change history
- [ ] Share links

### Phase 3: AI Integration (6-12 months)
- [ ] Mesh auto-fix
- [ ] AI simplification
- [ ] Natural language search
- [ ] Semantic segmentation

### Phase 4: Ecosystem (12-18 months)
- [ ] Blender live link
- [ ] CAD format support (STEP/IGES)
- [ ] AR preview
- [ ] Third-party integrations

---

## Technical Considerations

### Performance Budget
- Target: 60fps on mid-range devices
- Max initial load: 3 seconds
- Mesh limit: 10M triangles (with LOD)

### Browser Support
- Chrome 90+, Firefox 88+, Safari 15+, Edge 90+
- WebGL 2.0 required for advanced features
- WebXR for AR features

### Security
- End-to-end encryption for collaborative sessions
- Signed URLs for cloud storage
- Rate limiting on API endpoints
