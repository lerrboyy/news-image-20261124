// The Tuesday Globe — news-image-20261124
// A single-page broadsheet front page for Tuesday 24 November 2026,
// drawn entirely in code. Node 22+ standard library only.
// Deterministic: no timestamps, no randomness, no network.

import * as fs from "node:fs";
import * as zlib from "node:zlib";

const W = 1024;
const H = 1024;

// ---------------------------------------------------------------- palette
const PAPER: RGB = [248, 243, 231];
const INK: RGB = [25, 23, 19];
const GREEN: RGB = [30, 77, 59];
const RED: RGB = [179, 32, 44];
const GOLD: RGB = [184, 134, 11];
const NAVY: RGB = [29, 53, 87];
const GREY: RGB = [107, 101, 90];
const WHITE: RGB = [255, 255, 255];
const LIGHTGREEN: RGB = [214, 228, 218];

type RGB = [number, number, number];

// ------------------------------------------------------------- 5x7 font
// Each glyph is 7 rows; each row is a 5-bit number, MSB = leftmost pixel.
const FONT: Record<string, number[]> = {
  A: [0x0e, 0x11, 0x11, 0x1f, 0x11, 0x11, 0x11],
  B: [0x1e, 0x11, 0x11, 0x1e, 0x11, 0x11, 0x1e],
  C: [0x0e, 0x11, 0x10, 0x10, 0x10, 0x11, 0x0e],
  D: [0x1e, 0x11, 0x11, 0x11, 0x11, 0x11, 0x1e],
  E: [0x1f, 0x10, 0x10, 0x1e, 0x10, 0x10, 0x1f],
  F: [0x1f, 0x10, 0x10, 0x1e, 0x10, 0x10, 0x10],
  G: [0x0e, 0x11, 0x10, 0x17, 0x11, 0x11, 0x0f],
  H: [0x11, 0x11, 0x11, 0x1f, 0x11, 0x11, 0x11],
  I: [0x0e, 0x04, 0x04, 0x04, 0x04, 0x04, 0x0e],
  J: [0x07, 0x02, 0x02, 0x02, 0x02, 0x12, 0x0c],
  K: [0x11, 0x12, 0x14, 0x18, 0x14, 0x12, 0x11],
  L: [0x10, 0x10, 0x10, 0x10, 0x10, 0x10, 0x1f],
  M: [0x11, 0x1b, 0x15, 0x15, 0x11, 0x11, 0x11],
  N: [0x11, 0x19, 0x15, 0x13, 0x11, 0x11, 0x11],
  O: [0x0e, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0e],
  P: [0x1e, 0x11, 0x11, 0x1e, 0x10, 0x10, 0x10],
  Q: [0x0e, 0x11, 0x11, 0x11, 0x15, 0x12, 0x0d],
  R: [0x1e, 0x11, 0x11, 0x1e, 0x14, 0x12, 0x11],
  S: [0x0f, 0x10, 0x10, 0x0e, 0x01, 0x01, 0x1e],
  T: [0x1f, 0x04, 0x04, 0x04, 0x04, 0x04, 0x04],
  U: [0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0e],
  V: [0x11, 0x11, 0x11, 0x11, 0x11, 0x0a, 0x04],
  W: [0x11, 0x11, 0x11, 0x15, 0x15, 0x1b, 0x11],
  X: [0x11, 0x11, 0x0a, 0x04, 0x0a, 0x11, 0x11],
  Y: [0x11, 0x11, 0x0a, 0x04, 0x04, 0x04, 0x04],
  Z: [0x1f, 0x01, 0x02, 0x04, 0x08, 0x10, 0x1f],
  a: [0x00, 0x00, 0x0e, 0x01, 0x0f, 0x11, 0x0f],
  b: [0x10, 0x10, 0x1e, 0x11, 0x11, 0x11, 0x1e],
  c: [0x00, 0x00, 0x0e, 0x10, 0x10, 0x11, 0x0e],
  d: [0x01, 0x01, 0x0f, 0x11, 0x11, 0x11, 0x0f],
  e: [0x00, 0x00, 0x0e, 0x11, 0x1f, 0x10, 0x0e],
  f: [0x06, 0x08, 0x08, 0x1e, 0x08, 0x08, 0x08],
  g: [0x00, 0x0f, 0x11, 0x11, 0x0f, 0x01, 0x0e],
  h: [0x10, 0x10, 0x1e, 0x11, 0x11, 0x11, 0x11],
  i: [0x04, 0x00, 0x0c, 0x04, 0x04, 0x04, 0x0e],
  j: [0x02, 0x00, 0x06, 0x02, 0x02, 0x12, 0x0c],
  k: [0x10, 0x10, 0x12, 0x14, 0x18, 0x14, 0x12],
  l: [0x0c, 0x04, 0x04, 0x04, 0x04, 0x04, 0x0e],
  m: [0x00, 0x00, 0x1a, 0x15, 0x15, 0x15, 0x15],
  n: [0x00, 0x00, 0x1e, 0x11, 0x11, 0x11, 0x11],
  o: [0x00, 0x00, 0x0e, 0x11, 0x11, 0x11, 0x0e],
  p: [0x00, 0x1e, 0x11, 0x11, 0x1e, 0x10, 0x10],
  q: [0x00, 0x00, 0x0f, 0x11, 0x11, 0x0f, 0x01],
  r: [0x00, 0x00, 0x16, 0x19, 0x10, 0x10, 0x10],
  s: [0x00, 0x00, 0x0f, 0x10, 0x0e, 0x01, 0x1e],
  t: [0x08, 0x08, 0x1c, 0x08, 0x08, 0x08, 0x04],
  u: [0x00, 0x00, 0x11, 0x11, 0x11, 0x13, 0x0d],
  v: [0x00, 0x00, 0x11, 0x11, 0x11, 0x0a, 0x04],
  w: [0x00, 0x00, 0x11, 0x15, 0x15, 0x15, 0x0a],
  x: [0x00, 0x00, 0x11, 0x0a, 0x04, 0x0a, 0x11],
  y: [0x00, 0x00, 0x11, 0x11, 0x0f, 0x01, 0x0e],
  z: [0x00, 0x00, 0x1f, 0x02, 0x04, 0x08, 0x1f],
  "0": [0x0e, 0x11, 0x13, 0x15, 0x19, 0x11, 0x0e],
  "1": [0x04, 0x0c, 0x04, 0x04, 0x04, 0x04, 0x0e],
  "2": [0x0e, 0x11, 0x01, 0x06, 0x08, 0x10, 0x1f],
  "3": [0x1f, 0x02, 0x04, 0x02, 0x01, 0x11, 0x0e],
  "4": [0x02, 0x06, 0x0a, 0x12, 0x1f, 0x02, 0x02],
  "5": [0x1f, 0x10, 0x1e, 0x01, 0x01, 0x11, 0x0e],
  "6": [0x06, 0x08, 0x10, 0x1e, 0x11, 0x11, 0x0e],
  "7": [0x1f, 0x01, 0x02, 0x04, 0x08, 0x08, 0x08],
  "8": [0x0e, 0x11, 0x11, 0x0e, 0x11, 0x11, 0x0e],
  "9": [0x0e, 0x11, 0x11, 0x0f, 0x01, 0x02, 0x0c],
  " ": [0, 0, 0, 0, 0, 0, 0],
  ".": [0, 0, 0, 0, 0, 0x0c, 0x0c],
  ",": [0, 0, 0, 0, 0x0c, 0x04, 0x08],
  ";": [0, 0x0c, 0x0c, 0, 0x0c, 0x04, 0x08],
  ":": [0, 0x0c, 0x0c, 0, 0x0c, 0x0c, 0],
  "!": [0x04, 0x04, 0x04, 0x04, 0x04, 0, 0x04],
  "?": [0x0e, 0x11, 0x01, 0x02, 0x04, 0, 0x04],
  "'": [0x04, 0x04, 0x08, 0, 0, 0, 0],
  '"': [0x0a, 0x0a, 0x0a, 0, 0, 0, 0],
  "-": [0, 0, 0, 0x1f, 0, 0, 0],
  "(": [0x02, 0x04, 0x08, 0x08, 0x08, 0x04, 0x02],
  ")": [0x08, 0x04, 0x02, 0x02, 0x02, 0x04, 0x08],
  "&": [0x0c, 0x12, 0x14, 0x08, 0x15, 0x12, 0x0d],
  "%": [0x19, 0x19, 0x02, 0x04, 0x08, 0x13, 0x13],
  "+": [0, 0x04, 0x04, 0x1f, 0x04, 0x04, 0],
  "/": [0x01, 0x01, 0x02, 0x04, 0x08, 0x10, 0x10],
  "=": [0, 0, 0x1f, 0, 0x1f, 0, 0],
  "#": [0x0a, 0x0a, 0x1f, 0x0a, 0x0a, 0x1f, 0x0a],
  "@": [0x0e, 0x11, 0x1d, 0x15, 0x1d, 0x10, 0x0e],
  "*": [0, 0x04, 0x15, 0x0e, 0x15, 0x04, 0],
  "<": [0x02, 0x04, 0x08, 0x10, 0x08, 0x04, 0x02],
  ">": [0x08, 0x04, 0x02, 0x01, 0x02, 0x04, 0x08],
  _: [0, 0, 0, 0, 0, 0, 0x1f],
  $: [0x04, 0x0f, 0x14, 0x0e, 0x05, 0x1e, 0x04],
  "\u00b7": [0, 0, 0, 0x0c, 0x0c, 0, 0], // middle dot
};

