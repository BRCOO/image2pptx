param(
  [Parameter(Mandatory = $true)][string]$SvgPath,
  [Parameter(Mandatory = $true)][string]$OutputPngPath,
  [int]$Width = 0,
  [int]$Height = 0,
  [string]$ChromePath = ""
)

$ErrorActionPreference = "Stop"

$svgResolved = (Resolve-Path -LiteralPath $SvgPath).Path
$outputResolved = [System.IO.Path]::GetFullPath($OutputPngPath)
$outputDir = [System.IO.Path]::GetDirectoryName($outputResolved)
if (-not [string]::IsNullOrWhiteSpace($outputDir)) {
  New-Item -ItemType Directory -Force -Path $outputDir | Out-Null
}

if ([string]::IsNullOrWhiteSpace($ChromePath)) {
  $candidates = @(
    "C:\Program Files\Google\Chrome\Application\chrome.exe",
    "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
  )
  foreach ($candidate in $candidates) {
    if (Test-Path -LiteralPath $candidate) {
      $ChromePath = $candidate
      break
    }
  }
}

if ([string]::IsNullOrWhiteSpace($ChromePath) -or -not (Test-Path -LiteralPath $ChromePath)) {
  throw "Could not find Chrome or Edge. Pass -ChromePath explicitly."
}

if ($Width -le 0 -or $Height -le 0) {
  $xml = Get-Content -LiteralPath $svgResolved -Raw
  $viewBox = [regex]::Match($xml, 'viewBox\s*=\s*["'']\s*[-\d.]+\s+[-\d.]+\s+([\d.]+)\s+([\d.]+)\s*["'']')
  if ($viewBox.Success) {
    $Width = [int][double]$viewBox.Groups[1].Value
    $Height = [int][double]$viewBox.Groups[2].Value
  } else {
    $Width = 1690
    $Height = 931
  }
}

& $ChromePath `
  --headless `
  --disable-gpu `
  --hide-scrollbars `
  "--window-size=$Width,$Height" `
  "--screenshot=$outputResolved" `
  $svgResolved | Out-Host

$deadline = (Get-Date).AddSeconds(10)
while (-not (Test-Path -LiteralPath $outputResolved)) {
  if ((Get-Date) -gt $deadline) {
    throw "Chrome did not write preview image: $outputResolved"
  }
  Start-Sleep -Milliseconds 100
}

Write-Output $outputResolved
