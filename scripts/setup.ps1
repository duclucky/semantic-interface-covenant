param(
    [switch]$SkipChecks
)

$ErrorActionPreference = "Stop"
$root = Resolve-Path (Join-Path $PSScriptRoot "..")

function Require-Command {
    param([Parameter(Mandatory = $true)][string]$Name)
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Required command is missing: $Name"
    }
}

Require-Command "node"
Require-Command "npm"
Require-Command "uv"
Require-Command "git"

$nodeMajor = [int]((node --version).TrimStart("v").Split(".")[0])
if ($nodeMajor -lt 18) {
    throw "Node.js 18+ is required; found $(node --version)."
}

if (-not (Get-Command "genlayer" -ErrorAction SilentlyContinue)) {
    npm install -g genlayer@0.39.2
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to install GenLayer CLI."
    }
}

Push-Location $root
try {
    uv python install 3.12
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to install Python 3.12."
    }

    if (-not (Test-Path -LiteralPath ".venv\Scripts\python.exe")) {
        uv venv --python 3.12 .venv
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to create .venv."
        }
    }

    $pythonRequirements = if (Test-Path -LiteralPath "requirements.lock") {
        "requirements.lock"
    }
    else {
        "requirements.txt"
    }

    uv pip install --python .venv\Scripts\python.exe -r $pythonRequirements
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to install Python dependencies."
    }

    # The pre-release Transaction Kit names genlayer-js with GitHub shorthand.
    # npm records that nested dependency as git+ssh even though it is public.
    # Rewrite only GitHub SSH URLs, at repository scope, so fresh machines and
    # CI can install without an SSH key.
    git config --local --replace-all url."https://github.com/".insteadOf "ssh://git@github.com/"
    git config --local --add url."https://github.com/".insteadOf "git@github.com:"

    npm install
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to install Node dependencies."
    }

    if (-not (Test-Path -LiteralPath "frontend\.env")) {
        Copy-Item -LiteralPath "frontend\.env.example" -Destination "frontend\.env"
    }

    if (-not $SkipChecks) {
        & powershell -NoProfile -ExecutionPolicy Bypass -File scripts\check.ps1
        if ($LASTEXITCODE -ne 0) {
            throw "Environment checks failed."
        }
    }
}
finally {
    Pop-Location
}