// ------------------------------------------------------------ raster canvas
const px = new Uint8Array(W * H * 3);

function setPixel(x: number, y: number, c: RGB): void {
  if (x < 0 || x >= W || y < 0 || y >= H) return;
  const i = (y * W + x) * 3;
  px[i] = c[0];
  px[i + 1] = c[1];
  px[i + 2] = c[2];
}

function fillRect(x: number, y: number, w: number, h: number, c: RGB): void {
  const x0 = Math.max(0, x);
  const y0 = Math.max(0, y);
  const x1 = Math.min(W, x + w);
  const y1 = Math.min(H, y + h);
  for (let yy = y0; yy < y1; yy++) {
    for (let xx = x0; xx < x1; xx++) {
      const i = (yy * W + xx) * 3;
      px[i] = c[0];
      px[i + 1] = c[1];
      px[i + 2] = c[2];
    }
  }
}

function hline(x0: number, x1: number, y: number, c: RGB, t = 1): void {
  for (let k = 0; k < t; k++) fillRect(Math.min(x0, x1), y + k, Math.abs(x1 - x0) + 1, 1, c);
}

function vline(x: number, y0: number, y1: number, c: RGB, t = 1): void {
  for (let k = 0; k < t; k++) fillRect(x + k, Math.min(y0, y1), 1, Math.abs(y1 - y0) + 1, c);
}

