"use client";

import { useMemo } from "react";
import {
  createMockKit,
  GenLayerTransactionPanel,
} from "@genlayer/transaction-kit-react";

const demoTransaction = {
  kind: "write" as const,
  address: "0x1111111111111111111111111111111111111111" as const,
  method: "create_bet",
  args: ["2026-08-01", "Team A", "Team B", "Team A"],
};

export default function TransactionKitPage() {
  const kit = useMemo(
    () =>
      createMockKit({
        delays: { estimate: 250, submit: 500, step: 650 },
        suggestions: true,
        queueAhead: 2,
      }),
    [],
  );

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "48px 20px",
        background: "#f4f5f7",
        color: "#15171a",
      }}
    >
      <div style={{ width: "min(760px, 100%)", margin: "0 auto" }}>
        <p style={{ fontFamily: "monospace", marginBottom: 8 }}>
          GenLayer Transaction Kit / React
        </p>
        <h1 style={{ fontSize: 40, lineHeight: 1.1, marginBottom: 16 }}>
          Fee review, signing, and consensus tracking
        </h1>
        <p style={{ lineHeight: 1.7, marginBottom: 28, maxWidth: 680 }}>
          This route exercises the official pre-release Transaction Kit UI with
          its deterministic mock adapter. Use
          <code> createGenLayerTransactionKit </code>
          from <code>frontend/lib/transaction-kit/client.ts</code> to connect an
          EIP-1193 wallet to a real GenLayer network.
        </p>
        <GenLayerTransactionPanel
          kit={kit}
          tx={demoTransaction}
          network="studionet-demo"
          theme="light"
          onDone={(status) => console.info("Transaction demo completed", status)}
        />
      </div>
    </main>
  );
}
