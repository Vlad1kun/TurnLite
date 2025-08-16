function attachSegmentClickHandlers(svg, segments) {
  segments.forEach((seg, i) => {
    const el = document.getElementById(`seg-${i}`);
    if (!el) return;

    el.addEventListener('click', evt => {
      const { x: px, z: pz } = getSvgCoords(evt, svg);
      let point;

      if (seg.type === 'LINE') {
        point = getClosestPointOnLine(seg.x1, seg.z1, seg.x2, seg.z2, px, pz);
      } else if (seg.type === 'ARC_R' || seg.type === 'ARC_IK') {
        point = getClosestPointOnArc(seg.cx, seg.cz, seg.r, px, pz, seg.startAngle, seg.endAngle, seg.clockwise);
      }

      if (point) {
        drawMarker(svg, point.x, point.z);
        showCoords(point.x, point.z);
      }
    });
  });
}

function getSvgCoords(evt, svg) {
  const pt = svg.createSVGPoint();
  pt.x = evt.clientX;
  pt.y = evt.clientY;
  const svgP = pt.matrixTransform(svg.getScreenCTM().inverse());
  return { x: svgP.x, z: svgP.y };
}

function getClosestPointOnLine(x1, z1, x2, z2, px, pz) {
  const dx = x2 - x1;
  const dz = z2 - z1;
  const t = ((px - x1) * dx + (pz - z1) * dz) / (dx * dx + dz * dz);
  const clampedT = Math.max(0, Math.min(1, t));
  return {
    x: x1 + clampedT * dx,
    z: z1 + clampedT * dz
  };
}

function getClosestPointOnArc(cx, cz, r, px, pz, startAngle, endAngle, clockwise) {
  let angle = Math.atan2(pz - cz, px - cx);

  // Нормализуем все углы в диапазон [0, 2π]
  const normalize = a => (a + 2 * Math.PI) % (2 * Math.PI);
  angle = normalize(angle);
  startAngle = normalize(startAngle);
  endAngle = normalize(endAngle);

  // Проверка направления
  let inRange;
  if (clockwise) {
    inRange = startAngle >= endAngle
      ? angle <= startAngle && angle >= endAngle
      : angle <= startAngle || angle >= endAngle;
  } else {
    inRange = startAngle <= endAngle
      ? angle >= startAngle && angle <= endAngle
      : angle >= startAngle || angle <= endAngle;
  }

  if (!inRange) return null;

  return {
    x: cx + r * Math.cos(angle),
    z: cz + r * Math.sin(angle)
  };
}

function drawMarker(svg, x, z) {
  const old = document.getElementById('click-marker');
  if (old) old.remove();

  const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  circle.setAttribute("cx", x);
  circle.setAttribute("cy", z);
  circle.setAttribute("r", 1); // маленькая точка
  circle.setAttribute("fill", "red");
  circle.setAttribute("id", "click-marker");
  svg.appendChild(circle);
}

function showCoords(x, z) {
  const info = document.getElementById('clickInfo');
  if (info) {
    info.textContent = `X = ${(-z).toFixed(2) * 2}, Z = ${x.toFixed(2)}`;
  }
}
