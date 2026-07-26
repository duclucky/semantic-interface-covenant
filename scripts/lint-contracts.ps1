$ErrorActionPreference = "Stop"
$env:PYTHONUTF8 = "1"

$linter = Join-Path $PSScriptRoot "..\.venv\Scripts\genvm-lint.exe"
if (-not (Test-Path -LiteralPath $linter)) {
    throw "Missing .venv. Run npm run setup first."
}

$contracts = Get-ChildItem -LiteralPath (Join-Path $PSScriptRoot "..\contracts") -Filter "*.py" -File |
    Where-Object { $_.Name -ne "__init__.py" }

foreach ($contract in $contracts) {
    & $linter check $contract.FullName
    if ($LASTEXITCODE -ne 0) {
        throw "Contract lint failed: $($contract.FullName)"
    }
}
