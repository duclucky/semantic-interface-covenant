$ErrorActionPreference = "Stop"

& (Join-Path $PSScriptRoot "lint-contracts.ps1")
if ($LASTEXITCODE -ne 0) {
    throw "Contract lint failed."
}

$python = Join-Path $PSScriptRoot "..\.venv\Scripts\python.exe"
& $python -m pytest (Join-Path $PSScriptRoot "..\tests\direct") -v
if ($LASTEXITCODE -ne 0) {
    throw "Direct tests failed."
}
