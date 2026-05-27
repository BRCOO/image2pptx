#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname);
const outDir = path.join(root, "outputs");
fs.mkdirSync(outDir, { recursive: true });

function esc(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function attrs(input) {
  return Object.entries(input)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${key}="${esc(value)}"`)
    .join(" ");
}

function text(x, y, content, options = {}) {
  const {
    size = 28,
    weight = 400,
    fill = "#111",
    anchor = "middle",
    family = "Arial",
    rotate,
    style,
  } = options;
  const transform = rotate ? `rotate(${rotate} ${x} ${y})` : undefined;
  return `<text ${attrs({
    x,
    y,
    "font-family": family,
    "font-size": size,
    "font-weight": weight,
    fill,
    "text-anchor": anchor,
    transform,
    style,
  })}>${esc(content)}</text>`;
}

function rect(x, y, width, height, options = {}) {
  return `<rect ${attrs({
    x,
    y,
    width,
    height,
    rx: options.rx ?? 0,
    ry: options.ry ?? options.rx ?? 0,
    fill: options.fill ?? "none",
    stroke: options.stroke ?? "#111",
    "stroke-width": options.strokeWidth ?? 2,
    "stroke-dasharray": options.dash,
    opacity: options.opacity,
  })}/>`;
}

function line(x1, y1, x2, y2, options = {}) {
  return `<line ${attrs({
    x1,
    y1,
    x2,
    y2,
    stroke: options.stroke ?? "#111",
    "stroke-width": options.strokeWidth ?? 3,
    "stroke-dasharray": options.dash,
    "stroke-linecap": options.cap ?? "round",
  })}/>${options.arrow ? arrowHead(x1, y1, x2, y2, options.stroke ?? "#111", options.arrowSize ?? 14) : ""}`;
}

function arrowHead(x1, y1, x2, y2, fill, size) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const a = angle + Math.PI;
  const p1 = [x2, y2];
  const p2 = [x2 + Math.cos(a - 0.42) * size, y2 + Math.sin(a - 0.42) * size];
  const p3 = [x2 + Math.cos(a + 0.42) * size, y2 + Math.sin(a + 0.42) * size];
  return `<polygon points="${p1.join(",")} ${p2.join(",")} ${p3.join(",")}" fill="${fill}"/>`;
}

function circle(cx, cy, r, options = {}) {
  return `<circle ${attrs({
    cx,
    cy,
    r,
    fill: options.fill ?? "#fff",
    stroke: options.stroke ?? "#111",
    "stroke-width": options.strokeWidth ?? 2,
  })}/>`;
}

function pathEl(d, options = {}) {
  return `<path ${attrs({
    d,
    fill: options.fill ?? "none",
    stroke: options.stroke ?? "#111",
    "stroke-width": options.strokeWidth ?? 2,
    "stroke-dasharray": options.dash,
    "stroke-linecap": options.cap ?? "round",
    "stroke-linejoin": options.join ?? "round",
    opacity: options.opacity,
  })}/>`;
}

function svg(width, height, body, defs = "") {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
<defs>
${defs}
</defs>
<rect width="${width}" height="${height}" fill="#ffffff"/>
${body}
</svg>
`;
}

function graphMini(x, y, scale = 1, color = "#111") {
  const pts = [
    [x, y],
    [x + 55 * scale, y + 36 * scale],
    [x + 108 * scale, y + 10 * scale],
    [x + 86 * scale, y + 70 * scale],
    [x + 150 * scale, y + 65 * scale],
  ];
  return `
${line(pts[0][0], pts[0][1], pts[1][0], pts[1][1], { stroke: color, strokeWidth: 3 * scale })}
${line(pts[1][0], pts[1][1], pts[2][0], pts[2][1], { stroke: color, strokeWidth: 3 * scale })}
${line(pts[1][0], pts[1][1], pts[3][0], pts[3][1], { stroke: color, strokeWidth: 3 * scale })}
${line(pts[3][0], pts[3][1], pts[4][0], pts[4][1], { stroke: color, strokeWidth: 3 * scale })}
${pts.map((p, i) => `${circle(p[0], p[1], 14 * scale, { strokeWidth: 2 * scale })}${text(p[0], p[1] + 6 * scale, `v${i + 1}`, { size: 15 * scale })}`).join("\n")}
`;
}

function matrix(x, y, cell, rows, cols, palette) {
  const parts = [];
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const color = palette[(r * cols + c) % palette.length];
      parts.push(rect(x + c * cell, y + r * cell, cell, cell, {
        fill: color,
        stroke: "#1d2430",
        strokeWidth: 1,
      }));
    }
  }
  return parts.join("\n");
}

