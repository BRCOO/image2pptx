name: image2pptx
description: Convert raster diagram images, screenshots, scientific figures, workflow charts, slide screenshots, PNG/JPEG/PDF-rendered pages, or existing SVG designs into semantic editable SVG plus highly editable PowerPoint PPTX. Use when Codex needs image-to-SVG-to-PPTX, image2ppt, image2pptx, screenshot to editable PPT, PNG to editable PowerPoint, SVG to PPT shapes, or a diagram rebuilt as editable text boxes, shapes, arrows, icons, and grouped elements for manual micro-adjustment.
---

# image2pptx

Convert flat diagrams, screenshots, and scientific figures into two editable deliverables:

- a semantic SVG reconstruction with editable text and named groups
- a PPTX whose SVG has been converted into PowerPoint-native shapes/text for fine manual adjustment

Prefer semantic reconstruction over pixel tracing for diagrams with text, boxes, arrows, legends, and scientific annotations.

## Workflow

1. Inspect the source image dimensions and content.
2. Rebuild the diagram as semantic SVG. Read `references/svg-authoring-rules.md` before writing SVG.
3. Render an SVG preview:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "<skill_dir>\scripts\render-svg-preview.ps1" `
  -SvgPath "<output.svg>" `
  -OutputPngPath "<output-preview.png>"
```

4. Visually compare the preview with the source image. Fix major layout, text, color, and arrow issues before converting to PPTX.
5. Convert SVG to editable PPTX with PowerPoint:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "<skill_dir>\scripts\svg-to-editable-ppt.ps1" `
  -SvgPath "<output.svg>" `
  -OutputPptxPath "<output-editable.pptx>" `
  -WidthPx <source_width_px> `
  -HeightPx <source_height_px>
```

6. Export a PPT preview:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "<skill_dir>\scripts\export-slide-preview.ps1" `
  -PptxPath "<output-editable.pptx>" `
  -OutputPngPath "<output-editable-preview.png>" `
  -Width <source_width_px> `
  -Height <source_height_px>
```

7. Inspect editability:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "<skill_dir>\scripts\inspect-pptx-editability.ps1" `
  -PptxPath "<output-editable.pptx>"
```

Report `shapes`, `textRuns`, `pictures`, and whether `editableLikely` is true. A good result generally has many shapes, nonzero text runs, and zero pictures.

## Authoring Guidance

- Use SVG primitives and `<text>` whenever the user may need to micro-adjust objects.
- Avoid embedding the source image in the final SVG unless explicitly requested as a reference layer.
- Draw arrowheads as explicit polygons/paths instead of relying on SVG markers when PowerPoint editability matters.
- Use the source image dimensions as the SVG `viewBox` unless a target slide size is requested.
- Keep named groups for logical organization in the SVG; let the conversion script ungroup for PPT object-level editing.
- For dense icons or pictorial elements, approximate with editable primitives first. Use raster tracing only for parts where shape-level editability is less important than appearance.

## Fallbacks

If PowerPoint COM conversion fails, create the SVG and a PPTX with the SVG embedded, then clearly label the PPTX as less editable:

```powershell
node "<skill_dir>\scripts\svg-to-ppt-embedded.js" --svg "<output.svg>" --output "<fallback.pptx>" --width <source_width_px> --height <source_height_px>
```

If Chrome/Edge preview rendering fails, still validate XML and deliver the SVG, but state that preview rendering could not be verified.

Read `references/workflow-notes.md` when deciding whether to use semantic reconstruction or raster tracing.
