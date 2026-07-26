"use client";

import { useMemo, useState } from "react";
import { formatEther, parseEther } from "viem";
import { AccountPanel } from "@/components/AccountPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getCovenantContractAddress,
  type BindingRecord,
  type CaseRecord,
  type CovenantRecord,
  type LifecycleUpdate,
  SemanticInterfaceCovenantClient,
  type VerdictRecord,
} from "@/lib/contracts/SemanticInterfaceCovenant";
import { getStudioUrl } from "@/lib/genlayer/client";
import { useWallet } from "@/lib/genlayer/wallet";

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="space-y-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <Input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function RecordCard({
  title,
  record,
}: {
  title: string;
  record: Record<string, unknown> | null;
}) {
  return (
    <section className="brand-card p-5">
      <h3 className="mb-4 text-lg font-semibold">{title}</h3>
      {record ? (
        <dl className="grid gap-2 text-sm">
          {Object.entries(record).map(([key, value]) => (
            <div
              key={key}
              className="grid grid-cols-[minmax(8rem,0.45fr)_1fr] gap-3 border-b border-white/5 py-1.5"
            >
              <dt className="text-muted-foreground">{key}</dt>
              <dd className="break-all font-mono text-xs">
                {typeof value === "object"
                  ? JSON.stringify(value)
                  : String(value)}
              </dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="text-sm text-muted-foreground">
          Read this record from the deployed contract. No local placeholder is
          used.
        </p>
      )}
    </section>
  );
}

function TransactionLifecycle({
  updates,
  resumeHash,
  setResumeHash,
  onResume,
  busy,
}: {
  updates: LifecycleUpdate[];
  resumeHash: string;
  setResumeHash: (value: string) => void;
  onResume: () => void;
  busy: boolean;
}) {
  const activeHash = [...updates].reverse().find((item) => item.hash)?.hash;
  return (
    <section className="brand-card border-primary/30 p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-accent">
            Real transaction lifecycle
          </p>
          <h2 className="text-xl font-semibold">Submitted → Decided → Finalized</h2>
        </div>
        {activeHash ? (
          <code className="max-w-md break-all rounded bg-black/30 px-3 py-2 text-xs">
            {activeHash}
          </code>
        ) : null}
      </div>
      {updates.length > 0 ? (
        <ol className="mb-4 grid gap-2">
          {updates.map((update, index) => (
            <li
              key={`${update.stage}-${index}`}
              className="flex gap-3 rounded border border-white/10 bg-black/20 p-3"
            >
              <span
                className={`mt-1 size-2 shrink-0 rounded-full ${
                  update.stage === "FAILED"
                    ? "bg-red-400"
                    : update.stage === "COMPLETE"
                      ? "bg-emerald-400"
                      : "bg-accent"
                }`}
              />
              <div>
                <p className="text-sm font-semibold">{update.stage}</p>
                <p className="text-xs text-muted-foreground">{update.message}</p>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mb-4 text-sm text-muted-foreground">
          A write action will show each real SDK lifecycle state here.
        </p>
      )}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={resumeHash}
          onChange={(event) => setResumeHash(event.target.value)}
          placeholder="Resume finality tracking with a transaction hash"
        />
        <Button
          type="button"
          variant="outline"
          disabled={busy || resumeHash.trim() === ""}
          onClick={onResume}
        >
          Resume finality
        </Button>
      </div>
    </section>
  );
}

function SectionTitle({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-5">
      <p className="text-xs uppercase tracking-[0.18em] text-accent">{eyebrow}</p>
      <h2 className="text-2xl font-semibold">{title}</h2>
      <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

export default function CovenantPage() {
  const { address } = useWallet();
  const contractAddress = getCovenantContractAddress();
  const client = useMemo(() => {
    if (!contractAddress) return null;
    try {
      return new SemanticInterfaceCovenantClient(
        contractAddress,
        address,
        getStudioUrl(),
      );
    } catch {
      return null;
    }
  }, [address, contractAddress]);

  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [lifecycle, setLifecycle] = useState<LifecycleUpdate[]>([]);
  const [resumeHash, setResumeHash] = useState("");

  const [covenantId, setCovenantId] = useState(
    "genlayer-js-calldata-v1",
  );
  const [version, setVersion] = useState("1.0.0");
  const [title, setTitle] = useState(
    "GenLayer JavaScript SDK calldata compatibility",
  );
  const [interfaceKind, setInterfaceKind] = useState("API");
  const [serviceCredit, setServiceCredit] = useState("1");
  const [challengeBond, setChallengeBond] = useState("0.1");
  const [guaranteeId, setGuaranteeId] = useState("method-key");
  const [guaranteeStatement, setGuaranteeStatement] = useState(
    "Studionet contract calls encode the public method name under the string key method.",
  );
  const [criticality, setCriticality] = useState("REQUIRED");
  const [evidenceHint, setEvidenceHint] = useState(
    "Compare the stable and candidate official calldata encoders.",
  );
  const [sourceId, setSourceId] = useState("stable-encoder");
  const [sourceUrl, setSourceUrl] = useState(
    "https://raw.githubusercontent.com/genlayerlabs/genlayer-js/a76bec395aaa927720ee0ce364899a64044dd43e/src/abi/calldata/encoder.ts",
  );
  const [sourceKind, setSourceKind] = useState("OFFICIAL_SOURCE_CODE");

  const [bindingId, setBindingId] = useState("binding-1");
  const [integrator, setIntegrator] = useState("");
  const [watcher, setWatcher] = useState("");
  const [subscriber, setSubscriber] = useState("");
  const [providerBond, setProviderBond] = useState("2");

  const [caseId, setCaseId] = useState("case-calldata-method-key");
  const [claimSummary, setClaimSummary] = useState(
    "The candidate SDK replaces the current method dispatch key with an empty string.",
  );
  const [observationId, setObservationId] = useState(
    "candidate-v2-encoder",
  );
  const [observationUrl, setObservationUrl] = useState(
    "https://raw.githubusercontent.com/genlayerlabs/genlayer-js/50a936c4f0e436739851c8a4c47badcdd8c588dd/src/abi/calldata/encoder.ts",
  );

  const [cureId, setCureId] = useState("cure-calldata-method-key");
  const [parentVerdictId, setParentVerdictId] = useState(
    "verdict-case-calldata-method-key",
  );
  const [cureSourceId, setCureSourceId] = useState(
    "restored-stable-encoder",
  );
  const [cureUrl, setCureUrl] = useState(
    "https://raw.githubusercontent.com/genlayerlabs/genlayer-js/a76bec395aaa927720ee0ce364899a64044dd43e/src/abi/calldata/encoder.ts",
  );
  const [topUpAmount, setTopUpAmount] = useState("1");
  const [withdrawAmount, setWithdrawAmount] = useState("1.1");

  const [covenant, setCovenant] = useState<CovenantRecord | null>(null);
  const [binding, setBinding] = useState<BindingRecord | null>(null);
  const [caseRecord, setCaseRecord] = useState<CaseRecord | null>(null);
  const [verdict, setVerdict] = useState<VerdictRecord | null>(null);
  const [violations, setViolations] = useState<string[]>([]);
  const [credit, setCredit] = useState<string>("");

  const onLifecycle = (update: LifecycleUpdate) => {
    setLifecycle((current) => [...current, update]);
    if (update.hash) setResumeHash(update.hash);
  };

  const requireClient = () => {
    if (!client) {
      throw new Error(
        "Set NEXT_PUBLIC_COVENANT_CONTRACT_ADDRESS to a deployed contract.",
      );
    }
    return client;
  };

  const requireWrite = () => {
    const activeClient = requireClient();
    if (!address) {
      throw new Error("Connect a wallet before sending a transaction.");
    }
    return activeClient;
  };

  const refreshCovenant = async () => {
    const value = await requireClient().getCovenant(covenantId);
    setCovenant(value);
  };

  const refreshBinding = async () => {
    const value = await requireClient().getBinding(bindingId);
    setBinding(value);
  };

  const refreshCase = async () => {
    const activeClient = requireClient();
    const value = await activeClient.getCase(caseId);
    setCaseRecord(value);
    if (value.verdict_id) {
      const [verdictValue, violationIds] = await Promise.all([
        activeClient.getVerdict(value.verdict_id),
        activeClient.getVerdictViolations(value.verdict_id),
      ]);
      setVerdict(verdictValue);
      setViolations(violationIds);
      setParentVerdictId(value.verdict_id);
    }
  };

  const refreshCredit = async () => {
    if (!address) return;
    setCredit(await requireClient().getAccountCredit(address));
  };

  const refreshAll = async () => {
    const tasks: Promise<unknown>[] = [];
    if (covenantId) tasks.push(refreshCovenant());
    if (bindingId) tasks.push(refreshBinding());
    if (caseId) tasks.push(refreshCase());
    if (address) tasks.push(refreshCredit());
    await Promise.allSettled(tasks);
  };

  const execute = async (
    functionName: string,
    args: unknown[],
    value = 0n,
    after?: () => Promise<void>,
  ) => {
    setBusy(true);
    setErrorMessage("");
    setLifecycle([]);
    try {
      const activeClient = requireWrite();
      await activeClient.writeFinalized(
        functionName,
        args,
        value,
        onLifecycle,
      );
      onLifecycle({
        stage: "READING_STATE",
        message: "Reading the resulting state back from the contract.",
      });
      if (after) {
        await after();
      } else {
        await refreshAll();
      }
      onLifecycle({
        stage: "COMPLETE",
        message: "Finalized transaction and onchain state read are complete.",
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "The action failed.",
      );
    } finally {
      setBusy(false);
    }
  };

  const resumeFinality = async () => {
    setBusy(true);
    setErrorMessage("");
    setLifecycle([]);
    try {
      const activeClient = requireClient();
      await activeClient.waitForFinalized(resumeHash.trim(), onLifecycle);
      onLifecycle({
        stage: "READING_STATE",
        hash: resumeHash.trim(),
        message: "Finality confirmed; reading contract state.",
      });
      await refreshAll();
      onLifecycle({
        stage: "COMPLETE",
        hash: resumeHash.trim(),
        message: "Finalized transaction and state refresh complete.",
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Could not resume finality.",
      );
    } finally {
      setBusy(false);
    }
  };

  const readAction = async (action: () => Promise<void>) => {
    setBusy(true);
    setErrorMessage("");
    try {
      await action();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Onchain read failed.",
      );
    } finally {
      setBusy(false);
    }
  };

  const writeDisabled = busy || !client || !address;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">
          <div>
            <a href="/" className="text-sm text-muted-foreground hover:text-white">
              ← Workspace
            </a>
            <h1 className="text-lg font-semibold">Semantic Interface Covenant</h1>
          </div>
          <AccountPanel context="covenant" />
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-8 px-4 py-8 md:px-6">
        <section className="overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-br from-primary/15 via-black/30 to-blue-950/30 p-6 md:p-9">
          <p className="text-xs uppercase tracking-[0.22em] text-accent">
            IDEA-001 · Intelligent Contract workbench
          </p>
          <h2 className="mt-3 max-w-4xl text-3xl font-bold md:text-5xl">
            Quarantine an API or agent tool when its meaning changes—not only
            when it goes offline.
          </h2>
          <p className="mt-4 max-w-3xl text-muted-foreground">
            Provider and integrator lock semantic guarantees and GEN bonds.
            Validators inspect public evidence. The finalized verdict changes
            binding state, settlement and subscriber enforcement.
          </p>
          <div className="mt-6 grid gap-3 text-sm md:grid-cols-3">
            <div className="rounded-lg border border-white/10 bg-black/25 p-4">
              <p className="font-semibold">Contract address</p>
              <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
                {contractAddress || "NOT CONFIGURED"}
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/25 p-4">
              <p className="font-semibold">Wallet</p>
              <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
                {address || "Connect to write"}
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/25 p-4">
              <p className="font-semibold">Truth source</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Every displayed record below is read from the configured
                contract.
              </p>
            </div>
          </div>
        </section>

        {!contractAddress ? (
          <section className="rounded-lg border border-amber-400/40 bg-amber-400/10 p-5 text-sm">
            Set <code>NEXT_PUBLIC_COVENANT_CONTRACT_ADDRESS</code> to a real
            deployed address. The page intentionally does not fabricate a
            contract, transaction hash or localStorage state.
          </section>
        ) : null}

        {errorMessage ? (
          <section className="rounded-lg border border-red-400/40 bg-red-400/10 p-4 text-sm text-red-100">
            {errorMessage}
          </section>
        ) : null}

        <TransactionLifecycle
          updates={lifecycle}
          resumeHash={resumeHash}
          setResumeHash={setResumeHash}
          onResume={resumeFinality}
          busy={busy}
        />

        <section>
          <SectionTitle
            eyebrow="Onchain reads"
            title="Inspect canonical state"
            description="These buttons call view methods on the deployed contract. Failed reads remain visible instead of falling back to static demo data."
          />
          <div className="mb-5 grid gap-3 md:grid-cols-3">
            <div className="flex gap-2">
              <Input value={covenantId} onChange={(e) => setCovenantId(e.target.value)} />
              <Button
                variant="outline"
                disabled={busy || !client}
                onClick={() => readAction(refreshCovenant)}
              >
                Read covenant
              </Button>
            </div>
            <div className="flex gap-2">
              <Input value={bindingId} onChange={(e) => setBindingId(e.target.value)} />
              <Button
                variant="outline"
                disabled={busy || !client}
                onClick={() => readAction(refreshBinding)}
              >
                Read binding
              </Button>
            </div>
            <div className="flex gap-2">
              <Input value={caseId} onChange={(e) => setCaseId(e.target.value)} />
              <Button
                variant="outline"
                disabled={busy || !client}
                onClick={() => readAction(refreshCase)}
              >
                Read case
              </Button>
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <RecordCard title="Covenant" record={covenant as unknown as Record<string, unknown>} />
            <RecordCard title="Binding" record={binding as unknown as Record<string, unknown>} />
            <RecordCard title="Case" record={caseRecord as unknown as Record<string, unknown>} />
            <RecordCard
              title={`Verdict${violations.length ? ` · ${violations.join(", ")}` : ""}`}
              record={verdict as unknown as Record<string, unknown>}
            />
          </div>
        </section>

        <section className="brand-card p-6">
          <SectionTitle
            eyebrow="Provider setup"
            title="Create and activate a versioned covenant"
            description="Configuration is split into explicit transactions. Once activated, guarantees and source rules are immutable for this version."
          />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Field label="Covenant ID" value={covenantId} onChange={setCovenantId} />
            <Field label="Version" value={version} onChange={setVersion} />
            <Field label="Title" value={title} onChange={setTitle} />
            <Field label="Interface kind" value={interfaceKind} onChange={setInterfaceKind} />
            <Field label="Service credit (GEN)" value={serviceCredit} onChange={setServiceCredit} />
            <Field label="Challenge bond (GEN)" value={challengeBond} onChange={setChallengeBond} />
          </div>
          <div className="mt-4">
            <Button
              disabled={writeDisabled}
              onClick={() =>
                execute(
                  "create_covenant",
                  [
                    covenantId,
                    version,
                    title,
                    interfaceKind,
                    parseEther(serviceCredit),
                    parseEther(challengeBond),
                  ],
                  0n,
                  refreshCovenant,
                )
              }
            >
              1. Create covenant
            </Button>
          </div>

          <div className="my-6 border-t border-white/10" />
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Guarantee ID" value={guaranteeId} onChange={setGuaranteeId} />
            <Field label="Criticality" value={criticality} onChange={setCriticality} />
            <Field label="Guarantee statement" value={guaranteeStatement} onChange={setGuaranteeStatement} />
            <Field label="Evidence hint" value={evidenceHint} onChange={setEvidenceHint} />
          </div>
          <Button
            className="mt-4"
            variant="secondary"
            disabled={writeDisabled}
            onClick={() =>
              execute(
                "add_guarantee",
                [covenantId, guaranteeId, guaranteeStatement, criticality, evidenceHint],
                0n,
                refreshCovenant,
              )
            }
          >
            2. Add guarantee
          </Button>

          <div className="my-6 border-t border-white/10" />
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Source ID" value={sourceId} onChange={setSourceId} />
            <Field label="HTTPS source prefix" value={sourceUrl} onChange={setSourceUrl} />
            <Field label="Source kind" value={sourceKind} onChange={setSourceKind} />
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              variant="secondary"
              disabled={writeDisabled}
              onClick={() =>
                execute(
                  "add_source_rule",
                  [covenantId, sourceId, sourceUrl, sourceKind, true],
                  0n,
                  refreshCovenant,
                )
              }
            >
              3. Add required source
            </Button>
            <Button
              variant="gradient"
              disabled={writeDisabled}
              onClick={() =>
                execute("activate_covenant", [covenantId], 0n, refreshCovenant)
              }
            >
              4. Activate and lock
            </Button>
          </div>
        </section>

        <section className="brand-card p-6">
          <SectionTitle
            eyebrow="Bilateral binding"
            title="Fund, offer and explicitly accept"
            description="Provider posts the bond. The designated integrator must accept from its own wallet before the binding becomes active."
          />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Field label="Binding ID" value={bindingId} onChange={setBindingId} />
            <Field label="Integrator address" value={integrator} onChange={setIntegrator} placeholder="0x…" />
            <Field label="Provider bond (GEN)" value={providerBond} onChange={setProviderBond} />
            <Field label="Authorized watcher (optional)" value={watcher} onChange={setWatcher} placeholder="0x…" />
            <Field label="Subscriber contract (optional)" value={subscriber} onChange={setSubscriber} placeholder="ToolRouterGuard address" />
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              disabled={writeDisabled || integrator.trim() === ""}
              onClick={() =>
                execute(
                  "offer_binding",
                  [bindingId, covenantId, integrator, watcher, subscriber],
                  parseEther(providerBond),
                  refreshBinding,
                )
              }
            >
              Provider: offer + bond
            </Button>
            <Button
              variant="secondary"
              disabled={writeDisabled}
              onClick={() =>
                execute("accept_binding", [bindingId], 0n, refreshBinding)
              }
            >
              Integrator: accept
            </Button>
          </div>
        </section>

        <section className="brand-card p-6">
          <SectionTitle
            eyebrow="Incident adjudication"
            title="Open evidence case and let validators decide"
            description="The frontend sends stable IDs, claim text and allowlisted URLs. It does not compute or submit a verdict."
          />
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Case ID" value={caseId} onChange={setCaseId} />
            <Field label="Challenge bond (GEN)" value={challengeBond} onChange={setChallengeBond} />
            <Field label="Claim summary" value={claimSummary} onChange={setClaimSummary} />
            <Field label="Observation ID" value={observationId} onChange={setObservationId} />
            <Field label="Observation URL" value={observationUrl} onChange={setObservationUrl} />
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              disabled={writeDisabled}
              onClick={() =>
                execute(
                  "open_case",
                  [caseId, bindingId, claimSummary],
                  parseEther(challengeBond),
                  refreshCase,
                )
              }
            >
              1. Open bonded case
            </Button>
            <Button
              variant="secondary"
              disabled={writeDisabled}
              onClick={() =>
                execute(
                  "add_case_observation",
                  [caseId, observationId, observationUrl],
                  0n,
                  refreshCase,
                )
              }
            >
              2. Add observation
            </Button>
            <Button
              variant="gradient"
              disabled={writeDisabled}
              onClick={() =>
                execute("adjudicate_case", [caseId], 0n, async () => {
                  await Promise.all([refreshCase(), refreshBinding(), refreshCredit()]);
                })
              }
            >
              3. Validator adjudication
            </Button>
          </div>
        </section>

        <section className="brand-card p-6">
          <SectionTitle
            eyebrow="Recovery and value"
            title="Cure, top up and withdraw finalized credit"
            description="A quarantined provider must submit public cure evidence and maintain enough bond before validators can restore ACTIVE."
          />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Field label="Cure ID" value={cureId} onChange={setCureId} />
            <Field label="Parent verdict ID" value={parentVerdictId} onChange={setParentVerdictId} />
            <Field label="Cure source ID" value={cureSourceId} onChange={setCureSourceId} />
            <Field label="Cure URL" value={cureUrl} onChange={setCureUrl} />
            <Field label="Top-up (GEN)" value={topUpAmount} onChange={setTopUpAmount} />
            <Field label="Withdraw (GEN)" value={withdrawAmount} onChange={setWithdrawAmount} />
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button
              variant="secondary"
              disabled={writeDisabled}
              onClick={() =>
                execute(
                  "submit_cure",
                  [cureId, bindingId, parentVerdictId],
                  0n,
                  refreshBinding,
                )
              }
            >
              Submit cure
            </Button>
            <Button
              variant="secondary"
              disabled={writeDisabled}
              onClick={() =>
                execute(
                  "add_cure_source",
                  [cureId, cureSourceId, cureUrl],
                  0n,
                )
              }
            >
              Add cure evidence
            </Button>
            <Button
              variant="secondary"
              disabled={writeDisabled}
              onClick={() =>
                execute(
                  "top_up_binding",
                  [bindingId],
                  parseEther(topUpAmount),
                  refreshBinding,
                )
              }
            >
              Top up bond
            </Button>
            <Button
              variant="gradient"
              disabled={writeDisabled}
              onClick={() =>
                execute("adjudicate_cure", [cureId], 0n, refreshBinding)
              }
            >
              Adjudicate cure
            </Button>
            <Button
              variant="outline"
              disabled={writeDisabled}
              onClick={() =>
                execute(
                  "withdraw_credit",
                  [parseEther(withdrawAmount)],
                  0n,
                  refreshCredit,
                )
              }
            >
              Withdraw credit
            </Button>
          </div>
          <div className="mt-5 rounded border border-white/10 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Onchain withdrawable credit
            </p>
            <p className="mt-1 font-mono text-lg">
              {credit
                ? `${formatEther(BigInt(credit))} GEN`
                : address
                  ? "Not read yet"
                  : "Connect wallet"}
            </p>
            <Button
              className="mt-3"
              size="sm"
              variant="ghost"
              disabled={busy || !client || !address}
              onClick={() => readAction(refreshCredit)}
            >
              Refresh credit from contract
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
}
