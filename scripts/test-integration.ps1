param(
    [ValidateSet("localnet", "studionet")]
    [string]$Network = "studionet"
)

$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$gltest = Join-Path $root ".venv\Scripts\gltest.exe"
$integrationTest = Join-Path $root "tests\integration\test_football_bets.py"

if (-not (Test-Path -LiteralPath $gltest)) {
    throw "gltest is missing. Run 'npm run setup' first."
}

$networkConfig = @{
    localnet = @{
        RpcUrl = "http://127.0.0.1:4000/api"
        ChainId = "0xeec7"
    }
    studionet = @{
        RpcUrl = "https://studio.genlayer.com/api"
        ChainId = "0xf22f"
    }
}

if ($Network -eq "localnet") {
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        throw "Docker CLI is missing. Install/start Docker Desktop before running localnet integration tests."
    }

    & docker version *> $null
    if ($LASTEXITCODE -ne 0) {
        throw "Docker engine is not available. Start Docker Desktop and wait until the engine is ready."
    }
}

$selected = $networkConfig[$Network]
$requestBody = @{
    jsonrpc = "2.0"
    id = 1
    method = "eth_chainId"
    params = @()
} | ConvertTo-Json -Compress

try {
    $response = Invoke-RestMethod `
        -Uri $selected.RpcUrl `
        -Method Post `
        -ContentType "application/json" `
        -Body $requestBody `
        -TimeoutSec 15
}
catch {
    throw "Cannot reach $Network RPC at $($selected.RpcUrl): $($_.Exception.Message)"
}

if ($response.error) {
    throw "$Network RPC returned an error: $($response.error | ConvertTo-Json -Compress)"
}

if ($response.result.ToLowerInvariant() -ne $selected.ChainId) {
    throw "Unexpected chain id from ${Network}: $($response.result); expected $($selected.ChainId)."
}

Write-Host "Verified $Network RPC ($($selected.RpcUrl), chain $($response.result))."

Push-Location $root
try {
    $env:PYTHONUTF8 = "1"
    & $gltest $integrationTest -v -s --network $Network
    if ($LASTEXITCODE -ne 0) {
        throw "$Network integration tests failed."
    }
}
finally {
    Pop-Location
}
