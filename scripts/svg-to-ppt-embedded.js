#!/usr/bin/env node
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const Module = require("node:module");

function requireRuntimeModule(packageName) {
  try {
    return require(packageName);
  } catch (firstError) {
    const candidates = [
      process.env.NODE_PATH,
      path.join(process.cwd(), "node_modules"),
      path.join(os.homedir(), ".cache", "codex-runtimes", "codex-primary-runtime", "dependencies", "node", "node_modules")
    ]
      .filter(Boolean)
      .flatMap((item) => item.split(path.delimiter))
      .filter(Boolean);

    for (const root of candidates) {
      if (!fs.existsSync(root)) {
        continue;
      }
      try {
        const pnpmHoistDir = path.join(root, ".pnpm", "node_modules");
        if (fs.existsSync(pnpmHoistDir) && !Module.globalPaths.includes(pnpmHoistDir)) {
          process.env.NODE_PATH = [process.env.NODE_PATH, pnpmHoistDir].filter(Boolean).join(path.delimiter);
          Module._initPaths();
        }
        const scopedRequire = Module.createRequire(path.join(root, "index.js"));
        return scopedRequire(packageName);
      } catch (_) {
        // Try the next candidate.
      }
    }
    throw firstError;
  }
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) {
      continue;
    }
    const key = token.slice(2);
    const value = argv[i + 1];
    if (!value || value.startsWith("--")) {
      out[key] = true;
      continue;
    }
    out[key] = value;
    i += 1;
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.svg || !args.output) {
    throw new Error("Usage: node svg-to-ppt-embedded.js --svg <input.svg> --output <output.pptx> [--width 1690] [--height 931]");
  }

  const PptxGenJS = requireRuntimeModule("pptxgenjs");
  const svgPath = path.resolve(args.svg);
  const outPath = path.resolve(args.output);
  const widthPx = Number(args.width || 1690);
  const heightPx = Number(args.height || 931);
  const slideW = 13.333;
  const slideH = Number((slideW * (heightPx / widthPx)).toFixed(4));

  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "CUSTOM", width: slideW, height: slideH });
  pptx.layout = "CUSTOM";
  pptx.author = "image2pptx";

  const slide = pptx.addSlide();
  slide.addImage({ path: svgPath, x: 0, y: 0, w: slideW, h: slideH });

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  await pptx.writeFile({ fileName: outPath });
  console.log(JSON.stringify({ output: outPath, mode: "embedded-svg" }));
}

main().catch((error) => {
  console.error(error?.stack || String(error));
  process.exit(1);
});
