# Script para ejecutar pruebas E2E de GestorCOC
# Uso: .\test-e2e.ps1 [-Headed] [-Debug] [-Project chromium|firefox|webkit]

param(
    [switch]$Headed,
    [switch]$Debug,
    [string]$Project = "chromium",
    [string]$Spec
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Pruebas E2E - GestorCOC" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que el backend esté corriendo
Write-Host "Verificando backend en http://localhost:8000..." -NoNewline
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/api/health/" -TimeoutSec 5 -UseBasicParsing
    Write-Host " OK" -ForegroundColor Green
} catch {
    Write-Host " ERROR" -ForegroundColor Red
    Write-Host "El backend no está corriendo en http://localhost:8000" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Para iniciar el backend:" -ForegroundColor Yellow
    Write-Host "  cd ..\backend" -ForegroundColor Yellow
    Write-Host "  .\.venv\Scripts\python.exe manage.py runserver" -ForegroundColor Yellow
    exit 1
}

# Verificar que el frontend esté corriendo
Write-Host "Verificando frontend en http://localhost:4200..." -NoNewline
try {
    $response = Invoke-WebRequest -Uri "http://localhost:4200" -TimeoutSec 5 -UseBasicParsing
    Write-Host " OK" -ForegroundColor Green
} catch {
    Write-Host " ERROR" -ForegroundColor Red
    Write-Host "El frontend no está corriendo en http://localhost:4200" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Para iniciar el frontend:" -ForegroundColor Yellow
    Write-Host "  npm start" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Iniciando pruebas E2E..." -ForegroundColor Green
Write-Host ""

# Construir comando de Playwright
$cmd = "npx playwright test"

if ($Spec) {
    $cmd += " $Spec"
}

if ($Project) {
    $cmd += " --project=$Project"
}

if ($Headed) {
    $cmd += " --headed"
    Write-Host "Modo: Headed (navegador visible)" -ForegroundColor Cyan
}

if ($Debug) {
    $cmd += " --debug"
    Write-Host "Modo: Debug" -ForegroundColor Cyan
}

# Ejecutar pruebas
Write-Host "Comando: $cmd" -ForegroundColor Gray
Write-Host ""

Invoke-Expression $cmd

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Pruebas completadas" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Para ver el reporte HTML:" -ForegroundColor Green
Write-Host "  npx playwright show-report" -ForegroundColor Yellow
Write-Host ""
