param(
    [switch]$SkipInit,
    [switch]$StopAfter,
    [string]$LocalnetVersion = "v0.65.0"
)

$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..")
$localnetStarted = $false

foreach ($command in @("docker", "genlayer")) {
    if (-not (Get-Command $command -ErrorAction SilentlyContinue)) {
        throw "Required command is missing: $command"
    }
}

& docker version
if ($LASTEXITCODE -ne 0) {
    throw "Docker engine is not available. Start Docker Desktop and wait until the engine is ready."
}

Push-Location $root
try {
    if (-not $SkipInit) {
        & genlayer init --headless --localnet-version $LocalnetVersion
        if ($LASTEXITCODE -ne 0) {
            throw "GenLayer localnet initialization failed."
        }
    }

    & genlayer up --headless
    if ($LASTEXITCODE -ne 0) {
        throw "GenLayer localnet startup failed."
    }
    $localnetStarted = $true

    $requestBody = @{
        jsonrpc = "2.0"
        id = 1
        method = "eth_chainId"
        params = @()
    } | ConvertTo-Json -Compress

    $deadline = (Get-Date).AddMinutes(4)
    $chainId = $null
    do {
        try {
            $response = Invoke-RestMethod `
                -Uri "http://127.0.0.1:4000/api" `
                -Method Post `
                -ContentType "application/json" `
                -Body $requestBody `
                -TimeoutSec 5
            $chainId = $response.result
        }
        catch {
            $chainId = $null
        }
        if (-not $chainId) {
            Start-Sleep -Seconds 3
        }
    } while (-not $chainId -and (Get-Date) -lt $deadline)

    if (-not $chainId) {
        throw "Localnet RPC did not become ready at http://127.0.0.1:4000/api within 4 minutes."
    }
    if ($chainId.ToLowerInvariant() -ne "0xeec7") {
        throw "Unexpected localnet chain id: $chainId; expected 0xeec7 (61127)."
    }

    & (Join-Path $PSScriptRoot "test-integration.ps1") -Network localnet
}
finally {
    if ($StopAfter -and $localnetStarted) {
        & genlayer stop
    }
    Pop-Location
}
