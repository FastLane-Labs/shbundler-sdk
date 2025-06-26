import { Account } from "viem";
import type { SmartAccountClient } from "permissionless";
import {
    createBundlerClient,
    createPaymasterClient,
  } from "viem/account-abstraction";
  import {
    createPublicClient,
    createWalletClient,
  } from "viem";

export interface ShBundlerClientOptions {
  signer: Account;
  rpcUrl: string;
  bundlerUrl: string;
  paymasterUrl: string;
  safeVersion?: string;
}

export interface GasPriceResult {
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
}

export interface ShBundlerSDK {
  publicClient: ReturnType<typeof createPublicClient>;
  walletClient: ReturnType<typeof createWalletClient>;
  smartAccount: any;
  paymasterClient: ReturnType<typeof createPaymasterClient>;
  bundlerClient: ReturnType<typeof createBundlerClient>;
  smartAccountClient: SmartAccountClient;
  sendUserOperation: SmartAccountClient["sendTransaction"];
}