function demoDynamicGraph() {
  const width = 1479;
  const height = 732;
  const defs = `
<linearGradient id="blueBar" x1="0" x2="0" y1="0" y2="1">
  <stop offset="0" stop-color="#43a3d9"/>
  <stop offset="1" stop-color="#ffffff"/>
</linearGradient>
<linearGradient id="orangeBar" x1="0" x2="0" y1="0" y2="1">
  <stop offset="0" stop-color="#fff200"/>
  <stop offset="1" stop-color="#d86c1d"/>
</linearGradient>
<linearGradient id="mixBar" x1="0" x2="0" y1="0" y2="1">
  <stop offset="0" stop-color="#20a6d9"/>
  <stop offset="0.5" stop-color="#fff200"/>
  <stop offset="1" stop-color="#c96a22"/>
</linearGradient>
`;
  const panel = (x, y, w, h, label) => `
<g id="${esc(label.toLowerCase().replace(/[^a-z0-9]+/g, "-"))}">
${rect(x, y, w, h, { stroke: "#1f3b68", strokeWidth: 4, dash: "22 8 4 8" })}
${text(x + w - 20, y + h - 16, label, { size: 30, anchor: "end", family: "Times New Roman" })}
</g>`;
  const body = `
${panel(52, 28, 456, 330, "(b) State Module")}
${panel(568, 28, 858, 330, "(c) DT-MP Module")}
${panel(52, 401, 305, 323, "(a) Dynamic Graph")}
${panel(401, 401, 438, 323, "(d) Application")}
${panel(885, 401, 541, 323, "(e) Parameter Space")}

<g id="state-module">
${rect(64, 58, 116, 212, { rx: 16, stroke: "#6aa84f", fill: "#f9fff5", strokeWidth: 1.5 })}
${["#d9e8ff", "#ffe0c2", "#d9c8e8", "#e5f3df"].map((c, i) => rect(75, 74 + i * 40, 96, 29, { fill: c, stroke: "#9aa", strokeWidth: 0.8 })).join("\n")}
${["m1(t1)", "m3(t2)", "m6(t2)", "m4(t3)", "..."].map((v, i) => text(122, 103 + i * 40, v, { size: 26, family: "Times New Roman" })).join("\n")}
${rect(205, 105, 77, 115, { rx: 8, fill: "#f1f1f1", stroke: "#111", strokeWidth: 1.5 })}
${text(244, 142, "FFN", { size: 26, family: "Times New Roman" })}
${text(244, 202, "LN", { size: 26, family: "Times New Roman" })}
${line(180, 163, 205, 163, { arrow: true, strokeWidth: 3 })}
${line(282, 163, 319, 163, { arrow: true, strokeWidth: 3 })}
${circle(327, 163, 15, { fill: "#fff", strokeWidth: 3 })}
${line(327, 145, 327, 181, { strokeWidth: 3 })}
${line(309, 163, 345, 163, { strokeWidth: 3 })}
${line(327, 278, 327, 179, { arrow: true, strokeWidth: 3 })}
${line(327, 278, 395, 278, { strokeWidth: 3 })}
${line(395, 278, 395, 260, { strokeWidth: 3 })}
${rect(379, 58, 116, 202, { rx: 16, stroke: "#6aa84f", fill: "#f9fff5", strokeWidth: 1.5 })}
${["#d9e8ff", "#ffe0c2", "#d9c8e8", "#e5f3df"].map((c, i) => rect(390, 74 + i * 40, 96, 29, { fill: c, stroke: "#9aa", strokeWidth: 0.8 })).join("\n")}
${["s1(t1)", "s3(t2)", "s6(t2)", "s4(t3)", "..."].map((v, i) => text(437, 103 + i * 40, v, { size: 26, family: "Times New Roman" })).join("\n")}
</g>

<g id="dt-mp-module">
${pathEl("M602 47 C710 40 762 54 835 46 S974 45 1033 46 L1040 188 C904 185 780 190 604 187 Z", { stroke: "#4b9bd3", strokeWidth: 5 })}
${pathEl("M602 194 C720 188 796 202 890 194 S965 194 1034 195 L1034 330 C904 325 770 333 602 330 Z", { stroke: "#dd8f55", strokeWidth: 5 })}
${graphMini(638, 95, 0.82)}
${line(764, 105, 812, 105, { stroke: "#5976a6", strokeWidth: 3, arrow: true, arrowSize: 18 })}
${rect(800, 73, 178, 64, { rx: 10, fill: "#f4f4f4", stroke: "#55a2d9", strokeWidth: 3 })}
${text(889, 115, "Self-attention", { size: 27, family: "Times New Roman" })}
${line(978, 105, 1016, 105, { stroke: "#0071bd", strokeWidth: 4, arrow: true })}
${rect(1025, 73, 29, 63, { fill: "url(#blueBar)", stroke: "#0f5988", strokeWidth: 1 })}
${text(1080, 90, "Γ(t)", { size: 28, anchor: "middle", family: "Times New Roman" })}
${text(927, 173, "*Timestamps", { size: 27, anchor: "start", family: "Times New Roman" })}
${graphMini(636, 243, 0.82)}
${line(760, 254, 808, 254, { stroke: "#e29454", strokeWidth: 3, arrow: true, arrowSize: 18 })}
${rect(800, 227, 178, 56, { rx: 10, fill: "#f6f0ed", stroke: "#e5a87b", strokeWidth: 3 })}
${text(889, 267, "Self-attention", { size: 27, family: "Times New Roman" })}
${line(978, 255, 1018, 255, { stroke: "#c55d1f", strokeWidth: 4, arrow: true })}
${rect(1025, 227, 29, 65, { fill: "url(#orangeBar)", stroke: "#b85f18", strokeWidth: 1 })}
${text(1082, 244, "r(t)", { size: 28, family: "Times New Roman" })}
${text(940, 320, "*Edge features", { size: 27, anchor: "start", family: "Times New Roman" })}
${line(1060, 116, 1156, 116, { stroke: "#4b9bd3", strokeWidth: 4 })}
${line(1156, 116, 1156, 143, { stroke: "#4b9bd3", strokeWidth: 4, arrow: true })}
${rect(1166, 148, 138, 82, { rx: 14, fill: "#f5f5f5", stroke: "#111", strokeWidth: 2 })}
${text(1235, 180, "Concat", { size: 27, family: "Times New Roman" })}
${text(1235, 215, "ψ(·) (opt.)", { size: 24, family: "Times New Roman" })}
${line(1058, 274, 1220, 274, { stroke: "#dd8f55", strokeWidth: 4 })}
${line(1220, 274, 1220, 232, { stroke: "#dd8f55", strokeWidth: 4, arrow: true })}
${line(1304, 190, 1362, 190, { strokeWidth: 4, arrow: true })}
${rect(1369, 109, 27, 169, { fill: "url(#mixBar)", stroke: "#111", strokeWidth: 1 })}
</g>

<g id="dynamic-graph">
${circle(136, 453, 20)}${text(136, 461, "v1", { size: 24, family: "Times New Roman" })}
${circle(284, 423, 20)}${text(284, 431, "v2", { size: 24, family: "Times New Roman" })}
${circle(255, 516, 20)}${text(255, 524, "v3", { size: 24, family: "Times New Roman" })}
${circle(113, 522, 20)}${text(113, 530, "v4", { size: 24, family: "Times New Roman" })}
${circle(182, 594, 20)}${text(182, 602, "v5", { size: 24, family: "Times New Roman" })}
${circle(81, 656, 20)}${text(81, 664, "v6", { size: 24, family: "Times New Roman" })}
${line(130, 474, 118, 502, { stroke: "#d7191c", strokeWidth: 3 })}
${line(155, 467, 239, 503, { stroke: "#f0b000", strokeWidth: 3 })}
${line(132, 536, 235, 522, { stroke: "#3f74c4", strokeWidth: 3 })}
${line(121, 540, 174, 578, { stroke: "#333", strokeWidth: 3 })}
${line(103, 540, 86, 635, { stroke: "#2fbf6a", strokeWidth: 3 })}
${line(268, 499, 276, 444, { stroke: "#8b50b9", strokeWidth: 3 })}
${text(176, 512, "t2", { size: 31, family: "Times New Roman" })}
${text(107, 483, "t1", { size: 23, family: "Times New Roman", rotate: -60 })}
${text(206, 480, "t1", { size: 23, family: "Times New Roman", rotate: -40 })}
${text(151, 565, "t3", { size: 23, family: "Times New Roman", rotate: 52 })}
${text(101, 602, "t4, t2", { size: 21, family: "Times New Roman", rotate: 62 })}
${text(267, 475, "t5, t6", { size: 21, family: "Times New Roman", rotate: -58 })}
</g>

<g id="application">
${text(459, 454, "?", { size: 30, family: "Times New Roman" })}
${circle(531, 454, 25, { fill: "#fff" })}
${pathEl("M510 448 C526 424 546 431 554 452 C541 441 525 465 510 448 Z", { fill: "#111", stroke: "#111" })}
${circle(431, 556, 19, { fill: "#fff1df" })}${text(431, 593, "vu", { size: 28, family: "Times New Roman" })}
${line(459, 548, 511, 478, { stroke: "#111", strokeWidth: 4, dash: "10 8" })}
${line(459, 563, 532, 542, { stroke: "#111", strokeWidth: 4, dash: "10 8" })}
${line(461, 573, 526, 646, { stroke: "#111", strokeWidth: 4, dash: "10 8" })}
${matrix(455, 478, 16, 1, 5, ["#d9f0c3", "#95c56f", "#f6f6f6", "#c8e6b9", "#8fbf6b"])}${text(586, 481, "v1", { size: 21, family: "Times New Roman" })}
${matrix(500, 588, 16, 1, 5, ["#d9f0c3", "#95c56f", "#f6f6f6", "#c8e6b9", "#8fbf6b"])}${text(633, 594, "v2", { size: 21, family: "Times New Roman" })}
${matrix(500, 676, 16, 1, 5, ["#d9f0c3", "#95c56f", "#f6f6f6", "#c8e6b9", "#8fbf6b"])}${text(633, 683, "v3", { size: 21, family: "Times New Roman" })}
${rect(605, 422, 223, 130, { fill: "#fff8e6", stroke: "#111", strokeWidth: 1 })}
${line(605, 454, 828, 454, { strokeWidth: 1 })}
${line(756, 422, 756, 552, { strokeWidth: 1 })}
${text(681, 448, "Edges", { size: 25, family: "Times New Roman" })}
${text(793, 448, "Rate", { size: 25, family: "Times New Roman" })}
${["P((vu, v1)|t)", "P((vu, v2)|t)", "P((vu, v3)|t)"].map((v, i) => text(681, 482 + i * 31, v, { size: 23, family: "Times New Roman" })).join("\n")}
${["0.1", "0.8", "0.6"].map((v, i) => text(792, 482 + i * 31, v, { size: 23, family: "Times New Roman" })).join("\n")}
${line(724, 552, 724, 589, { stroke: "#e9c421", strokeWidth: 3, arrow: true, arrowSize: 18 })}
${circle(614, 621, 19, { fill: "#fff1df" })}
${text(703, 625, "buy, t", { size: 24, family: "Times New Roman" })}
${line(668, 632, 755, 632, { stroke: "#8b50b9", strokeWidth: 3, arrow: true })}
</g>

<g id="parameter-space">
${line(955, 421, 955, 690, { strokeWidth: 3, arrow: true })}
${line(955, 421, 1330, 421, { strokeWidth: 3, arrow: true })}
${text(999, 414, "de", { size: 27, family: "Times New Roman" })}
${text(1130, 414, "dt", { size: 27, family: "Times New Roman" })}
${text(933, 505, "deo", { size: 23, family: "Times New Roman", rotate: -90 })}
${text(934, 618, "dto", { size: 23, family: "Times New Roman", rotate: -90 })}
${rect(968, 452, 284, 212, { fill: "none", stroke: "#d30000", strokeWidth: 4 })}
${matrix(978, 462, 34, 2, 4, ["#fff9e4", "#bfa4c7", "#fff5d5", "#ffd98a", "#f8f4bd", "#d98783", "#cf9fbc", "#b795c5"])}
${matrix(1114, 535, 34, 4, 4, ["#d7e7f5", "#c4ddb6", "#9be0aa", "#b7dedb", "#d8e8f7", "#a6dfca", "#91dfa0", "#aedbd7", "#b8caea", "#ade2d6", "#65d98f", "#8ccce2", "#fff", "#fff", "#fff", "#fff"])}
${text(1262, 468, "Input", { size: 25, anchor: "start", family: "Times New Roman" })}
${text(963, 692, "Output", { size: 25, anchor: "start", family: "Times New Roman" })}
${text(1262, 566, "...", { size: 30, anchor: "start", family: "Times New Roman" })}
</g>

${pathEl("M508 164 L554 164 L554 147 L584 194 L554 241 L554 222 L508 222 Z", { fill: "#fff", stroke: "#333", strokeWidth: 3 })}
${pathEl("M183 383 L230 383 L230 399 L256 352 L230 336 L230 359 L183 359 Z", { fill: "#fff", stroke: "#555", strokeWidth: 3 })}
${pathEl("M573 358 L621 358 L621 385 L646 344 L621 319 L621 342 L573 342 Z", { fill: "#fff", stroke: "#555", strokeWidth: 3 })}
${pathEl("M1242 358 L1289 358 L1289 399 L1337 354 L1289 319 L1289 342 L1242 342 Z", { fill: "#cfcfcf", stroke: "#000", strokeWidth: 4 })}
`;
  fs.writeFileSync(path.join(outDir, "dynamic-graph.svg"), svg(width, height, body, defs));
}