// Bresenham line.
function line(x0: number, y0: number, x1: number, y1: number, c: RGB, t = 1): void {
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  let x = x0;
  let y = y0;
  for (;;) {
    for (let a = 0; a < t; a++)
      for (let b = 0; b < t; b++) setPixel(x + a, y + b, c);
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y += sy;
    }
  }
}

function fillCircle(cx: number, cy: number, r: number, c: RGB): void {
  for (let y = -r; y <= r; y++) {
    const half = Math.floor(Math.sqrt(r * r - y * y));
    for (let x = -half; x <= half; x++) setPixel(cx + x, cy + y, c);
  }
}

function circleOutline(cx: number, cy: number, r: number, c: RGB, t = 1): void {
  for (let a = 0; a < 360; a += 1) {
    const rad = (a * Math.PI) / 180;
    for (let k = 0; k < t; k++) {
      setPixel(Math.round(cx + (r + k) * Math.cos(rad)), Math.round(cy + (r + k) * Math.sin(rad)), c);
    }
  }
}

function fillEllipse(cx: number, cy: number, rx: number, ry: number, c: RGB): void {
  for (let y = -ry; y <= ry; y++) {
    const half = Math.floor(rx * Math.sqrt(1 - (y * y) / (ry * ry)));
    for (let x = -half; x <= half; x++) setPixel(cx + x, cy + y, c);
  }
}

// Scanline polygon fill. pts = [x, y] pairs.
function fillPolygon(pts: [number, number][], c: RGB): void {
  let minY = Infinity;
  let maxY = -Infinity;
  for (const [, y] of pts) {
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  for (let y = Math.ceil(minY); y <= Math.floor(maxY); y++) {
    const xs: number[] = [];
    for (let i = 0; i < pts.length; i++) {
      const [x0, y0] = pts[i];
      const [x1, y1] = pts[(i + 1) % pts.length];
      if ((y0 <= y && y1 > y) || (y1 <= y && y0 > y)) {
        xs.push(x0 + ((y - y0) * (x1 - x0)) / (y1 - y0));
      }
    }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      for (let x = Math.ceil(xs[k]); x <= Math.floor(xs[k + 1]); x++) setPixel(x, y, c);
    }
  }
}

function polyOutline(pts: [number, number][], c: RGB, t = 1): void {
  for (let i = 0; i < pts.length; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[(i + 1) % pts.length];
    line(x0, y0, x1, y1, c, t);
  }
}

// ------------------------------------------------------------------- text
function charWidth(scale: number, tight = false): number {
  return tight ? 5 * scale + 1 : 6 * scale;
}

function textWidth(text: string, scale: number, tight = false): number {
  if (text.length === 0) return 0;
  return text.length * charWidth(scale, tight) - (tight ? 1 : scale);
}

function drawChar(x: number, y: number, ch: string, scale: number, c: RGB): void {
  const g = FONT[ch] ?? FONT["?"];
  for (let r = 0; r < 7; r++) {
    const row = g[r];
    for (let col = 0; col < 5; col++) {
      if ((row >> (4 - col)) & 1) {
        fillRect(x + col * scale, y + r * scale, scale, scale, c);
      }
    }
  }
}

function drawText(x: number, y: number, text: string, scale: number, c: RGB, tight = false): number {
  let cx = x;
  for (const ch of text) {
    drawChar(cx, y, ch, scale, c);
    cx += charWidth(scale, tight);
  }
  return cx;
}

function drawTextCentered(cx: number, y: number, text: string, scale: number, c: RGB, tight = false): void {
  drawText(cx - Math.floor(textWidth(text, scale, tight) / 2), y, text, scale, c, tight);
}

