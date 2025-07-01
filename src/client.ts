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

    if (!bundlerUrl || !paymasterUrl || !paymasterAddress) {
      const chainId = await publicClient.getChainId();
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
  
    const smartAccount: Awaited<ReturnType<typeof toSimpleSmartAccount>> = await toSimpleSmartAccount({
      client: publicClient,
      entryPoint: {
        address: entryPointAddress,
        version: entryPointVersion,
      },
      owner: toAccount(signer),
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
        bundlerTransport: http(bundlerUrl!),
        account: smartAccount,
        userOperation: {
          estimateFeesPerGas: async () => getUserOperationGasPrice(bundlerClient),
        },
        paymaster: paymasterClient,
        paymasterContext: paymasterContext,
      });
    
      return await dynamicSmartAccountClient.sendTransaction({
        account: smartAccount,
        to,
        data,
        chain,
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