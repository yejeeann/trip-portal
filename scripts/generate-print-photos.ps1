param(
  [int]$MaxEdge = 1400,
  [long]$Quality = 74
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$sourceRoot = Join-Path $root "public\travel-photos"
$targetRoot = Join-Path $root "public\travel-photos-print"

Add-Type -AssemblyName System.Drawing

if (-not (Test-Path $sourceRoot)) {
  throw "Source photo folder not found: $sourceRoot"
}

New-Item -ItemType Directory -Force -Path $targetRoot | Out-Null

$jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
  Where-Object { $_.MimeType -eq "image/jpeg" } |
  Select-Object -First 1

$encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
$encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
  [System.Drawing.Imaging.Encoder]::Quality,
  $Quality
)

$converted = 0
$skipped = 0

Get-ChildItem -Path $sourceRoot -Recurse -File |
  Where-Object { $_.Extension -match '^\.(jpg|jpeg|png)$' } |
  ForEach-Object {
    $relative = $_.FullName.Substring($sourceRoot.Length).TrimStart('\', '/')
    $relativeNoExt = [System.IO.Path]::ChangeExtension($relative, ".jpg")
    $target = Join-Path $targetRoot $relativeNoExt
    $targetDir = Split-Path -Parent $target
    New-Item -ItemType Directory -Force -Path $targetDir | Out-Null

    if ((Test-Path $target) -and ((Get-Item $target).LastWriteTimeUtc -ge $_.LastWriteTimeUtc)) {
      $skipped += 1
      return
    }

    $image = $null
    $bitmap = $null
    $graphics = $null

    try {
      $image = [System.Drawing.Image]::FromFile($_.FullName)
      $longEdge = [Math]::Max($image.Width, $image.Height)
      $scale = if ($longEdge -gt $MaxEdge) { $MaxEdge / [double]$longEdge } else { 1.0 }
      $width = [Math]::Max(1, [int][Math]::Round($image.Width * $scale))
      $height = [Math]::Max(1, [int][Math]::Round($image.Height * $scale))

      $bitmap = New-Object System.Drawing.Bitmap($width, $height, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
      $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
      $graphics.Clear([System.Drawing.Color]::White)
      $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
      $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
      $graphics.DrawImage($image, 0, 0, $width, $height)

      $bitmap.Save($target, $jpegCodec, $encoderParams)
      $converted += 1
    } finally {
      if ($graphics) { $graphics.Dispose() }
      if ($bitmap) { $bitmap.Dispose() }
      if ($image) { $image.Dispose() }
    }
  }

$sourceBytes = (Get-ChildItem -Path $sourceRoot -Recurse -File |
  Where-Object { $_.Extension -match '^\.(jpg|jpeg|png)$' } |
  Measure-Object Length -Sum).Sum
$targetBytes = (Get-ChildItem -Path $targetRoot -Recurse -File |
  Measure-Object Length -Sum).Sum

[pscustomobject]@{
  Converted = $converted
  Skipped = $skipped
  SourceMB = [Math]::Round($sourceBytes / 1MB, 2)
  PrintMB = [Math]::Round($targetBytes / 1MB, 2)
  Target = $targetRoot
}
