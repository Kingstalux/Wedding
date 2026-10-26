/* Draws a QR-looking SVG for the mockup only. The real site generates a
   scannable code with the `qrcode` library. */
function mockQR(seed = 7, color = "#0C3B2E") {
  const n = 25;
  let s = seed;
  const rand = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  const finder = (x, y) =>
    `<rect x="${x}" y="${y}" width="7" height="7" fill="${color}"/>` +
    `<rect x="${x + 1}" y="${y + 1}" width="5" height="5" fill="#fff"/>` +
    `<rect x="${x + 2}" y="${y + 2}" width="3" height="3" fill="${color}"/>`;
  const inFinder = (x, y) => (x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9);
  let cells = "";
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++)
      if (!inFinder(x, y) && rand() > 0.52) cells += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
  return `<svg class="qr" viewBox="-1 -1 ${n + 2} ${n + 2}" role="img" aria-label="Entrance QR code" shape-rendering="crispEdges">` +
    `<rect x="-1" y="-1" width="${n + 2}" height="${n + 2}" fill="#fff"/>` +
    `<g fill="${color}">${cells}</g>${finder(0, 0)}${finder(n - 7, 0)}${finder(0, n - 7)}</svg>`;
}
