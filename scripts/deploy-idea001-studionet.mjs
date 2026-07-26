import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createAccount, createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { formatEther } from "viem";
import { generatePrivateKey } from "viem/accounts";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(SCRIPT_DIR, "..");
const ENV_PATH = path.join(ROOT_DIR, ".env");
const EVIDENCE_DIR = path.join(
  ROOT_DIR,
  "docs",
  "evidence",
  "studionet",
);
const EVIDENCE_PATH = path.join(EVIDENCE_DIR, "deployment.json");
const RPC_URL = studionet.rpcUrls.default.http[0];
const EXPLORER_URL = "https://explorer-studio.genlayer.com";
const COVENANT_ID = "genlayer-js-calldata-v1";
const BINDING_ID = "binding-1";
const SERVICE_CREDIT = 1_000_000_000_000_000_000n;
const CHALLENGE_BOND = 100_000_000_000_000_000n;
const INTEGRATOR_FUNDING = 10_000_000_000_000_000_000n;
const PROVIDER_BINDING_BOND = 2_000_000_000_000_000_000n;
const CASE_ID = "case-calldata-method-key";
const CURE_ID = "cure-calldata-method-key";
const STABLE_ENCODER_URL =
  "https://raw.githubusercontent.com/genlayerlabs/genlayer-js/" +
  "a76bec395aaa927720ee0ce364899a64044dd43e/" +
  "src/abi/calldata/encoder.ts";
const RAW_REPOSITORY_PREFIX =
  "https://raw.githubusercontent.com/genlayerlabs/genlayer-js/";
const BREAKING_ENCODER_URL =
  "https://raw.githubusercontent.com/genlayerlabs/genlayer-js/" +
  "50a936c4f0e436739851c8a4c47badcdd8c588dd/" +
  "src/abi/calldata/encoder.ts";

function loadPrivateKey(variableName = "STUDIONET_PRIVATE_KEY") {
  const content = readFileSync(ENV_PATH, "utf8");
  const entry = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.startsWith(`${variableName}=`));
  if (!entry) {
    throw new Error(`${variableName} is missing from the root .env`);
  }
  let key = entry.slice(entry.indexOf("=") + 1).trim();
  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1);
  }
  if (!/^(0x)?[0-9a-fA-F]{64}$/.test(key)) {
    throw new Error(`${variableName} is not a 32-byte hex key`);
  }
  return key.startsWith("0x") ? key : `0x${key}`;
}

function ensureIntegratorPrivateKey() {
  try {
    return { privateKey: loadPrivateKey("STUDIONET_INTEGRATOR_PRIVATE_KEY"), created: false };
  } catch (error) {
    if (!String(error?.message).includes("is missing")) {
      throw error;
    }
  }

  const privateKey = generatePrivateKey();
  const current = readFileSync(ENV_PATH, "utf8");
  const separator = current.length === 0 || current.endsWith("\n") ? "" : "\n";
  writeFileSync(
    ENV_PATH,
    `${current}${separator}STUDIONET_INTEGRATOR_PRIVATE_KEY=${privateKey}\n`,
    { encoding: "utf8", mode: 0o600 },
  );
  return { privateKey, created: true };
}

function jsonSafe(value) {
  if (typeof value === "bigint") {
    return value.toString();
  }
  if (value instanceof Map) {
    return Object.fromEntries(
      Array.from(value.entries()).map(([key, item]) => [
        String(key),
        jsonSafe(item),
      ]),
    );
  }
  if (Array.isArray(value)) {
    return value.map(jsonSafe);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, jsonSafe(item)]),
    );
  }
  return value;
}

function extractContractAddress(receipt) {
  return (
    receipt?.txDataDecoded?.contractAddress ??
    receipt?.tx_data_decoded?.contract_address ??
    receipt?.data?.contract_address ??
    receipt?.data?.contractAddress ??
    null
  );
}