function wrapText(text: string, maxWidth: number, scale: number, tight = false): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const trial = cur === "" ? w : cur + " " + w;
    if (textWidth(trial, scale, tight) <= maxWidth) {
      cur = trial;
    } else {
      if (cur !== "") lines.push(cur);
      // A single over-long word gets split by character.
      if (textWidth(w, scale, tight) > maxWidth) {
        let part = "";
        for (const ch of w) {
          if (textWidth(part + ch, scale, tight) > maxWidth) {
            lines.push(part);
            part = ch;
          } else {
            part += ch;
          }
        }
        cur = part;
      } else {
        cur = w;
      }
    }
  }
  if (cur !== "") lines.push(cur);
  return lines;
}

function drawWrapped(x: number, y: number, text: string, maxWidth: number, scale: number, c: RGB, lineGap = 3, tight = false): number {
  const lines = wrapText(text, maxWidth, scale, tight);
  const lh = 7 * scale + lineGap;
  for (let i = 0; i < lines.length; i++) {
    drawText(x, y + i * lh, lines[i], scale, c, tight);
  }
  return lines.length;
}

function drawWrappedCentered(cx: number, y: number, text: string, maxWidth: number, scale: number, c: RGB, lineGap = 3, tight = false): void {
  const lines = wrapText(text, maxWidth, scale, tight);
  const lh = 7 * scale + lineGap;
  for (let i = 0; i < lines.length; i++) {
    drawTextCentered(cx, y + i * lh, lines[i], scale, c, tight);
  }
}

