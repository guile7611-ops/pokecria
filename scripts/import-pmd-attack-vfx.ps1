$ErrorActionPreference = 'Stop'
$archive = Join-Path $env:TEMP 'pmd-attack-effects-85692.zip'
$source = Join-Path $env:TEMP 'pmd-attack-selected'
Invoke-WebRequest -Uri 'https://www.spriters-resource.com/media/assets/83/85692.zip?updated=1755474955' -OutFile $archive
Add-Type -AssemblyName System.IO.Compression.FileSystem
Push-Location (Split-Path $PSScriptRoot -Parent)
try { $ids = @(node --input-type=module -e 'import {PMD_IDS} from "./public/pmd-attack-vfx.js"; for (const id of PMD_IDS) console.log(id)') }
finally { Pop-Location }
$zip = [IO.Compression.ZipFile]::OpenRead($archive)
try {
  foreach ($entry in $zip.Entries) {
    if ($entry.FullName -notmatch '^move_VFX/(\d{4})/000/(\d{3}\.png)$') { continue }
    if ($Matches[1] -notin $ids) { continue }
    $directory = Join-Path $source $Matches[1]
    New-Item -ItemType Directory -Path $directory -Force | Out-Null
    [IO.Compression.ZipFileExtensions]::ExtractToFile($entry, (Join-Path $directory $Matches[2]), $true)
  }
} finally { $zip.Dispose() }
node (Join-Path $PSScriptRoot 'import-pmd-attack-vfx.mjs') $source
