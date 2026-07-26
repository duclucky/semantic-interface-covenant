import {
  createTransactionKit,
  type Eip1193Provider,
  type TransactionKit,
} from "@genlayer/transaction-kit";
import {
  localnet,
  studionet,
  testnetAsimov,
  testnetBradbury,
} from "genlayer-js/chains";

export type GenLayerNetwork =
  | "localnet"
  | "studionet"
  | "testnet-asimov"
  | "testnet-bradbury";

const chains = {
  localnet,
  studionet,
  "testnet-asimov": testnetAsimov,
  "testnet-bradbury": testnetBradbury,
} as const;

export function createGenLayerTransactionKit(
  provider: Eip1193Provider,
  account?: `0x${string}`,
  network: GenLayerNetwork = "studionet",
): TransactionKit {
  return createTransactionKit({
    chain: chains[network],
    provider,
    account,
  });
}
