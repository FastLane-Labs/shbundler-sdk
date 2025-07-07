import {
    createPublicClient,
    createWalletClient,
    http,
  } from "viem";
  import {
    createBundlerClient,
    createPaymasterClient,
    entryPoint07Address,
    entryPoint08Address,
  } from "viem/account-abstraction";
  import {
    sendUserOperation as sendUserOperationViem,
  } from "viem/account-abstraction";
  import { toSafeSmartAccount } from "permissionless/accounts";
  import { toAccount } from "viem/accounts";
  import { createSmartAccountClient } from "permissionless";
  import { toSimpleSmartAccount } from "permissionless/accounts";
  import { ShBundlerClientOptions, ShBundlerSDK, SendUserOperationParams } from "./types";
  import { getUserOperationGasPrice } from "./utils/gas";
  import { fetchNetworkDefaults } from "./utils/networks";

  export async function createShBundlerClient(opts: ShBundlerClientOptions): Promise<ShBundlerSDK> {
    let {
      signer,
      rpcUrl,
      chain,
      bundlerUrl,
      paymasterUrl,
      paymasterAddress,
      entryPointVersion = "0.8",
    } = opts;

    const publicClient = createPublicClient({
      transport: http(rpcUrl),
      chain: chain,
    });
    const chainId = await publicClient.getChainId();

    if (!bundlerUrl || !paymasterUrl || !paymasterAddress) {
      const defaults = await fetchNetworkDefaults(chainId);

      if (!defaults) throw new Error(`No defaults found for chain ID ${chainId}`);

      bundlerUrl = bundlerUrl || defaults.bundlerUrl;
      paymasterUrl = paymasterUrl || defaults.paymasterUrl;
      paymasterAddress = paymasterAddress || defaults.paymasterAddress;
    }
  
    const walletClient = createWalletClient({
      transport: http(rpcUrl),
      account: signer,
    });

    const entryPointAddress = entryPointVersion === "0.7" ? entryPoint07Address : entryPoint08Address;
  
    const smartAccountSimple: Awaited<ReturnType<typeof toSimpleSmartAccount>> = await toSimpleSmartAccount({
      client: publicClient,
      entryPoint: {
        address: entryPointAddress,
        version: entryPointVersion,
      },
      owner: toAccount(signer),
    });

    // temporary fix for monad testnet
    // update after entrypoint 8 is deployed on monad testnet
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

    const smartAccount = chainId !== 10143 ? smartAccountSimple : entryPointVersion === "0.7" ? smartAccountSimple : smartAccountV08MonadTestnet;
  
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
        chain: chain,
        bundlerTransport: http(bundlerUrl!),
        account: smartAccount,
        userOperation: {
          estimateFeesPerGas: async () => getUserOperationGasPrice(bundlerClient),
        },
        paymaster: paymasterClient,
        paymasterContext: paymasterContext,
      });

      const userOpHash = await sendUserOperationViem(dynamicSmartAccountClient, {
        account: smartAccount,
        calls: [{ to, data }],  
      });

      return userOpHash;
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