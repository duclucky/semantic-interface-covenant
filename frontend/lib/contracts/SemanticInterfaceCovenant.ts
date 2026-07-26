import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import {
  estimateWriteFeePreset,
  feePresetToTransactionFees,
} from "../genlayer/fees";

export type LifecycleStage =
  | "SUBMITTING"
  | "SUBMITTED"
  | "DECIDED"
  | "FINALIZED"
  | "READING_STATE"
  | "COMPLETE"
  | "FAILED";

export interface LifecycleUpdate {
  stage: LifecycleStage;
  hash?: string;
  message: string;
}

export interface CovenantRecord {
  id: string;
  provider: string;
  version: string;
  title: string;
  interface_kind: string;
  default_service_credit: string;
  minimum_challenge_bond: string;
  guarantee_count: string;
  source_count: string;
  active: boolean;
  deprecated: boolean;
}

export interface BindingRecord {
  id: string;
  covenant_id: string;
  provider: string;
  integrator: string;
  authorized_watcher: string;
  subscriber_contract: string;
  provider_bond: string;
  minimum_challenge_bond: string;
  service_credit: string;
  status: string;
  active_case_id: string;
  active_cure_id: string;
  case_count: string;
  accepted: boolean;
  closed: boolean;
}

export interface CaseRecord {
  id: string;
  binding_id: string;
  opened_by: string;
  claim_summary: string;
  challenge_bond: string;
  status: string;
  observation_count: string;
  verdict_id: string;
  bond_settled: boolean;
}

export interface VerdictRecord {
  id: string;
  case_id: string;
  compatibility_class: string;
  severity_band: string;
  source_coverage: string;
  required_action: string;
  rationale: string;
  violated_guarantee_count: string;
  settlement_amount: string;
  previous_binding_status: string;
  new_binding_status: string;
}

type LifecycleCallback = (update: LifecycleUpdate) => void;

function normalizeContractValue(value: unknown): unknown {
  if (value instanceof Map) {
    return Object.fromEntries(
      Array.from(value.entries()).map(([key, item]) => [
        String(key),
        normalizeContractValue(item),
      ]),
    );
  }
  if (Array.isArray(value)) {
    return value.map(normalizeContractValue);
  }
  if (typeof value === "bigint") {
    return value.toString();
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        normalizeContractValue(item),
      ]),
    );
  }
  return value;
}

function asRecord<T>(value: unknown): T {
  return normalizeContractValue(value) as T;
}

export class SemanticInterfaceCovenantClient {
  private readonly address: `0x${string}`;
  private readonly client: any;

  constructor(
    contractAddress: string,
    account?: string | null,
    endpoint?: string,
  ) {
    if (!/^0x[0-9a-fA-F]{40}$/.test(contractAddress)) {
      throw new Error("Invalid SemanticInterfaceCovenant address");
    }
    this.address = contractAddress as `0x${string}`;
    const config: any = { chain: studionet };
    if (account) {
      config.account = account as `0x${string}`;
    }
    if (endpoint) {
      config.endpoint = endpoint;
    }
    this.client = createClient(config);
  }

  private async read<T>(functionName: string, args: unknown[]): Promise<T> {
    const value = await this.client.readContract({
      address: this.address,
      functionName,
      args,
    });
    return asRecord<T>(value);
  }

  async getCovenant(covenantId: string): Promise<CovenantRecord> {
    return this.read<CovenantRecord>("get_covenant", [covenantId]);
  }

  async getBinding(bindingId: string): Promise<BindingRecord> {
    return this.read<BindingRecord>("get_binding", [bindingId]);
  }

  async getCase(caseId: string): Promise<CaseRecord> {
    return this.read<CaseRecord>("get_case", [caseId]);
  }

  async getVerdict(verdictId: string): Promise<VerdictRecord> {
    return this.read<VerdictRecord>("get_verdict", [verdictId]);
  }

  async getVerdictViolations(verdictId: string): Promise<string[]> {
    return this.read<string[]>("get_verdict_violations", [verdictId]);
  }

  async getAccountCredit(account: string): Promise<string> {
    const value = await this.read<string>("get_account_credit", [account]);
    return String(value);
  }

  async waitForFinalized(
    hash: string,
    onLifecycle: LifecycleCallback,
  ): Promise<void> {
    onLifecycle({
      stage: "DECIDED",
      hash,
      message: "Transaction decided; waiting for the appeal window and finality.",
    });
    await this.client.waitForTransactionReceipt({
      hash,
      status: "FINALIZED",
      retries: 120,
      interval: 5000,
      fullTransaction: true,
    });
    onLifecycle({
      stage: "FINALIZED",
      hash,
      message: "Transaction finalized on GenLayer.",
    });
  }

  async writeFinalized(
    functionName: string,
    args: unknown[],
    value: bigint,
    onLifecycle: LifecycleCallback,
  ): Promise<string> {
    try {
      onLifecycle({
        stage: "SUBMITTING",
        message: "Requesting wallet signature and submitting transaction.",
      });
      const preset = await estimateWriteFeePreset(
        this.client,
        {
          address: this.address,
          functionName,
          args,
          value,
        },
        "standard",
      );
      const fees = feePresetToTransactionFees(preset);
      const hash = await this.client.writeContract({
        address: this.address,
        functionName,
        args,
        value,
        ...(fees ? { fees } : {}),
      });
      onLifecycle({
        stage: "SUBMITTED",
        hash,
        message: "Signed transaction submitted; waiting for validator decision.",
      });
      await this.client.waitForTransactionReceipt({
        hash,
        status: "ACCEPTED",
        retries: 48,
        interval: 5000,
        fullTransaction: true,
      });
      await this.waitForFinalized(hash, onLifecycle);
      return hash;
    } catch (error) {
      onLifecycle({
        stage: "FAILED",
        message:
          error instanceof Error ? error.message : "Transaction lifecycle failed.",
      });
      throw error;
    }
  }
}

export function getCovenantContractAddress(): string {
  return process.env.NEXT_PUBLIC_COVENANT_CONTRACT_ADDRESS || "";
}
