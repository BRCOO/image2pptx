# image2pptx

Convert images, screenshots, and scientific figures into editable PowerPoint slides.

Semantic SVG reconstruction first. Native PPTX shapes second. Not a screenshot dropped onto a slide.

![GitHub Repo stars](https://img.shields.io/github/stars/BRCOO/image2pptx?style=social)
![Windows](https://img.shields.io/badge/platform-Windows-0078D4)
![PowerPoint](https://img.shields.io/badge/requires-PowerPoint-B7472A)

## Why image2pptx

Most image-to-PowerPoint workflows stop at one of two bad outcomes:

- the original image gets embedded as a flat picture
- the converted slide looks acceptable but is painful to edit

`image2pptx` takes a different route. It rebuilds diagrams as semantic SVG first, then converts that SVG into PowerPoint-native text, shapes, arrows, and groups. The result is a `.pptx` that stays much more editable for manual cleanup and restyling.

## Features

- Convert screenshots, diagram images, scientific figures, and PDF-rendered pages into editable slides
- Reconstruct text, boxes, arrows, legends, connectors, and icons as native PowerPoint objects
- Keep a semantic SVG as an intermediate source of truth
- Export preview images for SVG and PPT output QA
- Inspect editability with shape and text statistics
- Fall back to embedded SVG export when full COM-based conversion is unavailable

## How It Works

```text
image / screenshot / rendered PDF
  -> semantic SVG reconstruction
  -> SVG preview and manual correction
  -> PowerPoint conversion
  -> editable PPTX + preview + editability report
```

## Quick Start

1. Rebuild the source image as semantic SVG.
2. Preview the SVG render.
3. Convert the SVG to editable PPTX.
4. Export a slide preview.
5. Inspect how editable the output is.

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ".\scripts\render-svg-preview.ps1" `
  -SvgPath ".\out\figure.svg" `
  -OutputPngPath ".\out\figure-preview.png"

powershell -NoProfile -ExecutionPolicy Bypass -File ".\scripts\svg-to-editable-ppt.ps1" `
  -SvgPath ".\out\figure.svg" `
  -OutputPptxPath ".\out\figure-editable.pptx" `
  -WidthPx 1600 `
  -HeightPx 900

powershell -NoProfile -ExecutionPolicy Bypass -File ".\scripts\export-slide-preview.ps1" `
  -PptxPath ".\out\figure-editable.pptx" `
  -OutputPngPath ".\out\figure-editable-preview.png" `
  -Width 1600 `
  -Height 900

powershell -NoProfile -ExecutionPolicy Bypass -File ".\scripts\inspect-pptx-editability.ps1" `
  -PptxPath ".\out\figure-editable.pptx"
```

## Repository Layout

```text
agents/
  openai.yaml
references/
  svg-authoring-rules.md
  workflow-notes.md
scripts/
  render-svg-preview.ps1
  svg-to-editable-ppt.ps1
  export-slide-preview.ps1
  inspect-pptx-editability.ps1
  svg-to-ppt-embedded.js
SKILL.md
```

## Output Quality Goals

A strong result usually has:

- many PowerPoint shapes
- nonzero text runs
- zero embedded pictures in the editable path

When full editability is not possible, the fallback still produces a clean PPTX with the SVG embedded.

## Limitations

- Best for diagrams, flowcharts, figures, and annotated visuals rather than natural photos
- Full editable conversion depends on PowerPoint COM automation on Windows
- Very dense icons or decorative artwork may still need approximation or partial raster fallback

## Use In Codex

Use the skill when you want to convert a flat diagram image into a semantic SVG and an editable PowerPoint deck:

```text
Use $image2pptx to convert this diagram image into a semantic SVG and editable PPTX.
```

## Roadmap

- Better automatic diagram decomposition
- More robust arrow and connector reconstruction
- More examples and before/after showcases
- Optional packaging outside Codex skill format

## Contributing

Issues and pull requests are welcome. Small reproducible examples are especially helpful for improving editability and visual fidelity.

