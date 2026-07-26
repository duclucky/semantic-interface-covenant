# Semantic Interface Covenant — Submission Notes

## What the project does

`SemanticInterfaceCovenant` lets an API, MCP server, or agent-tool provider
publish a versioned set of behavioral guarantees and approved public evidence
sources. A specific integrator accepts that covenant, while both sides lock GEN
bonds.

If the interface later changes, the integrator or an authorized watcher opens a
case with an allowlisted public URL. GenLayer validators fetch the baseline and
candidate evidence and decide whether the change is `COMPATIBLE`, `DEGRADED`,
`BREAKING`, or `UNVERIFIABLE`. A finalized verdict changes the binding state,
settles real bonded value, and notifies a subscribed consumer contract.

The included `ToolRouterGuard` demonstrates the enforcement path: a breaking
verdict changes it to `QUARANTINED`, so it rejects protected tool routes. A
successful cure verdict restores routing.

## Trust problem it solves

An interface can still return HTTP 200 and valid JSON while silently changing
the meaning of a field, method, unit, tool instruction, or error behavior. The
provider has an incentive to call the change compatible; the integrator has an
incentive to call it breaking and claim compensation. A schema diff, signed
database, or one party's LLM cannot resolve that conflict.

GenLayer is used for the decision that matters: validators independently fetch
public evidence and reach semantic consensus. Their result directly controls
quarantine, restoration, bond settlement, subscriber state, and routing. The
contract does not accept a precomputed verdict or an opaque JSON score.

## Concrete Studionet proof

Network: Studionet, chain ID `61999`.

- Primitive:
  [`0x05b27207c7aC50d22E5C1afBfD3c20DBccCa0570`](https://explorer-studio.genlayer.com/address/0x05b27207c7aC50d22E5C1afBfD3c20DBccCa0570)
- Consumer guard:
  [`0xA58132c068E0406E2d5d43E8b72E2b2361ac057D`](https://explorer-studio.genlayer.com/address/0xA58132c068E0406E2d5d43E8b72E2b2361ac057D)
- Primitive deployment:
  [`0xd6cc527f3e0382c41da91e235d969b632bcb023a082bae8c6e1e921c22b48a47`](https://explorer-studio.genlayer.com/tx/0xd6cc527f3e0382c41da91e235d969b632bcb023a082bae8c6e1e921c22b48a47)
- Guard deployment:
  [`0x972bdc31463fe87b9cb633e0739c1357b41f9c23e043490ebd8c05c4234f1b8e`](https://explorer-studio.genlayer.com/tx/0x972bdc31463fe87b9cb633e0739c1357b41f9c23e043490ebd8c05c4234f1b8e)
- Provider and integrator used two different EOAs.
- Provider locked `2 GEN`; the case opener locked `0.1 GEN`.
- Validators compared two public, commit-pinned `genlayer-js` encoder sources.
- The breaking adjudication finalized as
  `BREAKING / CRITICAL / SUFFICIENT`, violating guarantee `method-key`.
- The binding and guard changed
  `ACTIVE → QUARANTINED`; the guard changed `can_route=true → false`.
- `1 GEN` of service credit was settled to the integrator.
- Validators later finalized the cure as `CURED`; the binding and guard returned
  to `ACTIVE`, and routing resumed.
- The integrator withdrew `1.1 GEN`; its wallet balance changed from
  `9.9 GEN` to `11 GEN`, and its contract credit returned to zero.

All deployment transactions, lifecycle transactions, finalized timestamps,
verdict data, state snapshots, accounting, and balance evidence are recorded in
[evidence/studionet/deployment.json](evidence/studionet/deployment.json).

## How to use it

For providers:

1. Create a versioned covenant with a service-credit amount and minimum
   challenge bond.
2. Add stable guarantee IDs and natural-language statements.
3. Add bounded HTTPS evidence-source rules.
4. Activate the covenant; its guarantees and sources are then locked.
5. Offer a binding to a named integrator and fund the provider bond.

For integrators:

1. Review and accept the offered binding from the designated wallet.
2. Read `get_binding_status(binding_id)` before using the protected interface,
   or subscribe a consumer contract implementing `on_covenant_status`.
3. If behavior changes, open a bonded case and add allowlisted evidence.
4. Call `adjudicate_case`; validators, not the frontend, decide the verdict.
5. Withdraw any finalized settlement credit.

For consumer contracts:

- use the pull interface `get_binding_status(binding_id)`; or
- implement the push callback
  `on_covenant_status(binding_id, verdict_id, new_status)`;
- fail closed on `QUARANTINED` and choose an explicit policy for `DEGRADED`.

The focused builder guide is
[INTEGRATION.md](INTEGRATION.md). The full state model and security boundaries
are in [README.md](README.md).

## Repository map

- Primitive contract:
  `contracts/semantic_interface_covenant.py`
- Example consumer:
  `contracts/tool_router_guard.py`
- Direct tests:
  `tests/direct/test_semantic_interface_covenant.py` and
  `tests/direct/test_tool_router_guard.py`
- Real Studionet deployment/demo script:
  `scripts/deploy-idea001-studionet.mjs`
- Frontend client:
  `frontend/lib/contracts/SemanticInterfaceCovenant.ts`
- Full read/write workbench:
  `frontend/app/covenant/page.tsx`

## Verification

`npm run check` verifies every contract with `genvm-lint`, runs the direct-mode
test suite, checks frontend TypeScript, and produces a Next.js production
build.

The last completed verification on 2026-07-26 passed with 21 direct tests, no
failures or expected failures, two lint-clean project contracts, a clean
TypeScript check, and a successful production build.

## Honest limits

- Studionet contract lifecycle is verified; Asimov and Bradbury are not claimed.
- The frontend has read the deployed covenant, binding, case, and verdict from
  Studionet. A browser-wallet write remains pending until a Chrome session with
  the Codex connector and MetaMask is available.
- `ToolRouterGuard` is the included reusable consumer example; no independent
  external adopter is claimed yet.
- Evidence is restricted to bounded public HTTPS sources. This version is not a
  general-purpose private-data or arbitrary-web oracle.