// ------------------------------------------------------------------ PNG
const CRC_TABLE: number[] = (() => {
  const t: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t.push(c >>> 0);
  }
  return t;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function encodePNG(): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type: RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0; // filter 0
    raw.set(px.subarray(y * W * 3, (y + 1) * W * 3), y * (1 + W * 3) + 1);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ------------------------------------------------------------------ icons
// Every icon is drawn in a small box (x, y, s) where s is its size.

function iconJet(x: number, y: number, s: number, c: RGB): void {
  // Fighter jet seen from above, nose pointing right.
  const u = s / 40;
  fillPolygon(
    [
      [x + 38 * u, y + 20 * u],
      [x + 26 * u, y + 14 * u],
      [x + 10 * u, y + 6 * u],
      [x + 14 * u, y + 18 * u],
      [x + 2 * u, y + 16 * u],
      [x + 6 * u, y + 20 * u],
      [x + 2 * u, y + 24 * u],
      [x + 14 * u, y + 22 * u],
      [x + 10 * u, y + 34 * u],
      [x + 26 * u, y + 26 * u],
    ],
    c,
  );
  fillRect(Math.round(x + 28 * u), Math.round(y + 18 * u), Math.round(4 * u), Math.round(4 * u), WHITE);
}

function iconShield(x: number, y: number, s: number, c: RGB): void {
  const u = s / 40;
  fillPolygon(
    [
      [x + 20 * u, y + 2 * u],
      [x + 36 * u, y + 8 * u],
      [x + 36 * u, y + 20 * u],
      [x + 20 * u, y + 38 * u],
      [x + 4 * u, y + 20 * u],
      [x + 4 * u, y + 8 * u],
    ],
    c,
  );
  // Check mark.
  line(Math.round(x + 12 * u), Math.round(y + 20 * u), Math.round(x + 18 * u), Math.round(y + 26 * u), WHITE, 3);
  line(Math.round(x + 18 * u), Math.round(y + 26 * u), Math.round(x + 29 * u), Math.round(y + 13 * u), WHITE, 3);
}

function iconPlane(x: number, y: number, s: number, c: RGB): void {
  // AWACS: airliner silhouette with a radar disc on top.
  const u = s / 40;
  fillEllipse(Math.round(x + 20 * u), Math.round(y + 24 * u), Math.round(16 * u), Math.round(4 * u), c);
  fillPolygon(
    [
      [x + 36 * u, y + 24 * u],
      [x + 26 * u, y + 16 * u],
      [x + 22 * u, y + 22 * u],
    ],
    c,
  );
  fillPolygon(
    [
      [x + 30 * u, y + 26 * u],
      [x + 24 * u, y + 32 * u],
      [x + 18 * u, y + 26 * u],
    ],
    c,
  );
  fillPolygon(
    [
      [x + 6 * u, y + 22 * u],
      [x + 2 * u, y + 16 * u],
      [x + 6 * u, y + 26 * u],
    ],
    c,
  );
  vline(Math.round(x + 20 * u), Math.round(y + 8 * u), Math.round(y + 18 * u), c, 2);
  fillEllipse(Math.round(x + 20 * u), Math.round(y + 8 * u), Math.round(8 * u), Math.round(2 * u), c);
}

function iconMissile(x: number, y: number, s: number, c: RGB): void {
  const u = s / 40;
  fillPolygon(
    [
      [x + 20 * u, y + 2 * u],
      [x + 26 * u, y + 12 * u],
      [x + 26 * u, y + 30 * u],
      [x + 14 * u, y + 30 * u],
      [x + 14 * u, y + 12 * u],
    ],
    c,
  );
  fillPolygon(
    [
      [x + 14 * u, y + 30 * u],
      [x + 8 * u, y + 38 * u],
      [x + 14 * u, y + 34 * u],
    ],
    c,
  );
  fillPolygon(
    [
      [x + 26 * u, y + 30 * u],
      [x + 32 * u, y + 38 * u],
      [x + 26 * u, y + 34 * u],
    ],
    c,
  );
  fillPolygon(
    [
      [x + 18 * u, y + 30 * u],
      [x + 22 * u, y + 30 * u],
      [x + 24 * u, y + 38 * u],
      [x + 16 * u, y + 38 * u],
    ],
    GOLD,
  );
}

function iconBuilding(x: number, y: number, s: number, c: RGB): void {
  // City block with a Red-Cross-style aid mark.
  const u = s / 40;
  fillRect(Math.round(x + 4 * u), Math.round(y + 16 * u), Math.round(12 * u), Math.round(22 * u), c);
  fillRect(Math.round(x + 20 * u), Math.round(y + 8 * u), Math.round(12 * u), Math.round(30 * u), c);
  fillRect(Math.round(x + 28 * u), Math.round(y + 26 * u), Math.round(4 * u), Math.round(12 * u), WHITE);
  fillRect(Math.round(x + 24 * u), Math.round(y + 30 * u), Math.round(12 * u), Math.round(4 * u), WHITE);
  for (let r = 0; r < 3; r++) {
    fillRect(Math.round(x + 7 * u), Math.round(y + (20 + r * 6) * u), Math.round(3 * u), Math.round(3 * u), GOLD);
    fillRect(Math.round(x + 22 * u), Math.round(y + (12 + r * 6) * u), Math.round(3 * u), Math.round(3 * u), GOLD);
  }
}

function iconGlobe(x: number, y: number, s: number, c: RGB): void {
  const u = s / 40;
  fillCircle(Math.round(x + 20 * u), Math.round(y + 20 * u), Math.round(17 * u), c);
  circleOutline(Math.round(x + 20 * u), Math.round(y + 20 * u), Math.round(17 * u), WHITE, 2);
  hline(Math.round(x + 5 * u), Math.round(x + 35 * u), Math.round(y + 20 * u), WHITE, 2);
  fillPolygon(
    [
      [x + 12 * u, y + 10 * u],
      [x + 20 * u, y + 8 * u],
      [x + 26 * u, y + 13 * u],
      [x + 22 * u, y + 18 * u],
      [x + 14 * u, y + 17 * u],
    ],
    GOLD,
  );
  fillPolygon(
    [
      [x + 14 * u, y + 26 * u],
      [x + 22 * u, y + 24 * u],
      [x + 27 * u, y + 30 * u],
      [x + 18 * u, y + 33 * u],
    ],
    GOLD,
  );
}

function iconScales(x: number, y: number, s: number, c: RGB): void {
  // Scales of justice.
  const u = s / 40;
  vline(Math.round(x + 20 * u), Math.round(y + 4 * u), Math.round(y + 36 * u), c, 3);
  hline(Math.round(x + 6 * u), Math.round(x + 34 * u), Math.round(y + 6 * u), c, 3);
  line(Math.round(x + 8 * u), Math.round(y + 7 * u), Math.round(x + 4 * u), Math.round(y + 22 * u), c, 2);
  line(Math.round(x + 8 * u), Math.round(y + 7 * u), Math.round(x + 12 * u), Math.round(y + 22 * u), c, 2);
  fillPolygon(
    [
      [x + 2 * u, y + 22 * u],
      [x + 14 * u, y + 22 * u],
      [x + 8 * u, y + 30 * u],
    ],
    c,
  );
  line(Math.round(x + 32 * u), Math.round(y + 7 * u), Math.round(x + 28 * u), Math.round(y + 22 * u), c, 2);
  line(Math.round(x + 32 * u), Math.round(y + 7 * u), Math.round(x + 36 * u), Math.round(y + 22 * u), c, 2);
  fillPolygon(
    [
      [x + 26 * u, y + 22 * u],
      [x + 38 * u, y + 22 * u],
      [x + 32 * u, y + 30 * u],
    ],
    c,
  );
  hline(Math.round(x + 12 * u), Math.round(x + 28 * u), Math.round(y + 36 * u), c, 3);
}

function iconGavel(x: number, y: number, s: number, c: RGB): void {
  const u = s / 40;
  fillPolygon(
    [
      [x + 8 * u, y + 8 * u],
      [x + 24 * u, y + 8 * u],
      [x + 24 * u, y + 16 * u],
      [x + 8 * u, y + 16 * u],
    ],
    c,
  );
  line(Math.round(x + 16 * u), Math.round(y + 16 * u), Math.round(x + 30 * u), Math.round(y + 34 * u), c, 3);
  hline(Math.round(x + 24 * u), Math.round(x + 36 * u), Math.round(y + 36 * u), c, 3);
}

function iconStar(x: number, y: number, s: number, c: RGB): void {
  // Five-point star (government badge).
  const u = s / 40;
  const cx = x + 20 * u;
  const cy = y + 20 * u;
  const pts: [number, number][] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 18 * u : 8 * u;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  fillPolygon(pts, c);
  fillCircle(Math.round(cx), Math.round(cy), Math.round(4 * u), WHITE);
}

function iconMoon(x: number, y: number, s: number, c: RGB): void {
  const u = s / 40;
  fillCircle(Math.round(x + 20 * u), Math.round(y + 20 * u), Math.round(16 * u), GOLD);
  fillCircle(Math.round(x + 14 * u), Math.round(y + 15 * u), Math.round(3 * u), [160, 110, 10]);
  fillCircle(Math.round(x + 26 * u), Math.round(y + 25 * u), Math.round(4 * u), [160, 110, 10]);
  fillCircle(Math.round(x + 25 * u), Math.round(y + 12 * u), Math.round(2 * u), [160, 110, 10]);
  // Seven Sisters: seven small stars around the moon.
  const starPts: [number, number][] = [
    [4, 6], [34, 4], [36, 34], [6, 36], [20, 2], [2, 20], [38, 20],
  ];
  for (const [sx, sy] of starPts) {
    fillRect(Math.round(x + sx * u), Math.round(y + sy * u), 2, 2, c);
  }
}

// ------------------------------------------------------------------ tiles
interface Tile {
  kicker: string;
  kickerColor: RGB;
  headline: string;
  body: string;
  icon: (x: number, y: number, s: number, c: RGB) => void;
  iconColor: RGB;
  bodyLines?: number;
}

function drawTile(x: number, y: number, w: number, h: number, t: Tile): void {
  // Frame.
  fillRect(x, y, w, 1, INK);
  fillRect(x, y + h - 1, w, 1, INK);
  fillRect(x, y, 1, h, INK);
  fillRect(x + w - 1, y, 1, h, INK);
  // Kicker band.
  fillRect(x + 1, y + 1, w - 2, 22, t.kickerColor);
  drawText(x + 10, y + 7, t.kicker, 1, WHITE);
  // Icon at right of the kicker row area, headline below.
  const iconSize = 44;
  const ix = x + w - iconSize - 10;
  const iy = y + 30;
  t.icon(ix, iy, iconSize, t.iconColor);
  // Headline, two lines, wrapped to leave room for the icon on line 1.
  const headW = w - 20 - iconSize - 8;
  const headLines = wrapText(t.headline, headW, 2, true);
  const hy = y + 30;
  for (let i = 0; i < headLines.length && i < 2; i++) {
    drawText(x + 10, hy + i * 17, headLines[i], 2, INK, true);
  }
  // Body below the headline block.
  const bodyY = hy + 2 * 17 + 6;
  const maxBody = t.bodyLines ?? 6;
  const bodyLines = wrapText(t.body, w - 20, 2, true).slice(0, maxBody);
  for (let i = 0; i < bodyLines.length; i++) {
    drawText(x + 10, bodyY + i * 17, bodyLines[i], 2, INK, true);
  }
}

function drawShortTile(x: number, y: number, w: number, h: number, t: Tile): void {
  fillRect(x, y, w, 1, INK);
  fillRect(x, y + h - 1, w, 1, INK);
  fillRect(x, y, 1, h, INK);
  fillRect(x + w - 1, y, 1, h, INK);
  fillRect(x + 1, y + 1, w - 2, 22, t.kickerColor);
  drawText(x + 10, y + 7, t.kicker, 1, WHITE);
  const headLines = wrapText(t.headline, w - 20, 2, true);
  const hy = y + 30;
  for (let i = 0; i < headLines.length && i < 2; i++) {
    drawText(x + 10, hy + i * 17, headLines[i], 2, INK, true);
  }
  const bodyY = hy + 2 * 17 + 6;
  const maxBody = t.bodyLines ?? 4;
  const bodyLines = wrapText(t.body, w - 20, 2, true).slice(0, maxBody);
  for (let i = 0; i < bodyLines.length; i++) {
    drawText(x + 10, bodyY + i * 17, bodyLines[i], 2, INK, true);
  }
}

// ------------------------------------------------------------------ layout
const M = 28; // outer margin
const R = W - M; // right edge of the page block

function drawMasthead(): void {
  fillRect(M, 12, R - M, 3, GREEN);
  fillRect(M, 17, R - M, 2, GOLD);
  drawTextCentered(512, 30, "THE TUESDAY GLOBE", 6, INK);
  drawTextCentered(512, 80, "TUESDAY · 24 NOVEMBER 2026", 3, RED);
  drawTextCentered(512, 106, "One day. Every continent. What happened, as reported.", 2, GREY);
  fillRect(M, 124, R - M, 2, INK);
}

function drawChip(x: number, y: number, w: number, h: number): void {
  // A computer chip: navy body, green die, gold pins, NVDA label.
  fillRect(x, y, w, h, NAVY);
  fillRect(x + 10, y + 10, w - 20, h - 20, GREEN);
  // Pins.
  for (let i = 0; i < 4; i++) {
    const px0 = x + 12 + i * 16;
    fillRect(px0, y - 6, 8, 6, GOLD);
    fillRect(px0, y + h, 8, 6, GOLD);
  }
  for (let i = 0; i < 2; i++) {
    const py0 = y + 14 + i * 18;
    fillRect(x - 6, py0, 6, 8, GOLD);
    fillRect(x + w, py0, 6, 8, GOLD);
  }
  drawTextCentered(x + w / 2, y + Math.floor((h - 7) / 2), "NVDA", 1, WHITE);
}

function drawBanner(): void {
  const y0 = 132;
  const y1 = 364;
  // Left half: headline, deck, body.
  drawText(M, y0 + 16, "THE", 5, RED);
  drawText(M, y0 + 56, "COMEBACK", 5, INK);
  fillRect(M, y0 + 100, 120, 3, GOLD);
  drawWrapped(M, y0 + 110, "Huang returns as Nvidia chief, reinstated Monday after Trump pressed the board.", 452, 2, INK, 3, true);
  drawWrapped(
    M,
    y0 + 150,
    "Hours later, the US blacklists Megaspeed, the firm at the heart of the spy affair. Nvidia posts the largest one-day gain; the S&P 500 jumps 4.7%.",
    452,
    2,
    INK,
    3,
    true,
  );
  // Divider.
  vline(508, y0 + 8, y1 - 8, GREY, 1);
  // Right half: drawn scene — a chip riding a steeply rising chart.
  const sx = 520;
  const sy = y0 + 4;
  const sw = 476;
  const sh = 186;
  fillRect(sx, sy, sw, 1, INK);
  fillRect(sx, sy + sh - 1, sw, 1, INK);
  fillRect(sx, sy, 1, sh, INK);
  fillRect(sx + sw - 1, sy, 1, sh, INK);
  // Gridlines and axes.
  for (const gy of [sy + 46, sy + 92, sy + 138]) hline(sx + 20, sx + sw - 12, gy, LIGHTGREEN, 1);
  hline(sx + 20, sx + sw - 12, sy + sh - 26, INK, 2);
  vline(sx + 20, sy + 14, sy + sh - 26, INK, 2);
  drawText(sx + 28, sy + 16, "S&P +4.7%", 2, GREEN);
  // Rising chart line.
  const pts: [number, number][] = [
    [sx + 28, sy + sh - 34],
    [sx + 80, sy + sh - 42],
    [sx + 130, sy + sh - 38],
    [sx + 180, sy + sh - 62],
    [sx + 230, sy + sh - 96],
    [sx + 280, sy + sh - 88],
    [sx + 330, sy + sh - 128],
    [sx + 380, sy + sh - 158],
    [sx + 430, sy + sh - 176],
  ];
  for (let i = 0; i + 1 < pts.length; i++) {
    line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], GREEN, 3);
  }
  // Arrow head at the top of the climb.
  fillPolygon(
    [
      [sx + 436, sy + sh - 182],
      [sx + 418, sy + sh - 174],
      [sx + 426, sy + sh - 162],
    ],
    GREEN,
  );
  // The chip rides the top of the chart.
  drawChip(sx + 352, sy + 30, 84, 56);
  // Caption under the scene.
  drawWrappedCentered(sx + sw / 2, sy + sh + 8, "Huang back at Nvidia as Trump deal lifts markets", sw, 2, INK, 3, true);
}

