import {
  createPublicClient,
  createWalletClient,
  http,
  type Address,
  type Chain,
} from "viem";
import {
  createBundlerClient,
  createPaymasterClient,
  entryPoint07Address,
  entryPoint08Address,
  sendUserOperation as sendUserOperationViem,
} from "viem/account-abstraction";
import {
  toSimpleSmartAccount,
  toSafeSmartAccount,
} from "permissionless/accounts";
import { toAccount } from "viem/accounts";
import { createSmartAccountClient } from "permissionless";

import {
  ShBundlerClientOptions,
  ShBundlerFromSmartAccountOptions,
  ShBundlerSDK,
  SendUserOperationParams,
} from "./types";

import { getUserOperationGasPrice } from "./utils/gas";
import { fetchNetworkDefaults } from "./utils/networks";

type SmartAccountInstance = Awaited<ReturnType<typeof toSimpleSmartAccount>> |
                            Awaited<ReturnType<typeof toSafeSmartAccount>>;

async function buildShBundlerSDK({
  smartAccount,
  rpcUrl,
  chain,
  bundlerUrl,
  paymasterUrl,
  paymasterAddress,
}: {
  smartAccount: SmartAccountInstance;
  rpcUrl: string;
  chain: Chain;
  bundlerUrl: string;
  paymasterUrl: string;
  paymasterAddress: Address;
}): Promise<ShBundlerSDK> {
  const publicClient = createPublicClient({
    transport: http(rpcUrl),
    chain,
  });

  const walletClient = createWalletClient({
    transport: http(rpcUrl),
    account: smartAccount,
  });

  const paymasterClient = createPaymasterClient({
    transport: http(paymasterUrl),
  });

  let bundlerClient: ReturnType<typeof createBundlerClient>;

  bundlerClient = createBundlerClient({
    transport: http(bundlerUrl),
    name: "shBundler",
    account: smartAccount,
    client: publicClient,
    paymaster: paymasterClient,
    userOperation: {
      estimateFeesPerGas: async () => getUserOperationGasPrice(bundlerClient),
    },
  });

  const sendUserOperation = async ({
    to,
    data,
    chain,
    paymasterContext,
  }: SendUserOperationParams) => {
    const dynamicSmartAccountClient = createSmartAccountClient({
      client: publicClient,
      chain,
      bundlerTransport: http(bundlerUrl),
      account: smartAccount,
      userOperation: {
        estimateFeesPerGas: async () => getUserOperationGasPrice(bundlerClient),
      },
      paymaster: paymasterClient,
      paymasterContext,
    });

    return sendUserOperationViem(dynamicSmartAccountClient, {
      account: smartAccount,
      calls: [{ to, data }],
    });
  };

  return {
    publicClient,
    walletClient,
    smartAccount,
    paymasterClient,
    bundlerClient,
    sendUserOperation,
  };
}

export async function createShBundlerClient(
  opts: ShBundlerClientOptions
): Promise<ShBundlerSDK> {
  const {
    signer,
    rpcUrl,
    chain,
    bundlerUrl: inputBundlerUrl,
    paymasterUrl: inputPaymasterUrl,
    paymasterAddress: inputPaymasterAddress,
    entryPointVersion = "0.8",
  } = opts;

  if (!signer || !rpcUrl || !chain) {
    throw new Error("signer, rpcUrl, and chain are required");
  }

  const publicClient = createPublicClient({
    transport: http(rpcUrl),
    chain,
  });

  const chainId = await publicClient.getChainId();

  const defaults = (await fetchNetworkDefaults(chainId)) || {};
  const bundlerUrl = inputBundlerUrl || defaults.bundlerUrl;
  const paymasterUrl = inputPaymasterUrl || defaults.paymasterUrl;
  const paymasterAddress = inputPaymasterAddress || defaults.paymasterAddress;

  if (!bundlerUrl || !paymasterUrl || !paymasterAddress) {
    throw new Error("Missing bundlerUrl, paymasterUrl, or paymasterAddress and no defaults found");
  }

  const entryPointAddress =
    entryPointVersion === "0.7" ? entryPoint07Address : entryPoint08Address;

  const smartAccountSimple = await toSimpleSmartAccount({
    client: publicClient,
    entryPoint: {
      address: entryPointAddress,
      version: entryPointVersion,
    },
    owner: toAccount(signer),
  });

  const smartAccountV08MonadTestnet = await toSafeSmartAccount({
    client: publicClient as any,
    entryPoint: {
      address: entryPoint08Address,
      version: "0.7",
    },
    owners: [signer as any],
    version: "1.4.1",
    safe4337ModuleAddress: "0x02b336F533F2de3F221540eF56583e9cb8E65203",
    safeProxyFactoryAddress: "0xd9d2Ba03a7754250FDD71333F444636471CACBC4",
    safeSingletonAddress: "0x639245e8476E03e789a244f279b5843b9633b2E7",
    safeModuleSetupAddress: "0x2dd68b007B46fBe91B9A7c3EDa5A7a1063cB5b47",
    multiSendAddress: "0x7B21BBDBdE8D01Df591fdc2dc0bE9956Dde1e16C",
    multiSendCallOnlyAddress: "0x32228dDEA8b9A2bd7f2d71A958fF241D79ca5eEC",
  });

  const smartAccount: SmartAccountInstance =
    chainId !== 10143
      ? smartAccountSimple
      : entryPointVersion === "0.7"
      ? smartAccountSimple
      : smartAccountV08MonadTestnet;

  return buildShBundlerSDK({
    smartAccount,
    rpcUrl,
    chain,
    bundlerUrl,
    paymasterUrl,
    paymasterAddress,
  });
}

export async function createShBundlerClientFromSmartAccount(
  opts: ShBundlerFromSmartAccountOptions
): Promise<ShBundlerSDK> {
  const {
    smartAccount,
    rpcUrl,
    chain,
    bundlerUrl,
    paymasterUrl,
    paymasterAddress,
  } = opts;

  if (!rpcUrl || !chain || !bundlerUrl || !paymasterUrl || !paymasterAddress) {
    throw new Error("All fields are required to use a precomputed smartAccount");
  }

  return buildShBundlerSDK({
    smartAccount,
    rpcUrl,
    chain,
    bundlerUrl,
    paymasterUrl,
    paymasterAddress,
  });
}
