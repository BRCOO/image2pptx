param(
  [Parameter(Mandatory = $true)][string]$PptxPath
)

$ErrorActionPreference = "Stop"

$pptxResolved = (Resolve-Path -LiteralPath $PptxPath).Path
$tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("pptx-inspect-" + [System.Guid]::NewGuid().ToString("N"))
$zipPath = Join-Path $tempRoot "deck.zip"
$unpackDir = Join-Path $tempRoot "unzipped"

try {
  New-Item -ItemType Directory -Force -Path $tempRoot | Out-Null
  Copy-Item -LiteralPath $pptxResolved -Destination $zipPath -Force
  Expand-Archive -LiteralPath $zipPath -DestinationPath $unpackDir -Force

  $slideFiles = Get-ChildItem -LiteralPath (Join-Path $unpackDir "ppt\slides") -Filter "slide*.xml" -ErrorAction SilentlyContinue | Sort-Object Name
  $mediaFiles = Get-ChildItem -LiteralPath (Join-Path $unpackDir "ppt\media") -File -ErrorAction SilentlyContinue

  $shapeCount = 0
  $textRunCount = 0
  $pictureCount = 0
  $groupCount = 0
  $graphicFrameCount = 0
  foreach ($slideFile in $slideFiles) {
    $slideXml = Get-Content -LiteralPath $slideFile.FullName -Raw
    $shapeCount += [regex]::Matches($slideXml, '<p:sp[ >]').Count
    $textRunCount += [regex]::Matches($slideXml, '<a:t>').Count
    $pictureCount += [regex]::Matches($slideXml, '<p:pic[ >]').Count
    $groupCount += [regex]::Matches($slideXml, '<p:grpSp[ >]').Count
    $graphicFrameCount += [regex]::Matches($slideXml, '<p:graphicFrame[ >]').Count
  }

  [PSCustomObject]@{
    pptxPath = $pptxResolved
    slides = $slideFiles.Count
    shapes = $shapeCount
    textRuns = $textRunCount
    pictures = $pictureCount
    groups = $groupCount
    graphicFrames = $graphicFrameCount
    mediaFiles = @($mediaFiles).Count
    editableLikely = ($shapeCount -gt 0 -and $pictureCount -eq 0)
  } | ConvertTo-Json -Compress
}
finally {
  if (Test-Path -LiteralPath $tempRoot) {
    Remove-Item -LiteralPath $tempRoot -Recurse -Force
  }
}