function drawGrid(): void {
  const tiles: Tile[] = [
    {
      kicker: "ASIA",
      kickerColor: RED,
      headline: "JETS SCRAMBLE; ALERTS BLAME WRONG KOREA",
      body: "Russian planes near Ulleung Island. Seoul scrambles jets; islanders shelter. Alert lifts in five minutes; no airspace violated.",
      icon: iconJet,
      iconColor: NAVY,
    },
    {
      kicker: "TECH",
      kickerColor: NAVY,
      headline: "CROWDSTRIKE BUYS ZSCALER FOR $43.9BN",
      body: "The biggest cybersecurity takeover ever, all in stock. Zscaler holders get 1.135 CrowdStrike shares each, a 34% premium.",
      icon: iconShield,
      iconColor: GREEN,
    },
    {
      kicker: "EUROPE",
      kickerColor: GREEN,
      headline: "NATO SENDS AWACS; KYIV SAYS IT SANK CORVETTE",
      body: "AWACS to Poland after three Russian missiles landed there. Kyiv says sea drones sank a corvette; bombs hit central Kyiv.",
      icon: iconPlane,
      iconColor: NAVY,
    },
    {
      kicker: "MIDDLE EAST",
      kickerColor: RED,
      headline: "TEHRAN WARNS EU BASES IN MISSILE RANGE",
      body: "Iran says its missiles can fly 4,500 km and vows to confront a US naval blockade. Washington sanctions dozens tied to shadow banking.",
      icon: iconMissile,
      iconColor: RED,
    },
    {
      kicker: "GAZA",
      kickerColor: GOLD,
      headline: "STRIKES KILL THREE IN GAZA",
      body: "Israeli strikes kill at least three, including an UNRWA worker. Critically injured Gaza children are flown to Britain for treatment.",
      icon: iconBuilding,
      iconColor: NAVY,
    },
    {
      kicker: "CLIMATE",
      kickerColor: GREEN,
      headline: "COP31 COLLAPSE DRAWS ANGER IN AUSTRALIA",
      body: "The failure of the Antalya climate talks brings anger in Australia and despair from Pacific nations.",
      icon: iconGlobe,
      iconColor: GREEN,
    },
  ];
  const xs = [M, 354, 680];
  const ys = [372, 552];
  for (let i = 0; i < tiles.length; i++) {
    drawTile(xs[i % 3], ys[Math.floor(i / 3)], 314, 172, tiles[i]);
  }
}

