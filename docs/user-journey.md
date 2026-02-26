# User Journey Map - Vedo WebApp

## Overview

This document maps the user journey for Vedo WebApp across different user personas, identifying key touchpoints, pain points, and opportunities for improvement.

---

## Journey Stage 1: Discovery & Sign-Up

### Trigger
User encounters a need to process 3D meshes but lacks convenient access to desktop tools or wants a faster alternative.

### Persona-Specific Journeys

#### Dr. Maya Chen (Research Scientist)
- **Context:** Searching for "mesh processing web tool" or "3D mesh viewer browser"
- **Discovery:** Finds Vedo WebApp through GitHub, scientific forum, or colleague recommendation
- **Expectation:** Quick access without installation; scientific-grade analysis capabilities

#### Alex Rodriguez (Manufacturing Engineer)
- **Context:** Working remotely, needs to check 3D scan quality urgently
- **Discovery:** Colleague shares link or finds through "web-based mesh repair" search
- **Expectation:** Works in browser without VPN; solves immediate problem

#### Prof. James Wright (Academic Researcher)
- **Context:** Setting up mesh processing for students; wants zero-install solution
- **Discovery:** Vedo library mention or teaching resource recommendation
- **Expectation:** Easy to share with students; supports research workflows

### Touchpoints
- Search engine results
- GitHub repository
- Word of mouth / colleague recommendation
- Technical forums (ResearchGate, Stack Overflow)

### Pain Points (Discovery)
- Unclear if web tool has required capabilities
- Concerns about file size limits
- Security/privacy concerns for research data

### Opportunities
- Clear feature comparison with desktop tools
- Sample datasets for quick testing
- Clear data privacy policy

---

## Journey Stage 2: First Visit & Orientation

### User Actions
1. Navigate to Vedo WebApp URL
2. Land on homepage/dashboard
3. Understand what the tool does
4. Decide to try it out

### What They Experience

**Homepage Impressions**
- Clean, professional interface
- Clear value proposition: "Web-based mesh processing with Vedo"
- Feature highlights prominently displayed
- Call-to-action to start or see demo

**Onboarding Flow**
- Option to upload sample mesh or their own
- Brief tutorial or tooltips
- Clear navigation to all features

### Persona-Specific Expectations

| Persona | Key Expectation | Make-or-Break |
|---------|-----------------|---------------|
| Dr. Maya Chen | Scientific analysis features | Curvature, volume metrics |
| Alex Rodriguez | Quick hole-filling | Speed and simplicity |
| Prof. James Wright | Multi-format support | All common formats |
| Sarah Kim | 3D printing prep | STL support, fill holes |

### Pain Points (Orientation)
- Unclear how to start
- Too much text/instructions upfront
- Can't see immediate value

### Opportunities
- One-click demo with sample mesh
- Clear "Start Here" guidance
- Feature discovery through visual cues

---

## Journey Stage 3: Initial Use - Mesh Import

### User Actions
1. Click upload button or drag-and-drop mesh file
2. Select file from local system
3. Wait for upload and processing
4. View mesh in 3D viewer

### What They Experience

**Upload Interface**
- Drag-and-drop zone prominently displayed
- Clear file type indicators (STL, OBJ, PLY, VTK, WRL, OFF)
- File size limit shown
- Progress indicator during upload

**Processing Feedback**
- Loading state while mesh is analyzed
- Success confirmation with mesh summary
- Error messages for unsupported formats

**Initial Visualization**
- Mesh appears in 3D viewer
- Default camera angle shows full mesh
- Basic controls available immediately

### Persona-Specific Experiences

**Dr. Maya Chen**
- Imports protein surface mesh (PLY, 50K vertices)
- Pleased to see analysis auto-populates
- Wants to see point/cell counts immediately

**Alex Rodriguez**
- Imports STL scan (500K vertices, large file)
- Concerned about upload time
- Needs to see mesh quality right away

**Prof. James Wright**
- Imports multiple formats to test
- Checks if all formats render correctly
- Needs to switch between meshes

### Pain Points (Import)
- Large file upload takes too long
- Progress not clearly indicated
- No feedback on upload errors
- Can't undo/redo actions

### Opportunities
- Progress bar with percentage
- Chunked upload for large files
- Retry mechanism for failed uploads
- Recent files history

---

## Journey Stage 4: Mesh Inspection & Analysis

### User Actions
1. Rotate, zoom, pan to inspect mesh
2. View mesh statistics (points, cells, volume, area)
3. Run additional analysis (curvature, quality)
4. Compare before/after if modified

### What They Experience

**3D Viewer**
- Smooth rotation and zoom
- Multiple view options (perspective, orthographic)
- Background color options
- Grid or axis helpers for orientation

