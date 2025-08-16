let points = [];

function addPoint() {
  const i = points.length;
  const row = document.createElement('tr');
  row.innerHTML = `
    <td>${i + 1}</td>
    <td><input type="number" step="0.01" /></td>
    <td><input type="number" step="0.01" /></td>
    <td>
      <select>
        <option value="LINE">LINE</option>
        <option value="ARC_R">ARC_R</option>
        <option value="ARC_IK">ARC_IK</option>
      </select>
    </td>
    <td><input type="number" step="0.01" /></td>
    <td><input type="number" step="0.01" /></td>
    <td><input type="number" step="0.01" /></td>
    <td>
      <select>
        <option value="CW">CW</option>
        <option value="CCW">CCW</option>
      </select>
    </td>
  `;
  Array.from(row.querySelectorAll('input, select')).forEach(el => {
    el.addEventListener('input', draw);
    el.addEventListener('change', draw);
  });

  document.getElementById('pointTable').appendChild(row);
  points.push(row);
  draw();
}

function clearPoints() {
  points = [];
  const table = document.getElementById('pointTable');
  while (table.rows.length > 1) table.deleteRow(1);
  document.getElementById('svg').innerHTML = '';
  document.getElementById('gcodeOutput').textContent = '';
  document.getElementById('segmentInfo').textContent = '';
  document.getElementById('clickInfo').textContent = '';
}

function getVal(row, idx) {
  const val = row.children[idx].children[0].value;
  return val === '' ? NaN : parseFloat(val);
}

function getType(row) {
  return row.children[3].children[0].value;
}

function getDir(row) {
  return row.children[7].children[0].value;
}