function convBlock(x, y, label, scale = 1) {
  const w = 30 * scale;
  const h = 80 * scale;
  return `
${pathEl(`M${x} ${y + 18 * scale} L${x + w} ${y} L${x + w} ${y + h} L${x} ${y + h + 18 * scale} Z`, { fill: "#9bb8d5", stroke: "#12304e", strokeWidth: 2 * scale })}
${text(x + 45 * scale, y + 58 * scale, label, { size: 18 * scale, weight: 700, rotate: -90 })}
`;
}

function verticalOp(x, y, label) {
  return `
${rect(x, y, 42, 112, { rx: 8, fill: "#dcdcdc", stroke: "#222", strokeWidth: 2 })}
${text(x + 24, y + 67, label, { size: 23, weight: 700, rotate: -90 })}
`;
}

function mriStack(x, y, label) {
  return `
${rect(x + 20, y + 20, 130, 130, { fill: "#111", stroke: "#111" })}
${rect(x + 6, y + 8, 130, 130, { fill: "#181818", stroke: "#111" })}
${rect(x - 8, y - 4, 130, 130, { fill: "#222", stroke: "#111" })}
${circle(x + 57, y + 61, 48, { fill: "#9a9a9a", stroke: "#333", strokeWidth: 3 })}
${pathEl(`M${x + 34} ${y + 58} C${x + 48} ${y + 28} ${x + 78} ${y + 29} ${x + 92} ${y + 61} C${x + 80} ${y + 92} ${x + 50} ${y + 95} ${x + 34} ${y + 58} Z`, { fill: "#bfbfbf", stroke: "#777", strokeWidth: 2 })}
${pathEl(`M${x + 51} ${y + 59} C${x + 60} ${y + 70} ${x + 65} ${y + 70} ${x + 74} ${y + 59}`, { stroke: "#555", strokeWidth: 5 })}
${text(x + 58, y + 185, label, { size: 28, weight: 700 })}
`;
}