**Analysis Panel**
- Auto-computed metrics: points, cells, volume, area
- Bounding box dimensions
- Center of mass
- Optional: curvature, quality metrics

**Curvature Analysis**
- Select analysis method (Gaussian, Mean, Principal)
- Color-coded visualization
- Min/max/mean values displayed
- Export options for data

### Persona-Specific Journeys

**Dr. Maya Chen (Protein Analysis)**
1. Imports mesh from cryo-EM data
2. Rotates to find interesting surface features
3. Runs Gaussian curvature analysis
4. Identifies binding pocket from color map
5. Measures volume for publication
6. Exports analysis data

**Alex Rodriguez (QC Inspection)**
1. Imports scan mesh
2. Checks point/cell count (should be reasonable)
3. Runs quality metrics (skewness, orthogonality)
4. Identifies problem areas (high skewness regions)
5. Decides if mesh is usable or needs repair

**Prof. James Wright (Research)**
1. Imports dataset for algorithm testing
2. Runs full analysis suite
3. Compares metrics across multiple meshes
4. Documents results for paper
5. Shares visualization with students

### Pain Points (Analysis)
- Want more detailed metrics
- Need to export analysis as CSV/report
- Curvature visualization could be clearer
- Can't compare two meshes side-by-side

### Opportunities
- Detailed analysis reports (PDF/CSV export)
- Side-by-side mesh comparison
- Custom metric calculations
- Annotation/marking on mesh

---

## Journey Stage 5: Mesh Transformation

### User Actions
1. Select transform mode (rotate, scale, translate)
2. Apply transform via toolbar or keyboard
3. View updated mesh
4. Undo if needed

### What They Experience

**Transform Toolbar**
- Clear mode selector (Rotate/Scale/Translate)
- Quick action buttons (+/- for each)
- Numeric input for precise control
- Undo/redo available

**Quick Transforms**
- Rotate 90° buttons (most common)
- Scale up/down (common for viewing)
- Translate to center

**Precise Control**
- Input exact rotation angle
- Input exact scale factor
- Input exact translation values
- Axis selection (X, Y, Z)

### Persona-Specific Journeys

**Sarah Kim (3D Printing)**
1. Imports scan for 3D print prep
2. Scales to correct dimensions
3. Rotates to optimal print orientation
4. Centers mesh for slicing

**Dr. Maya Chen (Research)**
1. Aligns protein to standard orientation
2. Scales to unit size for comparison
3. Translates to origin for consistency
4. Documents transform for reproducibility

### Pain Points (Transform)
- Can't input precise values easily
- Need more transformation options
- Transforms not always predictable
- No way to reset to original

### Opportunities
- Numeric input fields prominently placed
- Transform presets for common operations
- Reset to original option
- Transform history panel

---

## Journey Stage 6: Mesh Repair

### User Actions
1. Select repair operation (Fill Holes, Smooth, Decimate)
2. Configure parameters if needed
3. Apply operation
4. View result and metrics update

### What They Experience

**Repair Operations**
- Fill Holes: One-click or configurable
- Smooth: Iterations parameter
- Decimate: Target reduction ratio
- Compute Normals: One-click
- Clean: One-click

**Operation Feedback**
- Loading state during processing
- Updated metrics shown after
- Visual comparison if possible
- Undo available

### Persona-Specific Journeys

**Alex Rodriguez (Manufacturing)**
1. Imports scan mesh with holes
2. Fills holes (one-click)
3. Smooths surface noise
4. Checks volume/area to verify
5. Decimates for CAD import (50% reduction)
6. Exports for downstream use

**Dr. Maya Chen (Research)**
1. Imports protein mesh with artifacts
2. Fills small holes
3. Smooths noise while preserving features
4. Checks that volume hasn't changed significantly
5. Documents repair steps for methods section

**Sarah Kim (3D Printing)**
1. Imports model with holes
2. One-click fill holes
3. Runs decimate to reduce poly count
4. Checks for remaining issues
5. Exports for 3D print

### Pain Points (Repair)
- Can't preview before applying
- Parameter meanings unclear
- Results unpredictable for complex meshes
- No way to selectively fill specific holes

### Opportunities
- Preview mode before applying
- Better parameter guidance/tooltips
- Selective hole filling (click to select)
- Before/after comparison slider

---

## Journey Stage 7: Advanced Operations

### Boolean Operations

**User Actions**
1. Select boolean operation (Union, Intersect, Subtract)
2. Choose second mesh
3. Execute operation
4. View result

**What They Experience**
- Mesh selector shows available meshes
- Three buttons for operation types
- Loading state during computation
- New mesh replaces or is created

