param(
  [Parameter(Mandatory = $true)][string]$SvgPath,
  [Parameter(Mandatory = $true)][string]$OutputPptxPath,
  [int]$WidthPx = 1536,
  [int]$HeightPx = 1024,
  [int]$UngroupPasses = 8,
  [int]$ConvertWaitMs = 1200,
  [int]$ConvertAttempts = 4
)

$ErrorActionPreference = "Stop"
$ppt = $null
$presentation = $null

try {
  $svgResolved = (Resolve-Path -LiteralPath $SvgPath).Path
  $outputResolved = [System.IO.Path]::GetFullPath($OutputPptxPath)
  $outputDir = [System.IO.Path]::GetDirectoryName($outputResolved)
  if (-not [string]::IsNullOrWhiteSpace($outputDir)) {
    New-Item -ItemType Directory -Force -Path $outputDir | Out-Null
  }

  $slideWidthPt = [double]$WidthPx * 72.0 / 96.0
  $slideHeightPt = [double]$HeightPx * 72.0 / 96.0

  try {
    $ppt = New-Object -ComObject PowerPoint.Application
  } catch {
    throw "Failed to create PowerPoint COM session. Make sure Office is installed and you are running in an interactive desktop session."
  }
  $ppt.Visible = 1
  $presentation = $ppt.Presentations.Add()
  $presentation.PageSetup.SlideWidth = $slideWidthPt
  $presentation.PageSetup.SlideHeight = $slideHeightPt

  $slide = $presentation.Slides.Add(1, 12) # ppLayoutBlank
  try {
    $presentation.Windows.Item(1).Activate()
    $slide.Select()
  } catch {}
  $shape = $slide.Shapes.AddPicture($svgResolved, $false, $true, 0, 0, $slideWidthPt, $slideHeightPt)
  $converted = $false

  for ($attempt = 1; $attempt -le $ConvertAttempts; $attempt += 1) {
    try {
      $shape.Select()
      Start-Sleep -Milliseconds 120
      # Ribbon command: right-click SVG -> "Convert to Shape"
      $ppt.CommandBars.ExecuteMso("SVGEdit")
      Start-Sleep -Milliseconds $ConvertWaitMs
      if ($slide.Shapes.Count -gt 1 -or $slide.Shapes.Item(1).Type -ne 28) {
        $converted = $true
        break
      }
    } catch {
      Start-Sleep -Milliseconds 200
    }
  }

  for ($iter = 0; $iter -lt $UngroupPasses; $iter += 1) {
    $changed = $false
    for ($i = $slide.Shapes.Count; $i -ge 1; $i -= 1) {
      $item = $slide.Shapes.Item($i)
      if ($item.Type -eq 6) { # msoGroup
        try {
          $null = $item.Ungroup()
          $changed = $true
        } catch {
          continue
        }
      }
    }
    if (-not $changed) {
      break
    }
    Start-Sleep -Milliseconds 150
  }

  $presentation.SaveAs($outputResolved, 24) # ppSaveAsOpenXMLPresentation
  Write-Output (@{
      outputPath = $outputResolved
      converted = $converted
      shapeCount = $slide.Shapes.Count
    } | ConvertTo-Json -Compress)
}
finally {
  if ($presentation -ne $null) {
    $presentation.Close()
  }
  if ($ppt -ne $null) {
    $ppt.Quit()
  }
}
