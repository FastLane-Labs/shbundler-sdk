import {
    createPublicClient,
    createWalletClient,
    http,
  } from "viem";
  import {
    createBundlerClient,
    createPaymasterClient,
    entryPoint07Address,
  } from "viem/account-abstraction";
  import { createSmartAccountClient } from "permissionless";
  import { toSafeSmartAccount } from "permissionless/accounts";
  import { ShBundlerClientOptions, ShBundlerSDK } from "./types";
  import { getUserOperationGasPrice } from "./utils/gas";
  import { fetchNetworkDefaults } from "./utils/networks";
  
  export async function createShBundlerClient(opts: ShBundlerClientOptions): Promise<ShBundlerSDK> {
    let {
      signer,
      rpcUrl,
      bundlerUrl,
      paymasterUrl,
      paymasterAddress,
      safeVersion = "1.4.1",
    } = opts;

    const publicClient = createPublicClient({
      transport: http(rpcUrl),
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
  
    const smartAccount = await toSafeSmartAccount({
      client: publicClient,
      entryPoint: {
        address: entryPoint07Address,
        version: "0.7",
      },
      owners: [signer],
      version: safeVersion as "1.4.1",
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
      chain: publicClient.chain,
      paymaster: paymasterClient,
      userOperation: {
          estimateFeesPerGas: async () => getUserOperationGasPrice(bundlerClient),
      },
    });
  
    const smartAccountClient = createSmartAccountClient({
      client: publicClient,
      bundlerTransport: http(bundlerUrl),
      chain: publicClient.chain,
      account: smartAccount,
      userOperation: {
        estimateFeesPerGas: async () => getUserOperationGasPrice(bundlerClient),
      },
    });
  
    return {
      publicClient,
      walletClient,
      smartAccount,
      paymasterClient,
      bundlerClient,
      smartAccountClient,
      sendUserOperation: smartAccountClient.sendTransaction,
    };
  }
  