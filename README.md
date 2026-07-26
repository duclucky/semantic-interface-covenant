# Semantic Interface Covenant

A reusable GenLayer Intelligent Contract primitive for protecting APIs, MCP
servers, and agent tools against semantic breaking changes.

Providers and integrators agree to versioned behavioral guarantees and lock GEN
bonds. If an interface changes, GenLayer validators independently fetch
allowlisted public evidence and decide whether the change is `COMPATIBLE`,
`DEGRADED`, `BREAKING`, or `UNVERIFIABLE`. A finalized verdict directly changes
binding state, settles bonded value, and can quarantine or restore a subscribed
consumer contract.

## Live Studionet deployment

Network: Studionet, chain ID `61999`.

| Contract | Address | Deploy transaction |
|---|---|---|
| `SemanticInterfaceCovenant` | [`0x05b27207c7aC50d22E5C1afBfD3c20DBccCa0570`](https://explorer-studio.genlayer.com/address/0x05b27207c7aC50d22E5C1afBfD3c20DBccCa0570) | [`0xd6cc527f...b48a47`](https://explorer-studio.genlayer.com/tx/0xd6cc527f3e0382c41da91e235d969b632bcb023a082bae8c6e1e921c22b48a47) |
| `ToolRouterGuard` | [`0xA58132c068E0406E2d5d43E8b72E2b2361ac057D`](https://explorer-studio.genlayer.com/address/0xA58132c068E0406E2d5d43E8b72E2b2361ac057D) | [`0x972bdc31...f1b8e`](https://explorer-studio.genlayer.com/tx/0x972bdc31463fe87b9cb633e0739c1357b41f9c23e043490ebd8c05c4234f1b8e) |

The recorded lifecycle finalized all of the following:

- two different EOAs acting as provider and integrator;
- provider and challenge bonds funded with GEN;
- validator web/LLM adjudication over commit-pinned public source code;
- `BREAKING / CRITICAL / SUFFICIENT` verdict for guarantee `method-key`;
- binding and guard transition `ACTIVE → QUARANTINED`;
- protected route rejection while quarantined;
- `1 GEN` service-credit settlement;
- validator-adjudicated cure and restoration to `ACTIVE`;
- successful route after restoration;
- withdrawal of `1.1 GEN`, confirmed by wallet balance change.

The complete addresses, transaction hashes, finalized timestamps, verdicts,
state snapshots, accounting, and balance evidence are in
[deployment.json](docs/evidence/studionet/deployment.json).

## Why GenLayer is required

An interface can still return HTTP 200 and schema-valid data while silently
changing the meaning of a field, unit, method, tool instruction, or error
behavior. The provider benefits from calling the release compatible; the
integrator may benefit from calling it breaking. A signed database records who
wrote a claim, but it cannot neutrally adjudicate that conflict.

The contract does not accept a precomputed score or verdict. Validators fetch
the configured evidence and perform the semantic decision inside GenVM. The
consensus result controls on-chain state, value settlement, and consumer
enforcement.

## Architecture

```text
Provider + Integrator
        │
        │ guarantees, source rules, GEN bonds
        ▼
SemanticInterfaceCovenant
        │
        ├── validators fetch public evidence
        ├── equivalence over critical verdict fields
        ├── binding state + settlement
        │
        └── finalized on_covenant_status message
                         │
                         ▼
                   ToolRouterGuard
                         │
                         └── allow or reject protected route
```

The reusable consumer surface is intentionally small:

```text
get_binding_status(binding_id)
```

or:

```text
on_covenant_status(binding_id, verdict_id, new_status)
```

See [INTEGRATION.md](docs/INTEGRATION.md)
for the pull, push, settlement, and fail-closed integration patterns.

## Repository layout

```text
contracts/
  semantic_interface_covenant.py   # reusable primitive
  tool_router_guard.py             # reference enforcement consumer
tests/direct/
  test_semantic_interface_covenant.py
  test_tool_router_guard.py
frontend/
  app/page.tsx                     # project landing page
  app/covenant/page.tsx            # real read/write workbench
scripts/
  deploy-idea001-studionet.mjs     # resumable two-wallet lifecycle
docs/
  README.md                        # specification and threat model
  INTEGRATION.md                   # builder integration guide
  SUBMISSION.md                    # reviewer-facing explanation
  DEPLOYMENT.md                    # deployment and evidence runbook
  evidence/studionet/              # network-specific real evidence
```

## Setup

Requirements:

- Node.js 22;
- Python 3.12;
- PowerShell;
- `uv`;
- GenLayer CLI.

From the repository root on Windows:

```powershell
npm run setup
```

Or install manually:

```powershell
uv venv --python 3.12 .venv
uv pip install --python .venv\Scripts\python.exe -r requirements.lock
npm install
npm run check
```

`npm run check`:

1. validates every contract with `genvm-lint`;
2. runs all direct-mode tests;
3. typechecks the frontend;
4. creates a production Next.js build.

## Frontend

Copy public configuration:

```powershell
Copy-Item frontend\.env.example frontend\.env
npm run dev
```

Open:

- landing page: `http://localhost:3000`;
- covenant workbench: `http://localhost:3000/covenant`.

The workbench reads canonical contract state and implements the real transaction
lifecycle:

```text
SUBMITTING → SUBMITTED → DECIDED → FINALIZED → READING_STATE → COMPLETE
```

It does not use localStorage or static transaction hashes as on-chain state.

## Deployment and live lifecycle

Root `.env` is Git-ignored. Never commit real values:

```dotenv
STUDIONET_PRIVATE_KEY=
STUDIONET_INTEGRATOR_PRIVATE_KEY=
```

The provider and integrator keys must represent different accounts.

Available commands:

```powershell
node scripts/deploy-idea001-studionet.mjs inspect
node scripts/deploy-idea001-studionet.mjs deploy-primitive
node scripts/deploy-idea001-studionet.mjs deploy-guard
node scripts/deploy-idea001-studionet.mjs setup-provider
node scripts/deploy-idea001-studionet.mjs fund-integrator
node scripts/deploy-idea001-studionet.mjs run-demo
```

The script resumes from the recorded evidence instead of blindly replaying
already-finalized value-bearing transactions.

## Documentation

- [Full specification and threat model](docs/README.md)
- [Implementation status](docs/IMPLEMENTATION.md)
- [Builder integration guide](docs/INTEGRATION.md)
- [Submission notes](docs/SUBMISSION.md)
- [Deployment runbook](docs/DEPLOYMENT.md)

## Scope honesty

- The full contract lifecycle is verified on Studionet.
- Asimov and Bradbury deployments are not claimed.
- The frontend has performed live Studionet reads. Browser-wallet write evidence
  remains explicitly pending until a MetaMask-capable browser session is
  available.
- `ToolRouterGuard` is the included reference adopter; no independent external
  adopter is claimed yet.

## License

[MIT](LICENSE)
