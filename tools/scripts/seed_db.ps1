param (
    [string]$Mode = "fill_missing",
    [string]$Volume = "medium"
)

Write-Host "Iniciando seed de base de datos..." -ForegroundColor Cyan

cd backend
.\.venv\Scripts\python.exe manage.py seed_data --mode $Mode --volume $Volume

if ($LASTEXITCODE -eq 0) {
    Write-Host "Seed completado exitosamente." -ForegroundColor Green
} else {
    Write-Host "Error durante el seed." -ForegroundColor Red
}