function drawSecondRow(): void {
  const tiles: Tile[] = [
    {
      kicker: "LAW",
      kickerColor: NAVY,
      headline: "TRUMP GETS HUSH-MONEY LIFELINE",
      body: "Court gives Trump a new path to erase his hush-money conviction.",
      icon: iconScales,
      iconColor: NAVY,
    },
    {
      kicker: "CHINA",
      kickerColor: RED,
      headline: "CHINA OFFICIAL GETS DEATH SENTENCE",
      body: "A state official is sentenced to death for revealing state secrets abroad.",
      icon: iconGavel,
      iconColor: RED,
    },
    {
      kicker: "RUSSIA",
      kickerColor: NAVY,
      headline: "MURMANSK GOVERNOR DETAINED",
      body: "Murmansk's governor is detained on suspicion of embezzlement.",
      icon: iconStar,
      iconColor: GOLD,
    },
    {
      kicker: "MEXICO",
      kickerColor: GREEN,
      headline: "CHAPO ISIDRO TO STAND TRIAL",
      body: "The captured cartel leader faces trial in Mexico after his arrest in Sinaloa.",
      icon: iconScales,
      iconColor: GREEN,
    },
  ];
  const xs = [M, 273, 518, 763];
  for (let i = 0; i < tiles.length; i++) {
    drawShortTile(xs[i], 732, 233, 150, tiles[i]);
  }
}