function demoFusionNetwork() {
  const width = 2816;
  const height = 1536;
  const defs = `
<linearGradient id="bluePanel" x1="0" x2="0" y1="0" y2="1">
  <stop offset="0" stop-color="#dbeeff"/>
  <stop offset="1" stop-color="#f6fbff"/>
</linearGradient>
<linearGradient id="greenPanel" x1="0" x2="0" y1="0" y2="1">
  <stop offset="0" stop-color="#e5f3d6"/>
  <stop offset="1" stop-color="#f7fff0"/>
</linearGradient>
<linearGradient id="headerBlue" x1="0" x2="0" y1="0" y2="1">
  <stop offset="0" stop-color="#9ebfe0"/>
  <stop offset="1" stop-color="#c6def5"/>
</linearGradient>
<linearGradient id="headerGreen" x1="0" x2="0" y1="0" y2="1">
  <stop offset="0" stop-color="#bdd6a8"/>
  <stop offset="1" stop-color="#d7e9c9"/>
</linearGradient>
`;
  const encoderBranch = (y, name, scaleLabel) => `
${rect(300, y, 520, 205, { rx: 24, fill: "none", stroke: "#254c74", strokeWidth: 2, dash: "12 9" })}
${convBlock(330, y + 35, "Conv")}
${line(400, y + 95, 438, y + 95, { arrow: true, strokeWidth: 3 })}
${verticalOp(438, y + 45, "ReLU")}
${line(480, y + 95, 520, y + 95, { arrow: true, strokeWidth: 3 })}
${verticalOp(520, y + 45, "ReLU")}
${line(562, y + 95, 604, y + 95, { arrow: true, strokeWidth: 3 })}
${verticalOp(604, y + 45, "BatchNorm")}
${line(646, y + 95, 705, y + 95, { arrow: true, strokeWidth: 3 })}
${convBlock(705, y + 40, "")}
${line(760, y + 95, 830, y + 95, { arrow: true, strokeWidth: 3 })}
${convBlock(865, y + 55, "")}
${text(610, y + 188, name, { size: 31, weight: 700 })}
${text(920, y + 138, scaleLabel, { size: 28, weight: 700 })}
`;
  const body = `
${text(1408, 94, "Proposed Context-Aware Modality-Fusion Network for Segmentation", { size: 64, weight: 700 })}
${text(1408, 195, "Detailed Architecture with Cascaded Dual Attention Module (CDAM).", { size: 52 })}
${text(112, 288, "Input", { size: 40, weight: 700 })}
${mriStack(35, 370, "MRI T1")}
${mriStack(35, 720, "Branch T2")}
${mriStack(35, 1068, "FLAIR")}

<g id="encoder">
${rect(286, 255, 690, 1120, { rx: 24, fill: "url(#bluePanel)", stroke: "#375f89", strokeWidth: 3 })}
${rect(286, 255, 690, 70, { rx: 18, fill: "url(#headerBlue)", stroke: "#375f89", strokeWidth: 2 })}
${text(631, 307, "Encoder", { size: 45, weight: 700 })}
${encoderBranch(345, "Branch T1", "Scale 1")}
${encoderBranch(675, "Branch T2", "Scale 2")}
${encoderBranch(1005, "Branch FLAIR", "Scale 4")}
${convBlock(865, 835, "")}${text(920, 918, "Scale 3", { size: 28, weight: 700 })}
${line(190, 482, 286, 482, { arrow: true, strokeWidth: 4 })}
${line(190, 812, 286, 812, { arrow: true, strokeWidth: 4 })}
${line(190, 1142, 286, 1142, { arrow: true, strokeWidth: 4 })}
</g>

<g id="fusion">
${rect(1005, 255, 940, 1120, { rx: 24, fill: "url(#greenPanel)", stroke: "#60854a", strokeWidth: 3 })}
${rect(1005, 255, 940, 70, { rx: 18, fill: "url(#headerGreen)", stroke: "#60854a", strokeWidth: 2 })}
${text(1475, 307, "Context-Aware Fusion", { size: 42, weight: 700 })}
${rect(1200, 520, 662, 662, { fill: "none", stroke: "#5c8747", strokeWidth: 2, dash: "14 9" })}
${rect(1380, 515, 480, 265, { rx: 24, fill: "none", stroke: "#5c8747", strokeWidth: 2, dash: "14 9" })}
${rect(1380, 858, 480, 265, { rx: 24, fill: "none", stroke: "#5c8747", strokeWidth: 2, dash: "14 9" })}
${convBlock(1082, 605, "")}${text(1128, 780, "Feature A", { size: 31, weight: 700 })}
${convBlock(1082, 895, "")}${text(1128, 1070, "Feature B", { size: 31, weight: 700 })}
${["AvgPool", "MaxPool", "Shared", "MLP", "Sigmoid"].map((v, i) => verticalOp(1400 + i * 74, 590, v)).join("\n")}
${text(1620, 570, "Channel Attention", { size: 32, weight: 700 })}
${["Conv", "ReLU", "Conv", "Sigmoid"].map((v, i) => verticalOp(1400 + i * 88, 905, v)).join("\n")}
${text(1600, 1110, "Spatial Attention", { size: 33, weight: 700 })}
${line(955, 482, 2035, 482, { strokeWidth: 3, arrow: true })}
${line(976, 812, 1055, 812, { strokeWidth: 4 })}
${line(976, 1142, 1055, 1142, { strokeWidth: 4 })}
${line(1055, 812, 1055, 685, { strokeWidth: 4 })}
${line(1055, 1142, 1055, 975, { strokeWidth: 4 })}
${line(1055, 685, 1100, 685, { strokeWidth: 4, arrow: true })}
${line(1055, 975, 1100, 975, { strokeWidth: 4, arrow: true })}
${line(1155, 685, 1200, 685, { strokeWidth: 4 })}
${line(1155, 975, 1200, 975, { strokeWidth: 4 })}
${line(1260, 685, 1380, 685, { strokeWidth: 4, arrow: true })}
${line(1260, 975, 1380, 975, { strokeWidth: 4, arrow: true })}
${line(1770, 650, 1810, 650, { strokeWidth: 4, arrow: true })}
${circle(1855, 813, 22, { fill: "#fff", strokeWidth: 4 })}
${line(1780, 1000, 1810, 1000, { strokeWidth: 4, arrow: true })}
${line(1855, 673, 1855, 789, { strokeWidth: 4, arrow: true })}
${line(1855, 975, 1855, 837, { strokeWidth: 4, arrow: true })}
${verticalOp(1915, 728, "1x1 Conv")}
${convBlock(1995, 725, "")}
${text(2038, 934, "Fused", { size: 30, weight: 700 })}
${text(2038, 975, "Features", { size: 30, weight: 700 })}
${line(1878, 813, 1915, 813, { strokeWidth: 4, arrow: true })}
${line(1958, 813, 1995, 813, { strokeWidth: 4, arrow: true })}
${rect(1126, 1210, 688, 100, { rx: 14, fill: "#f9fbf5", stroke: "#111", strokeWidth: 2 })}
${text(1470, 1255, "Cascaded Dual Attention Module (CDAM)", { size: 31, weight: 700 })}
${text(1470, 1295, "Cascaded Dual Attention Module (CDAM)", { size: 30 })}
</g>

<g id="decoder">
${rect(1975, 255, 840, 1120, { rx: 24, fill: "url(#bluePanel)", stroke: "#375f89", strokeWidth: 3 })}
${rect(1975, 255, 840, 70, { rx: 18, fill: "url(#headerBlue)", stroke: "#375f89", strokeWidth: 2 })}
${text(2395, 307, "Decoder", { size: 45, weight: 700 })}
${rect(2012, 345, 520, 1020, { rx: 24, fill: "none", stroke: "#254c74", strokeWidth: 2, dash: "12 9" })}
${line(1958, 813, 2020, 813, { strokeWidth: 4, arrow: true })}
${convBlock(2058, 430, "")}${text(2104, 588, "Feature", { size: 30, weight: 700 })}${text(2104, 630, "Upsampling", { size: 30, weight: 700 })}
${convBlock(2058, 770, "")}${text(2104, 962, "...", { size: 45, weight: 700 })}
${convBlock(2058, 1010, "")}${convBlock(2080, 1000, "")}${text(2104, 1248, "Feature", { size: 30, weight: 700 })}${text(2104, 1290, "Upsampling", { size: 30, weight: 700 })}
${line(2115, 482, 2265, 482, { strokeWidth: 4 })}
${line(2265, 482, 2265, 792, { strokeWidth: 4, arrow: true })}
${line(2115, 813, 2255, 813, { strokeWidth: 4, arrow: true })}
${circle(2265, 813, 22, { fill: "#fff", strokeWidth: 4 })}
${line(2288, 813, 2380, 813, { strokeWidth: 4, arrow: true })}
${line(2115, 1142, 2255, 1142, { strokeWidth: 4, arrow: true })}
${circle(2265, 1142, 22, { fill: "#fff", strokeWidth: 4 })}
${line(2265, 835, 2265, 1120, { strokeWidth: 4, arrow: true })}
${rect(2330, 345, 220, 1020, { fill: "none", stroke: "#254c74", strokeWidth: 2, dash: "12 9" })}
${text(2435, 650, "Segmentation", { size: 32, weight: 700 })}
${text(2435, 708, "Head", { size: 32, weight: 700 })}
${verticalOp(2390, 710, "1x1 Conv")}
${verticalOp(2480, 710, "Softmax")}
${line(2300, 813, 2390, 813, { strokeWidth: 4, arrow: true })}
${line(2432, 813, 2480, 813, { strokeWidth: 4, arrow: true })}
${line(2522, 813, 2585, 813, { strokeWidth: 4, arrow: true })}
${rect(2585, 705, 190, 190, { fill: "#40358e", stroke: "#544aa0" })}
${pathEl("M2668 731 C2720 726 2750 770 2741 823 C2727 893 2652 880 2624 835 C2592 782 2622 740 2668 731 Z", { fill: "#95ca70", stroke: "#95ca70" })}
${pathEl("M2622 755 C2655 765 2657 815 2620 836 C2594 813 2597 772 2622 755 Z", { fill: "#f0db43", stroke: "#f0db43" })}
${text(2680, 955, "Segmentation", { size: 31, weight: 700 })}
${text(2680, 1000, "Map", { size: 31, weight: 700 })}
${text(2445, 1250, "Segmentation", { size: 30, weight: 700 })}
${text(2445, 1292, "Head", { size: 30, weight: 700 })}
${["Tumor Core", "Whole Tumor", "Enhancing Tumor", "Class Class"].map((v, i) => `${rect(2560, 1015 + i * 45, 38, 32, { fill: ["#3f3d99", "#6f934e", "#9aca76", "#b7b7b7"][i], stroke: "#111", strokeWidth: 1 })}${text(2608, 1040 + i * 45, v, { size: 24, weight: 700, anchor: "start" })}`).join("\n")}
</g>

${line(2030, 1375, 1980, 1375, { strokeWidth: 3 })}
${line(2030, 1375, 900, 1375, { strokeWidth: 3 })}
${line(900, 1375, 900, 1240, { strokeWidth: 3 })}
${line(900, 1240, 1980, 1100, { strokeWidth: 2, dash: "12 9" })}
${text(760, 1438, "⊗ for Element-wise Multiply", { size: 31, weight: 700 })}
${text(760, 1505, "⊗ for Element-wise Multiply", { size: 31, weight: 700 })}
${text(1930, 1438, "⊕ for Element-wise Addition", { size: 31, weight: 700 })}
${text(1930, 1505, "⊙ for Concatenation", { size: 31, weight: 700 })}
${text(1408, 1515, "Figure 3", { size: 42, weight: 700 })}
`;
  fs.writeFileSync(path.join(outDir, "fusion-network.svg"), svg(width, height, body, defs));
}

demoDynamicGraph();
demoFusionNetwork();
console.log(JSON.stringify({
  outputs: [
    path.join(outDir, "dynamic-graph.svg"),
    path.join(outDir, "fusion-network.svg"),
  ],
}, null, 2));
