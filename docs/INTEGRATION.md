# Integrating Semantic Interface Covenant

This guide is for a builder who wants a contract or offchain client to stop using
an API, MCP server, or agent tool after GenLayer validators find a semantic
breaking change.

## Choose pull, push, or both

| Mode | Consumer action | Best for |
|---|---|---|
| Pull | Read `get_binding_status(binding_id)` before a sensitive action | Clients that can tolerate one view call |
| Push | Implement `on_covenant_status(binding_id, verdict_id, new_status)` | Contracts that need local, finalized enforcement state |
| Both | Accept notifications and occasionally reconcile with the view | High-value integrations that want fast enforcement plus recovery |

The allowed binding states are:

- `OFFERED`: the named integrator has not accepted yet;
- `ACTIVE`: normal operation;
- `DEGRADED`: the contract found a non-breaking impairment;
- `QUARANTINED`: a breaking change requires the consumer to stop;
- `CLOSED`: the binding no longer protects the integration.

Do not treat `OFFERED`, `QUARANTINED`, or `CLOSED` as safe. Decide explicitly
whether your product accepts `DEGRADED`; the included guard defaults to
fail-closed.

## Minimal push consumer

`ToolRouterGuard` is the runnable reference implementation. Its security rules
are the important reusable part:

1. store the covenant contract address and binding ID at deployment;
2. accept status messages only from that exact covenant address;
3. reject messages for any other binding ID;
4. make notifications idempotent by `binding_id + verdict_id`;
5. persist the new state before allowing another protected action;
6. allow only named operators to invoke the protected route;
7. reject the route unless the current policy permits the status.

The callback expected by the primitive is:

```python
@gl.public.write
def on_covenant_status(
    self,
    binding_id: str,
    verdict_id: str,
    new_status: str,
) -> bool:
    ...
```

The callback must return successfully for the subscriber update to complete.
Keep it bounded and deterministic; it should enforce the already-finalized
status, not run another semantic adjudication.

## Provider lifecycle

The provider creates one immutable covenant version:

```text
create_covenant
  → add_guarantee (one or more)
  → add_source_rule (one or more)
  → activate_covenant
```

After activation, configuration is locked. A changed promise should use a new
`covenant_id` or version, not silently mutate the old one.

To protect an integration, the provider calls payable `offer_binding` with:

```text
binding_id
covenant_id
integrator_address
authorized_watcher       # optional zero address
subscriber_contract      # optional zero address
```

The attached GEN must cover at least the covenant's default service credit.
Only the named integrator can call `accept_binding`.

## Incident lifecycle

The integrator or authorized watcher runs:

```text
open_case(case_id, binding_id, claim_summary) + challenge bond
  → add_case_observation(case_id, observation_id, allowlisted_https_url)
  → adjudicate_case(case_id)
```

`adjudicate_case` performs the nondeterministic validator work. The caller does
not supply a verdict. Validators fetch the approved public sources and the case
observations, then use semantic equivalence over consensus-critical fields.

On `BREAKING`, the primitive:

- changes the binding to `QUARANTINED`;
- settles the configured service credit from provider bond to claimant credit;
- settles the challenge bond;
- emits a finalized message to the subscriber, if configured.

The provider may submit a cure, attach allowlisted cure evidence, and call
`adjudicate_cure`. A `CURED` result restores the binding and subscriber to
`ACTIVE`.

## Reading canonical state

Useful view methods:

| View | Purpose |
|---|---|
| `get_covenant(covenant_id)` | Version, provider, bond policy, counts, active/deprecated flags |
| `get_guarantees(covenant_id)` | Stable guarantee IDs, statements, criticality |
| `get_source_rules(covenant_id)` | Allowed public evidence boundaries |
| `get_binding(binding_id)` | Parties, bonds, service credit, current status and active case/cure |
| `get_binding_status(binding_id)` | Small pull-enforcement interface |
| `get_case(case_id)` | Claimant, bond, evidence count and verdict ID |
| `get_verdict(verdict_id)` | Compatibility, severity, coverage, action and settlement |
| `get_verdict_violations(verdict_id)` | Exact violated guarantee IDs |
| `get_account_credit(account)` | Withdrawable finalized credit |
| `get_accounting()` | Contract balance, locked bonds, credits |

Clients should display these reads after finalization instead of caching a
transaction hash as if it were contract state.

## Value settlement

Settlement is pull-based. The primitive records withdrawable credit only after
the verdict path settles a bond. The beneficiary then calls:

```text
withdraw_credit(amount)
```

Do not mark a reward paid from the transaction submission alone. Wait for
`FINALIZED`, read the beneficiary credit again, and verify the receiving
account balance when the product outcome depends on payment.

## Transaction lifecycle

Deployment and client code should follow the expected sequence:

```text
SUBMITTING
  → SUBMITTED
  → DECIDED
  → FINALIZED
  → READING_STATE
  → COMPLETE
```

Use the deployed contract as the display source and expose failed reads; do not
substitute cached hashes or static demo records for canonical state.

## Integration checklist

- Use a unique binding ID per provider/integrator relationship.
- Keep provider, integrator, watcher, and subscriber roles distinct.
- Use explicit, stable guarantee IDs; do not ask validators for an unconstrained
  quality score.
- Allowlist only public HTTPS evidence controlled by a credible authority.
- Pin source versions when the guarantee refers to released code or documents.
- Choose and document the `DEGRADED` policy.
- Fail closed on `QUARANTINED`.
- Make subscriber notifications idempotent.
- Re-read canonical state after finality.
- Test compatible, degraded, breaking, unverifiable, malicious-evidence, cure,
  settlement, withdrawal, and duplicate-notification paths.
