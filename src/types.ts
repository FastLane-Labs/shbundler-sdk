import { LocalAccount } from "viem";
import type { SmartAccountClient } from "permissionless";
import type { Address, Chain } from "viem";

import {
    createBundlerClient,
    createPaymasterClient,
  } from "viem/account-abstraction";
  import {
    createPublicClient,
    createWalletClient,
  } from "viem";

export interface ShBundlerClientOptions {
  signer: LocalAccount;
  rpcUrl: string;
  chain: Chain;
  bundlerUrl?: string;
  paymasterUrl?: string;
  paymasterAddress?: Address;
  entryPointVersion?: "0.7" | "0.8";
}

export interface GasPriceResult {
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
}

export interface SendUserOperationParams {
  to: Address;
  data: `0x${string}`;
  chain: Chain;
  paymasterContext?: {
    paymasterAddress: Address;
    mode: "user" | "sponsor";
    sponsor?: Address;
    sponsorSignature?: `0x${string}`;
    validUntil?: string;
    validAfter?: string;
  };
}
export interface ShBundlerSDK {
  publicClient: ReturnType<typeof createPublicClient>;
  walletClient: ReturnType<typeof createWalletClient>;
  smartAccount: any;
  paymasterClient: ReturnType<typeof createPaymasterClient>;
  bundlerClient: ReturnType<typeof createBundlerClient>;
  sendUserOperation: (params: SendUserOperationParams) => Promise<`0x${string}`>;
}