function draw() {
  const svg = document.getElementById('svg');
  const info = document.getElementById('segmentInfo');
  svg.innerHTML = '';
  info.textContent = '';

  const segments = [];

  for (let i = 1; i < points.length; i++) {
    const p1 = points[i - 1], p2 = points[i];
    const x1 = getVal(p1, 1) / 2, z1 = getVal(p1, 2);
    const x2 = getVal(p2, 1) / 2, z2 = getVal(p2, 2);
    if ([x1, z1, x2, z2].some(isNaN)) continue;

    const dx = x2 - x1;
    const dz = z2 - z1;
    const length = Math.hypot(dx, dz).toFixed(2);
    const angle = (Math.atan2(dx, dz) * 180 / Math.PI).toFixed(1);
    const type = getType(p2);
    const dir = getDir(p2);

    let segmentText = `Сегмент ${i}: ${type}\nΔX = ${dx}, ΔZ = ${dz}\nДлина = ${length} мм\n`;
    if (type === 'LINE') {
      segmentText += `Угол = ${angle}°\n`;
    } else if (type === 'ARC_R') {
      const r = getVal(p2, 4);
      if (isNaN(r)) continue;
      segmentText += `Радиус = ${r}, Направление = ${dir}\n`;
    } else {
      const iVal = getVal(p2, 5), kVal = getVal(p2, 6);
      if (isNaN(iVal) || isNaN(kVal)) continue;
      segmentText += `Центр I=${iVal}, K=${kVal}, Направление = ${dir}\n`;
    }
    segmentText += '\n';
    info.textContent += segmentText;

    if (type === 'LINE') {
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", z1);
      line.setAttribute("y1", -x1);
      line.setAttribute("x2", z2);
      line.setAttribute("y2", -x2);
      line.setAttribute("stroke", "blue");
      line.setAttribute("stroke-width", "1.5");
      line.setAttribute("id", `seg-${segments.length}`);
      svg.appendChild(line);

      segments.push({
        type: 'LINE',
        x1: z1, z1: -x1,
        x2: z2, z2: -x2
      });
    } else {
      let arc = document.createElementNS("http://www.w3.org/2000/svg", "path");
      let sweep = dir === 'CW' ? 0 : 1;
      let svgPath = '';
      let cx, cz, r, startAngle, endAngle;

      if (type === 'ARC_R') {
        const rVal = getVal(p2, 4);
        if (isNaN(rVal)) continue;
        r = rVal;

        const dx = z2 - z1;
        const dy = -x2 - (-x1);
        const chordLen = Math.hypot(dx, dy);
        if (r < chordLen / 2) continue;

        const mx = (z1 + z2) / 2;
        const my = (-x1 + -x2) / 2;
        const h = Math.sqrt(r * r - (chordLen / 2) ** 2);
        const nx = -dy / chordLen;
        const ny = dx / chordLen;
        cx = mx + (dir === 'CW' ? -1 : 1) * h * nx;
        cz = my + (dir === 'CW' ? -1 : 1) * h * ny;

        svgPath = `M ${z1} ${-x1} A ${r} ${r} 0 0 ${sweep} ${z2} ${-x2}`;
        startAngle = Math.atan2(-x1 - cz, z1 - cx);
        endAngle = Math.atan2(-x2 - cz, z2 - cx);
      } else {
        const iVal = getVal(p2, 5), kVal = getVal(p2, 6);
        if (isNaN(iVal) || isNaN(kVal)) continue;
        cx = z1 + kVal;
        cz = -x1 + iVal;
        const dx1 = z1 - cx, dy1 = -x1 - cz;
        const dx2 = z2 - cx, dy2 = -x2 - cz;
        r = Math.hypot(dx1, dy1);
        const largeArc = (dx1 * dy2 - dx2 * dy1) * (sweep ? 1 : -1) > 0 ? 1 : 0;
        svgPath = `M ${z1} ${-x1} A ${r} ${r} 0 ${largeArc} ${sweep} ${z2} ${-x2}`;
        startAngle = Math.atan2(-x1 - cz, z1 - cx);
        endAngle = Math.atan2(-x2 - cz, z2 - cx);
      }

      arc.setAttribute("d", svgPath);
      arc.setAttribute("fill", "none");
      arc.setAttribute("stroke", "blue");
      arc.setAttribute("stroke-width", "1.5");
      arc.setAttribute("id", `seg-${segments.length}`);
      svg.appendChild(arc);

      segments.push({
        type: type,
        cx, cz, r,
        startAngle, endAngle,
        clockwise: dir === 'CW'
      });
    }
  }

  attachSegmentClickHandlers(svg, segments);
}

function generateGCode() {
  const safeX = parseFloat(document.getElementById("safeX").value);
  const safeZ = parseFloat(document.getElementById("safeZ").value);

  const startZ = getVal(points[0], 2);
  const startX = getVal(points[0], 1);
  const safeStartX = (startX + safeX).toFixed(2);
  const safeStartZ = (startZ + safeZ).toFixed(2);

  let gcode = '';
  gcode += `G0 X${safeStartX} Z${safeStartZ}\n`;

  for (let i = 1; i < points.length; i++) {
    const p2 = points[i];
    const x = getVal(p2, 1);
    const z = getVal(p2, 2);
    if (isNaN(x) || isNaN(z)) continue;

    const type = getType(p2);
    const dir = getDir(p2) === 'CW' ? 'G2' : 'G3';

    if (type === 'LINE') {
      gcode += `G1 X${x.toFixed(2)} Z${z.toFixed(2)}\n`;
    } else if (type === 'ARC_R') {
      const r = getVal(p2, 4);
      if (isNaN(r)) continue;
      gcode += `${dir} X${x.toFixed(2)} Z${z.toFixed(2)} R${r.toFixed(2)}\n`;
    } else if (type === 'ARC_IK') {
      const iVal = getVal(p2, 5), kVal = getVal(p2, 6);
      if (isNaN(iVal) || isNaN(kVal)) continue;
      gcode += `${dir} X${x.toFixed(2)} Z${z.toFixed(2)} I${iVal.toFixed(2)} K${kVal.toFixed(2)}\n`;
    }
  }

  document.getElementById('gcodeOutput').textContent = gcode;
}
