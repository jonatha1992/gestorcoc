param(
    [string]$SourceDir = "docs/diagrams",
    [string]$OutputDir = ".tmp/diagrams",
    [ValidateSet("png", "svg")]
    [string]$Format = "png"
)

$ErrorActionPreference = "Stop"

$workspaceRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$sourcePath = Join-Path $workspaceRoot $SourceDir
$outputPath = Join-Path $workspaceRoot $OutputDir
$plantUmlDir = Join-Path $workspaceRoot ".tmp/plantuml"
$plantUmlJar = Join-Path $plantUmlDir "plantuml.jar"
$plantUmlUrl = "https://github.com/plantuml/plantuml/releases/latest/download/plantuml.jar"

if (-not (Test-Path $sourcePath)) {
    throw "Source directory not found: $sourcePath"
}

New-Item -ItemType Directory -Force -Path $outputPath | Out-Null
New-Item -ItemType Directory -Force -Path $plantUmlDir | Out-Null

if (-not (Test-Path $plantUmlJar)) {
    Write-Host "Downloading PlantUML jar..."
    Invoke-WebRequest -Uri $plantUmlUrl -OutFile $plantUmlJar
}

$diagrams = Get-ChildItem -Path $sourcePath -Filter "*.puml" | Sort-Object Name
if (-not $diagrams) {
    throw "No .puml files found in $sourcePath"
}

Write-Host "Rendering $($diagrams.Count) diagram(s) to $outputPath"

& java -jar $plantUmlJar "-charset" "UTF-8" "-t$Format" "-o" $outputPath @($diagrams.FullName)

Write-Host ""
Write-Host "Generated files:"
Get-ChildItem -Path $outputPath -Filter "*.$Format" | Sort-Object Name | ForEach-Object {
    Write-Host $_.FullName
}