function drawBottomBand(): void {
  const y0 = 890;
  const h = 96;
  // IN BRIEF, left.
  fillRect(M, y0, 600, 1, INK);
  fillRect(M, y0 + h - 1, 600, 1, INK);
  fillRect(M, y0, 1, h, INK);
  fillRect(M + 599, y0, 1, h, INK);
  drawText(M + 10, y0 + 8, "IN BRIEF", 2, RED);
  const briefs = [
    "Supermoon meets the Pleiades tonight.",
    "UN chief demands a global AI safety framework.",
    "Bangladesh garment workers reject a pay proposal.",
    "Indian share markets shut for Guru Nanak Jayanti.",
  ];
  for (let i = 0; i < briefs.length; i++) {
    const by = y0 + 30 + i * 16;
    fillCircle(M + 14, by + 6, 2, GOLD);
    drawText(M + 22, by, briefs[i], 2, INK, true);
  }
  // Markets box, right.
  const mx = 640;
  fillRect(mx, y0, 356, h, GREEN);
  drawText(mx + 12, y0 + 8, "MARKETS", 2, WHITE);
  drawText(mx + 12, y0 + 30, "S&P 500  +4.7%", 2, WHITE, true);
  drawText(mx + 12, y0 + 48, "Nvidia: record one-day gain", 2, WHITE, true);
  drawText(mx + 12, y0 + 66, "CrowdStrike falls 9% on deal", 2, WHITE, true);
}

function drawFooter(): void {
  drawTextCentered(512, 992, "The day's news, as reported Tuesday 24 November 2026", 2, INK);
  drawTextCentered(512, 1009, "Sources: Reuters · AP · CNN · WSJ · BBC · Yonhap", 2, GREY);
}

// -------------------------------------------------------------------- main
function main(): void {
  fillRect(0, 0, W, H, PAPER);
  drawMasthead();
  drawBanner();
  drawGrid();
  drawSecondRow();
  drawBottomBand();
  drawFooter();

  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
  fs.mkdirSync(outDir, { recursive: true });
  // Clear only the CONTENTS of the output dir, never the dir itself.
  for (const entry of fs.readdirSync(outDir)) {
    fs.rmSync(`${outDir}/${entry}`, { recursive: true, force: true });
  }
  const png = encodePNG();
  fs.writeFileSync(`${outDir}/entry.png`, png);
  console.log(`wrote ${outDir}/entry.png (${png.length} bytes)`);
}

main();
