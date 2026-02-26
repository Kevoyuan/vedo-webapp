# Interview Questions - Vedo WebApp User Research

## Overview

This document contains interview questions for gathering user feedback on the Vedo WebApp. Questions are organized by topic and persona relevance.

---

## Section 1: Current Workflow & Tools

### General Workflow Questions
1. Walk me through your typical workflow when you need to process or analyze a 3D mesh file.
2. What software tools do you currently use for mesh processing? (Probe: MeshLab, Blender, Python scripts, CAD tools)
3. How often do you work with 3D mesh files in a typical week?
4. Where do you typically access these tools? (Office desktop, laptop, remote/VPN, mobile)

### Tool-Specific Questions
5. What do you like most about your current mesh processing tools?
6. What frustrates you most about your current workflow?
7. Have you tried web-based mesh tools before? If so, what did you like or dislike?
8. How do you currently handle mesh processing when working remotely or traveling?

### File Handling Questions
9. What mesh file formats do you work with most frequently? (STL, OBJ, PLY, etc.)
10. What's the typical size of mesh files you work with? (Number of vertices/faces)
11. Do you ever need to process multiple meshes at once? How do you handle that?

---

## Section 2: Vedo WebApp Discovery & Usage

### Discovery Questions
12. How did you hear about Vedo WebApp?
13. What feature or capability made you want to try it?
14. What were you hoping it would do before you first used it?

### Initial Impressions
15. What was your first impression after using Vedo WebApp?
16. How does the web-based interface compare to desktop tools you've used?
17. What took you by surprise (positively or negatively)?

### Feature Discovery
18. Were you able to find the features you needed easily?
19. What features did you try first? Which ones were most intuitive?
20. Are there any features you didn't discover but wish you had?

---

## Section 3: Use Case Validation

### Mesh Import & Export
21. What mesh formats do you need to import? Which are most critical?
22. What formats do you need to export to? What's your downstream use?
23. How important is batch import/export to your workflow?

### Transform Operations
24. How often do you rotate, scale, or translate meshes?
25. Do you use keyboard shortcuts? If so, which ones are most important?
26. Would you benefit from more precise numeric input for transforms?

### Repair Operations (Fill Holes, Smooth, Decimate)
27. How frequently do you need to fill holes in meshes?
28. What types of holes do you typically encounter? (Small holes, large gaps, complex topology)
29. How important is the "smooth" operation for your work?
30. When do you use decimation? What target reduction ratios do you typically need?

### Boolean Operations
31. Do you use boolean operations (union, intersection, difference)?
32. What types of objects are you combining? (Scans, CAD models, primitives)
33. How critical is precision for your boolean operations?

### Slicing
34. What do you use mesh slicing for? (Cross-sections, 3D printing, analysis)
35. Do you need to specify slice positions precisely?

### Analysis Features
36. What analysis metrics are most important to you? (Volume, area, curvature, quality)
37. How do you use curvature analysis in your work?
38. What quality metrics do you need? (Aspect ratio, skewness, orthogonality)
39. Do you need to export analysis results (reports, visualizations)?

---

## Section 4: User Experience

### Interface & Navigation
40. How easy was it to navigate the interface?
41. What aspects of the UI work well for you?
42. What aspects of the UI could be improved?

### Viewer Controls
43. How intuitive were the 3D viewer controls (rotate, zoom, pan)?
44. Did you try the keyboard shortcuts? Were they helpful?
45. What additional viewer features would you like?

### Performance
46. How would you describe the performance for meshes of your typical size?
47. Did you encounter any slowdowns or errors? (Probe for specific scenarios)

### Error Handling
48. How clear were error messages when something went wrong?
29. Did you ever get stuck and not know how to proceed?

---

## Section 5: Collaboration & Sharing

### Sharing Features
50. Do you need to share meshes or results with collaborators?
51. How do you currently share mesh data? (File sharing, screenshots, links)
52. Would you use a feature to generate shareable links to processed meshes?

### Collaboration Workflows
53. Do you work on meshes with remote team members?
54. Would real-time collaboration be valuable? (Simultaneous editing)

---

## Section 6: Integration & Automation

### API & Automation
55. Do you run repetitive mesh processing tasks that could be automated?
56. Would an API be valuable for integrating with your existing workflows?
27. What programming languages do you use? (For potential API integration)

### File Management
58. How do you organize your mesh files?
59. Would cloud storage integration (Google Drive, Dropbox) be useful?
60. Do you need version history or undo/redo for mesh operations?

---

## Section 7: Competitive Context

### Alternatives
61. What would you use if Vedo WebApp didn't exist?
62. How does Vedo WebApp compare to tools like MeshLab, Blender, CloudCompare?
63. What does Vedo WebApp do better than alternatives?
64. What do alternatives do better than Vedo WebApp?

### Willingness to Pay
65. Would you be willing to pay for Vedo WebApp? For which features?
66. What would make it indispensable to your workflow?

---

## Section 8: Persona-Specific Questions

### For Research Scientists (Persona: Dr. Maya Chen)
67. How do you use mesh analysis in your publications?
68. Do you need to process meshes from specific sources? (Cryo-EM, CT scans, simulations)
69. How important is reproducibility of mesh processing steps?

### For Manufacturing Engineers (Persona: Alex Rodriguez)
70. How do you use meshes in quality control?
71. What are your requirements for mesh accuracy/precision?
72. Do you need to compare meshes against CAD nominal models?

### For Academic Researchers (Persona: Prof. James Wright)
73. What mesh datasets do you use for research?
74. How do you teach mesh processing to students?
75. Do you need to integrate with Python/Jupyter notebooks?

### For 3D Artists/Designers (Persona: Sarah Kim)
76. What software do you use for final mesh preparation?
77. What are your 3D printing requirements?
78. Do you work with meshes for game/VR development?

### For Medical Imaging Specialists (Persona: Dr. Raj Patel)
79. What medical imaging modalities do you work with?
80. What are your requirements for handling patient data?
81. Do you need to prepare meshes for surgical guides or implants?

---

## Section 9: Future & Feedback

### Feature Requests
82. What features would you most like to see added?
83. Are there any workflows you couldn't complete that you expected to?

### Overall Feedback
84. On a scale of 1-10, how likely are you to recommend Vedo WebApp to a colleague?
85. What would it take to make Vedo WebApp your primary mesh processing tool?
86. Is there anything else you'd like to share about your experience?

---

## Interview Tips

### Dos
- **Start with open-ended questions** to understand their context
- **Probe for specific examples** when they mention pain points
- **Observe them using the tool** rather than just asking about it
- **Ask follow-up questions** to understand the "why" behind answers

### Don'ts
- Don't lead with feature-specific questions - understand their workflow first
- Don't assume they know technical terms - explain if needed
- Don't push for answers they're uncomfortable with
- Don't make promises about future features

### Session Structure
1. **Introduction** (5 min) - Set expectations, get background
2. **Current Workflow** (15 min) - Understand their context
3. **Vedo WebApp Experience** (20 min) - Gather feedback
4. **Deep Dive** (15 min) - Persona-specific questions
5. **Wrap-up** (5 min) - Final thoughts, next steps

### Target Participants
- 5-8 participants per persona segment
- Mix of novice and experienced users
- Include both satisfied and dissatisfied users
- Aim for diversity in organization size and geography
