// Measurement Export Utilities
// Provides PDF, CSV, and JSON export for measurements

import { Measurement } from '../types/viewer'

/**
 * Export measurements to JSON format
 */
export function exportToJSON(measurements: Measurement[], filename = 'measurements'): void {
  const data = {
    exportDate: new Date().toISOString(),
    totalMeasurements: measurements.length,
    summary: {
      distances: measurements.filter(m => m.type === 'distance').length,
      angles: measurements.filter(m => m.type === 'angle').length,
      areas: measurements.filter(m => m.type === 'area').length,
    },
    measurements: measurements.map(m => ({
      id: m.id,
      label: m.label,
      type: m.type,
      value: m.value,
      unit: getUnitForType(m.type),
      points: m.points.map(p => ({ x: p[0], y: p[1], z: p[2] })),
    })),
  }

  downloadFile(JSON.stringify(data, null, 2), `${filename}.json`, 'application/json')
}

/**
 * Export measurements to CSV format
 */
export function exportToCSV(measurements: Measurement[], filename = 'measurements'): void {
  const headers = ['Label', 'Type', 'Value', 'Unit', 'Point 1', 'Point 2', 'Point 3']
  
  const rows = measurements.map(m => [
    m.label,
    m.type,
    m.value.toFixed(4),
    getUnitForType(m.type),
    m.points[0] ? `(${m.points[0].join(', ')})` : '',
    m.points[1] ? `(${m.points[1].join(', ')})` : '',
    m.points[2] ? `(${m.points[2].join(', ')})` : '',
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n')

  downloadFile(csvContent, `${filename}.csv`, 'text/csv')
}

/**
 * Export measurements to PDF (HTML-based that can be printed)
 */
export function exportToPDF(measurements: Measurement[], meshInfo?: { name: string; vertices: number; faces: number }, filename = 'measurements-report'): void {
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  // Calculate summary stats
  const distances = measurements.filter(m => m.type === 'distance')
  const angles = measurements.filter(m => m.type === 'angle')
  const areas = measurements.filter(m => m.type === 'area')

  const totalDistance = distances.reduce((sum, m) => sum + m.value, 0)
  const avgDistance = distances.length > 0 ? totalDistance / distances.length : 0
  const totalArea = areas.reduce((sum, m) => sum + m.value, 0)
  const avgAngle = angles.length > 0 ? angles.reduce((sum, m) => sum + m.value, 0) / angles.length : 0

  // Generate HTML content
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Measurement Report - ${date}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      color: #333;
      line-height: 1.6;
    }
    h1 {
      color: #00a0b5;
      border-bottom: 2px solid #00a0b5;
      padding-bottom: 10px;
      margin-bottom: 30px;
    }
    h2 {
      color: #444;
      margin-top: 30px;
      font-size: 1.3em;
    }
    .header {
      margin-bottom: 30px;
    }
    .meta {
      color: #666;
      font-size: 0.9em;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 15px;
      margin: 20px 0;
    }
    .summary-card {
      background: #f5f5f5;
      padding: 15px;
      border-radius: 8px;
      text-align: center;
    }
    .summary-card .value {
      font-size: 1.8em;
      font-weight: bold;
      color: #00a0b5;
    }
    .summary-card .label {
      color: #666;
      font-size: 0.85em;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #eee;
    }
    th {
      background: #f9f9f9;
      font-weight: 600;
      color: #444;
    }
    tr:hover {
      background: #f9f9f9;
    }
    .type-badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 0.8em;
      font-weight: 500;
    }
    .type-distance { background: #e3f2fd; color: #1565c0; }
    .type-angle { background: #fff3e0; color: #e65100; }
    .type-area { background: #e8f5e9; color: #2e7d32; }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      color: #666;
      font-size: 0.85em;
      text-align: center;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📐 Measurement Report</h1>
    <div class="meta">
      <p><strong>Generated:</strong> ${date}</p>
      ${meshInfo ? `<p><strong>Mesh:</strong> ${meshInfo.name}</p>
      <p><strong>Vertices:</strong> ${meshInfo.vertices.toLocaleString()} | <strong>Faces:</strong> ${meshInfo.faces.toLocaleString()}</p>` : ''}
    </div>
  </div>

  <h2>Summary</h2>
  <div class="summary-grid">
    <div class="summary-card">
      <div class="value">${measurements.length}</div>
      <div class="label">Total Measurements</div>
    </div>
    <div class="summary-card">
      <div class="value">${distances.length}</div>
      <div class="label">Distances</div>
    </div>
    <div class="summary-card">
      <div class="value">${angles.length}</div>
      <div class="label">Angles</div>
    </div>
    <div class="summary-card">
      <div class="value">${areas.length}</div>
      <div class="label">Areas</div>
    </div>
  </div>

  ${distances.length > 0 ? `
  <h2>Distance Measurements</h2>
  <table>
    <thead>
      <tr>
        <th>Label</th>
        <th>Value</th>
        <th>Start Point</th>
        <th>End Point</th>
      </tr>
    </thead>
    <tbody>
      ${distances.map(m => `
      <tr>
        <td><strong>${m.label}</strong></td>
        <td>${m.value.toFixed(4)} units</td>
        <td>(${m.points[0].map(v => v.toFixed(3)).join(', ')})</td>
        <td>(${m.points[1].map(v => v.toFixed(3)).join(', ')})</td>
      </tr>
      `).join('')}
    </tbody>
  </table>
  <p><em>Total Distance: ${totalDistance.toFixed(4)} | Average: ${avgDistance.toFixed(4)}</em></p>
  ` : ''}

  ${angles.length > 0 ? `
  <h2>Angle Measurements</h2>
  <table>
    <thead>
      <tr>
        <th>Label</th>
        <th>Value</th>
        <th>Vertex</th>
        <th>Point 1</th>
        <th>Point 2</th>
      </tr>
    </thead>
    <tbody>
      ${angles.map(m => `
      <tr>
        <td><strong>${m.label}</strong></td>
        <td>${m.value.toFixed(2)}°</td>
        <td>(${m.points[1].map(v => v.toFixed(3)).join(', ')})</td>
        <td>(${m.points[0].map(v => v.toFixed(3)).join(', ')})</td>
        <td>(${m.points[2].map(v => v.toFixed(3)).join(', ')})</td>
      </tr>
      `).join('')}
    </tbody>
  </table>
  <p><em>Average Angle: ${avgAngle.toFixed(2)}°</em></p>
  ` : ''}

  ${areas.length > 0 ? `
  <h2>Area Measurements</h2>
  <table>
    <thead>
      <tr>
        <th>Label</th>
        <th>Value</th>
        <th>Vertices</th>
      </tr>
    </thead>
    <tbody>
      ${areas.map(m => `
      <tr>
        <td><strong>${m.label}</strong></td>
        <td>${m.value.toFixed(4)} sq units</td>
        <td>${m.points.map(p => `(${p.map(v => v.toFixed(3)).join(', ')})`).join(', ')}</td>
      </tr>
      `).join('')}
    </tbody>
  </table>
  <p><em>Total Area: ${totalArea.toFixed(4)} sq units</em></p>
  ` : ''}

  <div class="footer">
    <p>Generated by Vedo WebApp</p>
  </div>

  <div class="no-print" style="margin-top: 30px; text-align: center;">
    <button onclick="window.print()" style="padding: 12px 24px; font-size: 16px; background: #00a0b5; color: white; border: none; border-radius: 6px; cursor: pointer;">
      🖨️ Print / Save as PDF
    </button>
  </div>
</body>
</html>
  `

  // Open in new window for printing
  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(html)
    printWindow.document.close()
  }
}

/**
 * Download file helper
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Get unit string for measurement type
 */
function getUnitForType(type: Measurement['type']): string {
  switch (type) {
    case 'distance':
      return 'units'
    case 'angle':
      return 'degrees (°)'
    case 'area':
      return 'sq units'
    default:
      return 'units'
  }
}