**Pain Points**
- Need to manage multiple meshes
- No visual preview before operation
- Errors on complex intersections

**Opportunities**
- Visual preview before applying
- Auto-save original mesh
- Clear error messages

### Slicing

**User Actions**
1. Select slice axis (X, Y, Z)
2. Set slice position
3. Execute slice
4. View resulting cross-section

**What They Experience**
- Axis selector
- Numeric input for position
- Slider for position
- Result shows cross-section

**Pain Points**
- Hard to position slice precisely
- Can't slice multiple positions at once

**Opportunities**
- Slice animation/preview
- Batch slicing at intervals

---

## Journey Stage 8: Export & Save

### User Actions
1. Click export button
2. Select format
3. Download file
4. Verify in other tool

### What They Experience

**Export Options**
- Format selector (STL, OBJ, PLY, VTK, WRL, OFF)
- Current format shown
- One-click download
- File saved to downloads folder

### Persona-Specific Journeys

**Dr. Maya Chen (Publication)**
1. Runs full analysis
2. Exports processed mesh
3. Exports analysis data
4. Includes in paper/supplement

**Prof. James Wright (Teaching)**
1. Processes mesh
2. Creates shareable link
3. Sends to student
4. Student imports and continues

### Pain Points (Export)
- Limited format options
- No option for ASCII vs binary
- Can't export analysis as report
- No cloud save option

### Opportunities
- More export formats
- ASCII/binary option
- Analysis report export (PDF)
- Save to cloud storage

---

## Journey Stage 9: Collaboration & Sharing

### User Actions
1. Process mesh to desired state
2. Generate shareable link (if available)
3. Share with collaborator
4. Collaborator views/interacts

### What They Experience
- Current: No sharing built in
- Workaround: Export, share file manually

### Pain Points
- Can't share interactive 3D view
- File transfer required
- No way to show annotations

### Opportunities
- Generate shareable URL
- Read-only view for collaborators
- Annotation capability
- Version history

---

## Journey Stage 10: Repeat Use

### User Actions
1. Return to Vedo WebApp
2. Upload new mesh or continue previous
3. Same or different workflow

### What They Experience

**Return Visits**
- URL bookmarked or in history
- Interface familiar
- Expects same functionality

**Expectations**
- Faster than first time (know the tool)
- Wants to pick up where left off (session persistence)
- Same performance/functionality

### Pain Points (Repeat Use)
- No saved sessions
- Can't access previous meshes
- Have to re-upload

### Opportunities
- Local storage for recent meshes
- Session persistence
- User accounts (optional)

---

## Overall Pain Points Summary

### Critical (Block Usage)
1. **Large file handling** - Timeouts or errors on large meshes
2. **Format support** - Missing critical format
3. **Error recovery** - No clear path when errors occur

### Major (Significant Impact)
4. **No preview** - Can't see result before applying
5. **Limited export** - Can't save in needed format
6. **No sharing** - Can't collaborate
7. **No undo/redo** - Can't recover from mistakes

### Minor (Inconvenience)
8. **Numeric input** - Hard to enter precise values
9. **Parameter tuning** - Unclear what parameters do
10. **No history** - Can't see what operations were done

---

## Opportunity Matrix

| Stage | Opportunity | Impact | Effort |
|-------|-------------|--------|--------|
| Import | Progress indicator | High | Medium |
| Import | Recent files | Medium | Low |
| Analysis | Export reports | High | Medium |
| Repair | Preview mode | High | High |
| Repair | Selective hole fill | Medium | High |
| Boolean | Visual preview | High | Medium |
| Export | More formats | Medium | Low |
| Collaboration | Share links | High | High |
| General | Session save | Medium | Medium |

---

## Persona Journey Summary

| Stage | Dr. Maya Chen | Alex Rodriguez | Prof. Wright | Sarah Kim |
|-------|---------------|----------------|--------------|-----------|
| Discovery | Scientific search | Remote access need | Teaching setup | Quick fix need |
| Import | Standard formats | Large STL | Multi-format | STL |
| Analysis | Curvature focus | Quality metrics | Full suite | Basic |
| Transform | Align/center | Orient for print | Standard | Scale |
| Repair | Fill holes | Fill + smooth | Optional | Fill + decimate |
| Export | Analysis data | CAD format | Multiple | Print-ready |
| Key Value | Scientific features | Speed/remote | Zero-install | Simplicity |

---

## Next Steps

1. **Priority Fixes:** Address critical pain points (error handling, large files)
2. **Feature Validation:** Test high-impact opportunities with users
3. **Journey Optimization:** Streamline the most common paths per persona
4. **Metrics:** Track user drop-off at each journey stage
5. **Feedback Loop:** Regular user interviews to update journey map
