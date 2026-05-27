param(
  [Parameter(Mandatory = $true)][string]$PptxPath,
  [Parameter(Mandatory = $true)][string]$OutputPngPath,
  [int]$Width = 1536,
  [int]$Height = 1024
)

$ErrorActionPreference = "Stop"
$ppt = $null
$presentation = $null

try {
  $pptxResolved = (Resolve-Path -LiteralPath $PptxPath).Path
  $outputResolved = [System.IO.Path]::GetFullPath($OutputPngPath)
  $outputDir = [System.IO.Path]::GetDirectoryName($outputResolved)
  if (-not [string]::IsNullOrWhiteSpace($outputDir)) {
    New-Item -ItemType Directory -Force -Path $outputDir | Out-Null
  }

  $slideDir = [System.IO.Path]::GetDirectoryName($outputResolved)
  $baseName = [System.IO.Path]::GetFileNameWithoutExtension($outputResolved)
  $tempDir = Join-Path $slideDir ("__slides_" + [System.Guid]::NewGuid().ToString("N"))
  New-Item -ItemType Directory -Force -Path $tempDir | Out-Null

  $ppt = New-Object -ComObject PowerPoint.Application
  $ppt.Visible = 1
  $presentation = $ppt.Presentations.Open($pptxResolved, $false, $true, $false)
  $presentation.Export($tempDir, "PNG", $Width, $Height)

  $firstSlide = Join-Path $tempDir "幻灯片1.PNG"
  if (-not (Test-Path -LiteralPath $firstSlide)) {
    $firstSlide = Join-Path $tempDir "Slide1.PNG"
  }
  if (-not (Test-Path -LiteralPath $firstSlide)) {
    $fallback = Get-ChildItem -Path $tempDir -Filter *.PNG | Sort-Object Name | Select-Object -First 1
    if ($fallback) {
      $firstSlide = $fallback.FullName
    }
  }
  if (-not (Test-Path -LiteralPath $firstSlide)) {
    throw "Failed to export slide image."
  }
  Copy-Item -LiteralPath $firstSlide -Destination $outputResolved -Force
  Write-Output $outputResolved
}
finally {
  if ($presentation -ne $null) {
    $presentation.Close()
  }
  if ($ppt -ne $null) {
    $ppt.Quit()
  }
}
