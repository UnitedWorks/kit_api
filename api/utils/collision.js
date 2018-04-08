export function pointPolygonCollision(point, vs) {
  if (!point || !vs) return false;
  // ray-casting algorithm based on
  // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
  const x = point[0];
  const y = point[1];
  let inside = false;
  for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
    const xi = vs[i][0];
    const yi = vs[i][1];
    const xj = vs[j][0];
    const yj = vs[j][1];
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

export function pointCircleCollision(point, circle, r) {
  if (r === 0) return false;
  const dx = circle[0] - point[0];
  const dy = circle[1] - point[1];
  return dx * dx + dy * dy <= r * r;
}
