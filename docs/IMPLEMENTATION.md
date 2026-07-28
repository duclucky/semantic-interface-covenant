# IDEA-001 - Implementation Status

**Trang thai:** `VALIDATED - INTELLIGENT CONTRACTS SUBMISSION PACKAGE`

**Ngay kiem chung local gan nhat:** 2026-07-28

**Ngay kiem chung Studionet gan nhat:** 2026-07-26

**Network evidence:**
[evidence/studionet/deployment.json](evidence/studionet/deployment.json)

**Submission notes:** [SUBMISSION.md](SUBMISSION.md)

**Builder integration:** [INTEGRATION.md](INTEGRATION.md)

Day la ho so implementation contract-focused cua `SemanticInterfaceCovenant`.
Repository nay khong chua frontend, wallet UI, Next.js app, hay user-facing
product workflow.

## Source va tests

- Primitive contract:
  [contracts/semantic_interface_covenant.py](../contracts/semantic_interface_covenant.py)
- Consumer contract:
  [contracts/tool_router_guard.py](../contracts/tool_router_guard.py)
- Primitive direct tests:
  [tests/direct/test_semantic_interface_covenant.py](../tests/direct/test_semantic_interface_covenant.py)
- Consumer direct tests:
  [tests/direct/test_tool_router_guard.py](../tests/direct/test_tool_router_guard.py)

`SemanticInterfaceCovenant` has 30 public methods:

- 17 write methods;
- 13 view methods.

`ToolRouterGuard` has 8 public methods:

- 4 write methods;
- 4 view methods.

## Implemented contract behavior

- Structured per-entity storage for covenants, guarantees, source rules,
  bindings, cases, observations, verdicts, cures, and cure sources.
- Bilateral lifecycle: provider creates and locks covenant configuration,
  offers a bonded binding, and the designated integrator must accept.
- Bounded public evidence model with HTTPS allowlist checks before
  nondeterministic evaluation.
- GenLayer validator consensus in `adjudicate_case` and `adjudicate_cure`.
- Custom equivalence over meaning-bearing fields:
  compatibility class, severity band, source coverage, required action, and the
  sorted set of violated guarantee IDs.
- Bond accounting for provider bond, challenge bond, service credit, credits,
  cure top-up, and withdrawal.
- Finalized subscriber message to a consumer contract implementing
  `on_covenant_status`.
- Reference `ToolRouterGuard` that authorizes the covenant contract, applies
  idempotent status updates, and rejects protected routes while quarantined.

## Verification

Run:

```powershell
npm run check
```

The check script:

1. validates both contracts with `genvm-lint`;
2. runs `tests/direct` with pytest/genlayer-test.

Latest workspace result:

- `SemanticInterfaceCovenant`: lint pass;
- `ToolRouterGuard`: lint pass;
- 21 direct tests pass;
- no failing or xfail tests.

Coverage includes bilateral acceptance, isolation, access control, URL
boundary, bond accounting, all verdict classes, validator replay, malicious
leader fingerprint, prompt-injection output normalization, cure/top-up,
external withdrawal emission, finalized subscriber message, consumer
authorization, idempotency, and route enforcement.

## Studionet evidence

The deployed lifecycle proves:

- primitive and consumer deployment by user wallets;
- two independent EOAs signing provider/integrator actions;
- transaction lifecycle to `FINALIZED`;
- live web/LLM consensus for `BREAKING` and `CURED`;
- finalized subscriber delivery changing guard state
  `ACTIVE -> QUARANTINED -> ACTIVE`;
- route rejection during quarantine and route acceptance after cure;
- payable bond settlement and withdrawal increasing integrator balance by
  `1.1 GEN`.

Still not claimed:

- Asimov or Bradbury deployment/lifecycle;
- external adopter beyond the reference consumer.

## Known gaps

- immutable content hash/snapshot for baseline documents;
- indexer;
- external adopter;
- pagination cursor; current list views use small bounded limits;
- DNS-level anti-rebinding beyond contract-level URL validation.

If GenVM web access cannot guarantee network-level SSRF boundaries in a target
environment, live arbitrary observation should remain restricted to registered
provider domains and must not be advertised as a general-purpose web fetcher.

## Validation boundary

This repository is valid for the **Intelligent Contracts** contribution type
because it is contract-focused and excludes application frontend code. The
verified surface is the reusable primitive, its reference consumer, direct
tests, deployment script, and Studionet evidence.
