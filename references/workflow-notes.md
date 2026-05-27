# Workflow Notes

This skill packages the workflow proven on a medical/scientific flow diagram:

1. Recreate the source image as semantic SVG rather than tracing every pixel.
2. Preview the SVG with Chrome or Edge headless.
3. Insert the SVG into PowerPoint, run PowerPoint's SVG-to-shape conversion, and repeatedly ungroup.
4. Export a PNG preview from the generated PPTX.
5. Inspect the PPTX package to confirm it contains editable shapes/text instead of a single embedded image.

## When To Use Raster Tracing

Use raster tracing only for logos, icons, silhouettes, and dense decorative art where text editability is not the priority. For charts, workflows, scientific figures, and slides, semantic reconstruction is usually better.

## Known Limits

- PowerPoint's built-in SVG conversion can simplify SVG marker arrowheads. Draw arrowheads explicitly when they must remain editable.
- Some effects may rasterize or convert poorly. Keep SVG simple.
- The conversion step requires Microsoft PowerPoint installed on Windows in an interactive desktop session.
- If a conversion command times out, inspect and close any leftover `POWERPNT` process before retrying. The usual symptom is an empty `Presentation1` / `演示文稿1` PowerPoint process left open by COM automation.
- If PowerPoint conversion fails, provide the SVG and an embedded-SVG PPTX fallback, but label it as less editable.
