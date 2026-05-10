/**
 * Genera PNGs temporales para la PWA (color marca + forma simple centrada).
 * Ejecutar: npm run generate:pwa-icons
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "public", "icons");

/** slate-900 #0f172a */
const BG = [15, 23, 42];
/** emerald-400 #34d399 */
const ACCENT = [52, 211, 153];

function setPx(data, width, x, y, r, g, b, a = 255) {
  if (x < 0 || y < 0 || x >= width) return;
  const idx = (width * y + x) << 2;
  data[idx] = r;
  data[idx + 1] = g;
  data[idx + 2] = b;
  data[idx + 3] = a;
}

/**
 * @param {number} size
 * @param {{ maskable: boolean }} opts  maskable: contenido solo en zona segura (~80 %)
 */
function buildPng(size, opts) {
  const png = new PNG({ width: size, height: size });
  const data = png.data;
  const inset = opts.maskable ? Math.round(size * 0.1) : 0;
  const innerLeft = inset;
  const innerTop = inset;
  const innerW = size - inset * 2;
  const innerH = size - inset * 2;
  const cx = innerLeft + innerW / 2;
  const cy = innerTop + innerH / 2;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      setPx(data, size, x, y, BG[0], BG[1], BG[2]);
    }
  }

  const mw = innerW * 0.62;
  const mh = innerH * 0.42;
  const monitorTop = cy - mh / 2 - innerH * 0.04;
  const monitorBottom = cy + mh / 2 - innerH * 0.04;
  const standTop = monitorBottom;
  const standBottom = standTop + innerH * 0.11;
  const standHalf = innerW * 0.09;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const inMonitor =
        x >= cx - mw / 2 &&
        x <= cx + mw / 2 &&
        y >= monitorTop &&
        y <= monitorBottom;
      const inStand =
        x >= cx - standHalf &&
        x <= cx + standHalf &&
        y > standTop &&
        y <= standBottom;

      if (inMonitor || inStand) {
        setPx(data, size, x, y, ACCENT[0], ACCENT[1], ACCENT[2]);
      }
    }
  }

  return PNG.sync.write(png);
}

fs.mkdirSync(outDir, { recursive: true });

fs.writeFileSync(path.join(outDir, "icon-192.png"), buildPng(192, { maskable: false }));
fs.writeFileSync(path.join(outDir, "icon-512.png"), buildPng(512, { maskable: false }));
fs.writeFileSync(path.join(outDir, "icon-maskable-512.png"), buildPng(512, { maskable: true }));

console.log("Iconos PWA generados en:", outDir);
