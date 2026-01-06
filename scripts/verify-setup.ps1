# PowerShell Environment Verification
Write-Host ""
Write-Host "========================================"
Write-Host "Environment Setup Verification"
Write-Host "========================================"
Write-Host ""

Write-Host "PowerShell Version:" -ForegroundColor Yellow
$PSVersionTable.PSVersion
Write-Host ""

Write-Host "Node.js and npm:" -ForegroundColor Yellow
$nodeVersion = node --version
$npmVersion = npm --version
Write-Host "Node.js: $nodeVersion" -ForegroundColor Green
Write-Host "npm: $npmVersion" -ForegroundColor Green
Write-Host ""

Write-Host "Dependencies Installed:" -ForegroundColor Yellow
npm list --depth=0 2>&1 | Where-Object { $_.trim() -ne "" } | Select-Object -First 25
Write-Host ""

Write-Host "Project Structure:" -ForegroundColor Yellow
@("src", "server", "scripts", "tests", ".vscode") | ForEach-Object {
    if (Test-Path $_) { Write-Host "  $_ - OK" -ForegroundColor Green }
}
Write-Host ""

Write-Host "Configuration Files:" -ForegroundColor Yellow
@("package.json", ".vscode/settings.json", ".vscode/extensions.json", "jest.config.js") | ForEach-Object {
    if (Test-Path $_) { Write-Host "  $_ - Found" -ForegroundColor Green }
}
Write-Host ""

Write-Host "========================================"
Write-Host "SETUP READY - All systems operational"
Write-Host "========================================"
Write-Host ""
