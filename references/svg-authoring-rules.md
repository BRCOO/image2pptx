# SVG Authoring Rules For Editable PPTX

Use these rules when recreating a diagram image as SVG before converting it to PowerPoint shapes.

## Prefer Semantic SVG

- Use `<text>` for real text that the user may edit later.
- Use primitives such as `<rect>`, `<circle>`, `<ellipse>`, `<line>`, `<path>`, and `<polygon>` for visual components.
- Add stable `id` values to major groups: `step-1`, `main-flow-arrows`, `bottom-note`, etc.
- Keep the SVG canvas at the source image dimensions or the requested target dimensions. Use a matching `viewBox`.
- Avoid embedding the original image unless the user explicitly wants a background reference layer.

## PowerPoint Conversion Compatibility

- Avoid SVG marker arrows when final editability matters. PowerPoint may simplify or drop marker heads. Prefer explicit arrowhead paths or polygons.
- Avoid complex filters, masks, clipping, nested transforms, and CSS variables unless they are visually essential.
- Prefer direct attributes (`fill`, `stroke`, `stroke-width`) over CSS classes for conversion stability.
- Use common fonts such as Arial, Calibri, Helvetica, or Aptos.
- Keep text as simple `<text><tspan>...</tspan></text>` blocks. Avoid text-on-path.
- Keep each important object separate if the user will need to move it independently.

## Practical Layering

- Build five to ten coarse groups first, then refine inside each group.
- For scientific diagrams, prioritize editable text, boxes, arrows, labels, icons, legends, and key data glyphs over pixel-perfect texture.
- Use named groups for large regions but ungroup after PowerPoint conversion when the user wants fine-grained editing.

## QA Expectations

- Validate XML with `xmllint --noout` when available.
- Render a PNG preview at the SVG viewBox dimensions.
- Convert to PPTX and inspect the package. A good editable result usually has many `<p:sp>` shapes, nonzero `<a:t>` text runs, and zero or very few `<p:pic>` pictures.