function readEvidence() {
  try {
    return JSON.parse(readFileSync(EVIDENCE_PATH, "utf8"));
  } catch {
    return {};
  }
}

function writeEvidence(patch) {
  mkdirSync(EVIDENCE_DIR, { recursive: true });
  const evidence = {
    ...readEvidence(),
    network: "studionet",
    chainId: studionet.id,
    rpc: RPC_URL,
    explorer: EXPLORER_URL,
    ...patch,
  };
  writeFileSync(EVIDENCE_PATH, `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
}

async function waitForNetworkFinality(client, hash, retries = 240) {
  for (let attempt = 0; attempt < retries; attempt += 1) {
    const status = await client.request({
      method: "gen_getTransactionStatus",
      params: [hash],
    });
    if (status === "FINALIZED") {
      console.log(`FINALIZED ${hash} ${status}`);
      return status;
    }
    if (
      status === "UNDETERMINED" ||
      status === "CANCELED" ||
      status === "LEADER_TIMEOUT" ||
      status === "VALIDATORS_TIMEOUT"
    ) {
      throw new Error(`Transaction ${hash} reached terminal status ${status}`);
    }
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
  throw new Error(`Transaction ${hash} was not finalized before the timeout`);
}

async function waitForFinalized(client, hash) {
  console.log(`SUBMITTED ${hash}`);
  const decided = await client.waitForTransactionReceipt({
    hash,
    status: "ACCEPTED",
    interval: 5000,
    retries: 120,
    fullTransaction: true,
  });
  console.log(`DECIDED ${hash} ${decided.statusName ?? decided.status}`);

  // Poll the network status directly after the accepted receipt. This also
  // keeps the deployment flow aligned with native transfers, whose EVM receipt
  // can be available before GenLayer has finalized the transaction.
  const status = await waitForNetworkFinality(client, hash);
  return { ...decided, statusName: status, networkStatus: status };
}

function assertSuccessfulReceipt(receipt, operation) {
  const status = receipt?.statusName ?? String(receipt?.status);
  if (status !== "FINALIZED" && status !== "7") {
    throw new Error(`${operation} did not finalize; status=${status}`);
  }
  const execution =
    receipt?.txExecutionResultName ??
    receipt?.tx_execution_result_name ??
    receipt?.executionResultName;
  if (
    execution &&
    execution !== "FINISHED_WITH_RETURN" &&
    execution !== "SUCCESS"
  ) {
    throw new Error(`${operation} execution failed; result=${execution}`);
  }
}

async function writeContractFinalized(
  client,
  address,
  functionName,
  args,
  value = 0n,
) {
  console.log(`WRITE ${functionName}`);
  const hash = await client.writeContract({
    address,
    functionName,
    args,
    value,
  });
  const receipt = await waitForFinalized(client, hash);
  assertSuccessfulReceipt(receipt, functionName);
  return {
    transactionHash: hash,
    status: receipt.statusName ?? String(receipt.status),
    finalizedAt: new Date().toISOString(),
  };
}

async function inspectWallet(client, account) {
  const [balanceHex, chainHex] = await Promise.all([
    client.request({
      method: "eth_getBalance",
      params: [account.address, "latest"],
    }),
    client.request({ method: "eth_chainId", params: [] }),
  ]);
  const result = {
    address: account.address,
    balanceWei: BigInt(balanceHex).toString(),
    chainId: Number(BigInt(chainHex)),
    rpc: RPC_URL,
  };
  console.log(JSON.stringify(result));
  return result;
}

async function getBalance(client, address) {
  const balanceHex = await client.request({
    method: "eth_getBalance",
    params: [address, "latest"],
  });
  return BigInt(balanceHex);
}

async function fundIntegrator(client, providerAccount) {
  const evidence = readEvidence();
  const { privateKey, created } = ensureIntegratorPrivateKey();
  const integratorAccount = createAccount(privateKey);
  if (
    integratorAccount.address.toLowerCase() === providerAccount.address.toLowerCase()
  ) {
    throw new Error("Integrator wallet must differ from the provider wallet");
  }

  const balanceBefore = await getBalance(client, integratorAccount.address);
  let funding = evidence?.integrator?.funding;
  if (balanceBefore < INTEGRATOR_FUNDING && !funding?.transactionHash) {
    const nonce = await client.getCurrentNonce({
      address: providerAccount.address,
    });
    const transactionRequest = await client.prepareTransactionRequest({
      account: providerAccount,
      to: integratorAccount.address,
      value: INTEGRATOR_FUNDING,
      type: "legacy",
      nonce: Number(nonce),
    });
    const serializedTransaction =
      await providerAccount.signTransaction(transactionRequest);
    const transactionHash = await client.sendRawTransaction({
      serializedTransaction,
    });
    console.log(`FUNDING_SUBMITTED ${transactionHash}`);

    let receipt = null;
    for (let attempt = 0; attempt < 60; attempt += 1) {
      try {
        receipt = await client.getTransactionReceipt({
          hash: transactionHash,
        });
        if (receipt) {
          break;
        }
      } catch {
        // Native transfer receipt is not available yet.
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
    if (!receipt) {
      throw new Error(
        `Funding transfer ${transactionHash} is still pending confirmation`,
      );
    }
    if (receipt.status === "reverted") {
      throw new Error(`Funding transfer ${transactionHash} reverted`);
    }
    const finalStatus = await waitForNetworkFinality(
      client,
      transactionHash,
      120,
    );
    funding = {
      transactionHash,
      status: finalStatus,
      amountWei: INTEGRATOR_FUNDING.toString(),
      amountGen: formatEther(INTEGRATOR_FUNDING),
      blockNumber: receipt.blockNumber.toString(),
      gasUsed: receipt.gasUsed.toString(),
      finalizedAt: new Date().toISOString(),
    };
  } else if (funding?.transactionHash && funding.status !== "FINALIZED") {
    funding = {
      ...funding,
      status: await waitForNetworkFinality(
        client,
        funding.transactionHash,
        120,
      ),
      finalizedAt: new Date().toISOString(),
    };
  }

  const balanceAfter = await getBalance(client, integratorAccount.address);
  const record = {
    walletAddress: integratorAccount.address,
    role: "integrator",
    keyStorage: "ignored root .env",
    generatedForDemo: Boolean(evidence?.integrator?.generatedForDemo || created),
    balanceWei: balanceAfter.toString(),
    funding,
  };
  writeEvidence({ integrator: record });
  console.log(
    JSON.stringify({
      integratorAddress: integratorAccount.address,
      balanceWei: balanceAfter.toString(),
      fundingTransactionHash: funding?.transactionHash ?? null,
    }),
  );
  return record;
}

async function deployPrimitive(client, account) {
  const code = new Uint8Array(
    readFileSync(
      path.join(ROOT_DIR, "contracts", "semantic_interface_covenant.py"),
    ),
  );
  const hash = await client.deployContract({ code, args: [] });
  const receipt = await waitForFinalized(client, hash);
  assertSuccessfulReceipt(receipt, "SemanticInterfaceCovenant deployment");
  const contractAddress = extractContractAddress(receipt);
  if (!contractAddress) {
    throw new Error(
      "Deployment finalized but no contract address was present in the receipt",
    );
  }
  const record = {
    walletAddress: account.address,
    primitive: {
      contractAddress,
      transactionHash: hash,
      status: receipt.statusName ?? String(receipt.status),
      finalizedAt: new Date().toISOString(),
    },
  };
  writeEvidence(record);
  console.log(`PRIMITIVE_ADDRESS ${contractAddress}`);
  return record;
}

async function deployGuard(client, account, covenantAddress, bindingId) {
  if (!/^0x[0-9a-fA-F]{40}$/.test(covenantAddress)) {
    throw new Error("A valid covenant address is required for guard deployment");
  }
  const code = new Uint8Array(
    readFileSync(path.join(ROOT_DIR, "contracts", "tool_router_guard.py")),
  );
  const hash = await client.deployContract({
    code,
    args: [covenantAddress, bindingId, false],
  });
  const receipt = await waitForFinalized(client, hash);
  assertSuccessfulReceipt(receipt, "ToolRouterGuard deployment");
  const contractAddress = extractContractAddress(receipt);
  if (!contractAddress) {
    throw new Error(
      "Guard deployment finalized but no contract address was present in the receipt",
    );
  }
  const record = {
    walletAddress: account.address,
    guard: {
      contractAddress,
      covenantAddress,
      bindingId,
      allowDegraded: false,
      transactionHash: hash,
      status: receipt.statusName ?? String(receipt.status),
      finalizedAt: new Date().toISOString(),
    },
  };
  writeEvidence(record);
  console.log(`GUARD_ADDRESS ${contractAddress}`);
  return record;
}

async function setupProviderCovenant(client, account) {
  const evidence = readEvidence();
  const covenantAddress = evidence?.primitive?.contractAddress;
  if (!/^0x[0-9a-fA-F]{40}$/.test(covenantAddress ?? "")) {
    throw new Error("Primitive deployment evidence is missing");
  }

  const setup = {
    covenantId: COVENANT_ID,
    walletAddress: account.address,
    serviceCreditWei: SERVICE_CREDIT.toString(),
    challengeBondWei: CHALLENGE_BOND.toString(),
    stableEncoderUrl: STABLE_ENCODER_URL,
    rawRepositoryPrefix: RAW_REPOSITORY_PREFIX,
    transactions: { ...(evidence?.setup?.transactions ?? {}) },
  };

  const runStep = async (step, functionName, args, value = 0n) => {
    if (setup.transactions[step]?.status === "FINALIZED") {
      console.log(`SKIP ${step} already finalized`);
      return;
    }
    setup.transactions[step] = await writeContractFinalized(
      client,
      covenantAddress,
      functionName,
      args,
      value,
    );
    writeEvidence({ setup });
  };

  await runStep("createCovenant", "create_covenant", [
    COVENANT_ID,
    "1.0.0",
    "GenLayer JavaScript SDK calldata compatibility",
    "API",
    SERVICE_CREDIT,
    CHALLENGE_BOND,
  ]);
  await runStep("addMethodKeyGuarantee", "add_guarantee", [
    COVENANT_ID,
    "method-key",
    "Contract calls targeting the current Studionet runtime must encode the public method name under the string key method so the runtime can dispatch the requested public method.",
    "REQUIRED",
    "Compare the official stable encoder implementation with any candidate SDK encoder and verify the map key used for method dispatch.",
  ]);
  await runStep("addStableEncoderSource", "add_source_rule", [
    COVENANT_ID,
    "stable-encoder",
    STABLE_ENCODER_URL,
    "OFFICIAL_SOURCE_CODE",
    true,
  ]);
  await runStep("addRepositoryObservationScope", "add_source_rule", [
    COVENANT_ID,
    "provider-repository",
    RAW_REPOSITORY_PREFIX,
    "OFFICIAL_SOURCE_CODE",
    false,
  ]);
  await runStep("activateCovenant", "activate_covenant", [COVENANT_ID]);

  const covenant = await client.readContract({
    address: covenantAddress,
    functionName: "get_covenant",
    args: [COVENANT_ID],
    jsonSafeReturn: true,
  });
  setup.stateAfterFinalization = jsonSafe(covenant);
  setup.completedAt = new Date().toISOString();
  writeEvidence({ setup });
  console.log(`COVENANT_ACTIVE ${COVENANT_ID}`);
}

async function waitForGuardStatus(client, guardAddress, expectedStatus) {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    const status = await client.readContract({
      address: guardAddress,
      functionName: "get_status",
      args: [],
      jsonSafeReturn: true,
    });
    if (status.covenant_status === expectedStatus) {
      return jsonSafe(status);
    }
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
  throw new Error(
    `Guard did not reach ${expectedStatus} before the timeout`,
  );
}

async function runLiveDisputeDemo(providerClient, providerAccount) {
  const evidence = readEvidence();
  const covenantAddress = evidence?.primitive?.contractAddress;
  const guardAddress = evidence?.guard?.contractAddress;
  if (!/^0x[0-9a-fA-F]{40}$/.test(covenantAddress ?? "")) {
    throw new Error("Primitive deployment evidence is missing");
  }
  if (!/^0x[0-9a-fA-F]{40}$/.test(guardAddress ?? "")) {
    throw new Error("Guard deployment evidence is missing");
  }

  const integratorKey = loadPrivateKey(
    "STUDIONET_INTEGRATOR_PRIVATE_KEY",
  );
  const integratorAccount = createAccount(integratorKey);
  if (
    integratorAccount.address.toLowerCase() ===
    providerAccount.address.toLowerCase()
  ) {
    throw new Error("Integrator wallet must differ from provider wallet");
  }
  if (
    evidence?.integrator?.walletAddress &&
    evidence.integrator.walletAddress.toLowerCase() !==
      integratorAccount.address.toLowerCase()
  ) {
    throw new Error("Integrator key does not match deployment evidence");
  }
  const integratorBalance = await getBalance(
    providerClient,
    integratorAccount.address,
  );
  if (integratorBalance < CHALLENGE_BOND) {
    throw new Error("Integrator wallet is not funded for the challenge bond");
  }
  const integratorClient = createClient({
    chain: studionet,
    account: integratorAccount,
  });

  const demo = {
    bindingId: BINDING_ID,
    caseId: CASE_ID,
    cureId: CURE_ID,
    providerAddress: providerAccount.address,
    integratorAddress: integratorAccount.address,
    providerBindingBondWei: PROVIDER_BINDING_BOND.toString(),
    challengeBondWei: CHALLENGE_BOND.toString(),
    breakingEncoderUrl: BREAKING_ENCODER_URL,
    transactions: { ...(evidence?.demo?.transactions ?? {}) },
    states: { ...(evidence?.demo?.states ?? {}) },
  };

  const persist = () => writeEvidence({ demo });
  const runStep = async (
    step,
    client,
    address,
    functionName,
    args,
    value = 0n,
  ) => {
    if (demo.transactions[step]?.status === "FINALIZED") {
      console.log(`SKIP ${step} already finalized`);
      return;
    }
    demo.transactions[step] = await writeContractFinalized(
      client,
      address,
      functionName,
      args,
      value,
    );
    persist();
  };

  await runStep(
    "offerBinding",
    providerClient,
    covenantAddress,
    "offer_binding",
    [
      BINDING_ID,
      COVENANT_ID,
      integratorAccount.address,
      integratorAccount.address,
      guardAddress,
    ],
    PROVIDER_BINDING_BOND,
  );
  await runStep(
    "acceptBinding",
    integratorClient,
    covenantAddress,
    "accept_binding",
    [BINDING_ID],
  );
  await runStep(
    "routeBeforeDispute",
    providerClient,
    guardAddress,
    "route_request",
    ["request-before-dispute", "genlayer-sdk"],
  );
  await runStep(
    "openCase",
    integratorClient,
    covenantAddress,
    "open_case",
    [
      CASE_ID,
      BINDING_ID,
      "The candidate JavaScript SDK encoder replaces the current Studionet method dispatch key method with an empty string, so deployed public methods can no longer be called on the current runtime.",
    ],
    CHALLENGE_BOND,
  );
  await runStep(
    "addBreakingObservation",
    integratorClient,
    covenantAddress,
    "add_case_observation",
    [CASE_ID, "candidate-v2-encoder", BREAKING_ENCODER_URL],
  );
  await runStep(
    "adjudicateBreakingCase",
    providerClient,
    covenantAddress,
    "adjudicate_case",
    [CASE_ID],
  );

  const verdictId = `verdict-${CASE_ID}`;
  const [bindingAfterVerdict, caseState, verdict, violations] =
    await Promise.all([
      providerClient.readContract({
        address: covenantAddress,
        functionName: "get_binding",
        args: [BINDING_ID],
        jsonSafeReturn: true,
      }),
      providerClient.readContract({
        address: covenantAddress,
        functionName: "get_case",
        args: [CASE_ID],
        jsonSafeReturn: true,
      }),
      providerClient.readContract({
        address: covenantAddress,
        functionName: "get_verdict",
        args: [verdictId],
        jsonSafeReturn: true,
      }),
      providerClient.readContract({
        address: covenantAddress,
        functionName: "get_verdict_violations",
        args: [verdictId],
        jsonSafeReturn: true,
      }),
    ]);
  demo.states.bindingAfterVerdict = jsonSafe(bindingAfterVerdict);
  demo.states.case = jsonSafe(caseState);
  demo.states.verdict = jsonSafe(verdict);
  demo.states.violatedGuaranteeIds = jsonSafe(violations);
  persist();

  if (verdict.compatibility_class !== "BREAKING") {
    throw new Error(
      `Live validator verdict was ${verdict.compatibility_class}; ` +
        "the contract correctly preserved that real consensus outcome",
    );
  }

  if (
    demo.transactions.adjudicateCure?.status !== "FINALIZED"
  ) {
    demo.states.guardQuarantined = await waitForGuardStatus(
      providerClient,
      guardAddress,
      "QUARANTINED",
    );
    persist();
  } else {
    console.log("SKIP quarantine wait; cure already finalized");
  }

  await runStep(
    "submitCure",
    providerClient,
    covenantAddress,
    "submit_cure",
    [CURE_ID, BINDING_ID, verdictId],
  );
  await runStep(
    "addCureSource",
    providerClient,
    covenantAddress,
    "add_cure_source",
    [CURE_ID, "restored-stable-encoder", STABLE_ENCODER_URL],
  );
  await runStep(
    "adjudicateCure",
    providerClient,
    covenantAddress,
    "adjudicate_cure",
    [CURE_ID],
  );

  const cure = await providerClient.readContract({
    address: covenantAddress,
    functionName: "get_cure",
    args: [CURE_ID],
    jsonSafeReturn: true,
  });
  demo.states.cure = jsonSafe(cure);
  if (cure.status !== "CURED") {
    persist();
    throw new Error(
      `Live validator cure result was ${cure.status}; state was preserved`,
    );
  }

  demo.states.guardRestored = await waitForGuardStatus(
    providerClient,
    guardAddress,
    "ACTIVE",
  );
  await runStep(
    "routeAfterCure",
    providerClient,
    guardAddress,
    "route_request",
    ["request-after-cure", "genlayer-sdk"],
  );

  const integratorCreditBeforeWithdrawal =
    await providerClient.readContract({
      address: covenantAddress,
      functionName: "get_account_credit",
      args: [integratorAccount.address],
      jsonSafeReturn: true,
    });
  const withdrawableAmount = BigInt(integratorCreditBeforeWithdrawal);
  const integratorBalanceBeforeWithdrawal = await getBalance(
    providerClient,
    integratorAccount.address,
  );
  demo.states.integratorBalanceBeforeWithdrawalWei =
    integratorBalanceBeforeWithdrawal.toString();
  demo.states.integratorCreditBeforeWithdrawalWei =
    withdrawableAmount.toString();
  if (withdrawableAmount > 0n) {
    await runStep(
      "withdrawIntegratorCredit",
      integratorClient,
      covenantAddress,
      "withdraw_credit",
      [withdrawableAmount],
    );
  }

  let integratorBalanceAfterWithdrawal = await getBalance(
    providerClient,
    integratorAccount.address,
  );
  const expectedIntegratorBalance =
    integratorBalanceBeforeWithdrawal + withdrawableAmount;
  for (
    let attempt = 0;
    withdrawableAmount > 0n &&
    integratorBalanceAfterWithdrawal < expectedIntegratorBalance &&
    attempt < 120;
    attempt += 1
  ) {
    await new Promise((resolve) => setTimeout(resolve, 5000));
    integratorBalanceAfterWithdrawal = await getBalance(
      providerClient,
      integratorAccount.address,
    );
  }
  if (
    withdrawableAmount > 0n &&
    integratorBalanceAfterWithdrawal < expectedIntegratorBalance
  ) {
    throw new Error(
      "Integrator withdrawal finalized but external value transfer was not observed",
    );
  }
  demo.states.integratorBalanceAfterWithdrawalWei =
    integratorBalanceAfterWithdrawal.toString();

  const [
    finalBinding,
    finalGuard,
    accounting,
    providerCredit,
    integratorCredit,
  ] = await Promise.all([
    providerClient.readContract({
      address: covenantAddress,
      functionName: "get_binding",
      args: [BINDING_ID],
      jsonSafeReturn: true,
    }),
    providerClient.readContract({
      address: guardAddress,
      functionName: "get_status",
      args: [],
      jsonSafeReturn: true,
    }),
    providerClient.readContract({
      address: covenantAddress,
      functionName: "get_accounting",
      args: [],
      jsonSafeReturn: true,
    }),
    providerClient.readContract({
      address: covenantAddress,
      functionName: "get_account_credit",
      args: [providerAccount.address],
      jsonSafeReturn: true,
    }),
    providerClient.readContract({
      address: covenantAddress,
      functionName: "get_account_credit",
      args: [integratorAccount.address],
      jsonSafeReturn: true,
    }),
  ]);
  demo.states.finalBinding = jsonSafe(finalBinding);
  demo.states.finalGuard = jsonSafe(finalGuard);
  demo.states.accounting = jsonSafe(accounting);
  demo.states.providerCreditWei = jsonSafe(providerCredit);
  demo.states.integratorCreditWei = jsonSafe(integratorCredit);
  demo.completedAt = new Date().toISOString();
  persist();
  console.log(
    JSON.stringify({
      verdict: verdict.compatibility_class,
      violatedGuaranteeIds: violations,
      cure: cure.status,
      finalBindingStatus: finalBinding.status,
      guardCanRoute: finalGuard.can_route,
    }),
  );
}

const command = process.argv[2] ?? "inspect";
const privateKey = loadPrivateKey();
const account = createAccount(privateKey);
const client = createClient({ chain: studionet, account });

try {
  const wallet = await inspectWallet(client, account);
  if (wallet.chainId !== studionet.id) {
    throw new Error(
      `Connected chain ${wallet.chainId} does not match Studionet ${studionet.id}`,
    );
  }

  if (command === "inspect") {
    process.exitCode = 0;
  } else if (command === "deploy-primitive") {
    await deployPrimitive(client, account);
  } else if (command === "deploy-guard") {
    const evidence = readEvidence();
    const covenantAddress =
      process.argv[3] ?? evidence?.primitive?.contractAddress;
    const bindingId = process.argv[4] ?? "binding-1";
    await deployGuard(client, account, covenantAddress, bindingId);
  } else if (command === "setup-provider") {
    await setupProviderCovenant(client, account);
  } else if (command === "fund-integrator") {
    await fundIntegrator(client, account);
  } else if (command === "run-demo") {
    await runLiveDisputeDemo(client, account);
  } else {
    throw new Error(
      "Unknown command. Use inspect, deploy-primitive, deploy-guard, setup-provider, fund-integrator, or run-demo",
    );
  }
} finally {
  // The key remains only in this process and the ignored root .env.
}
