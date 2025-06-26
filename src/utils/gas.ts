import { BundlerClient } from "viem/account-abstraction";
import { GasPriceResult } from "../types";
import { hexToBigInt } from "viem";

export async function getUserOperationGasPrice(
  bundlerClient: BundlerClient
): Promise<GasPriceResult> {
  const resultEncoded = await bundlerClient.request<any>({
    method: "gas_getUserOperationGasPrice",
    params: [],
  });

  return {
    maxFeePerGas: hexToBigInt(resultEncoded.standard.maxFeePerGas),
    maxPriorityFeePerGas: hexToBigInt(resultEncoded.standard.maxPriorityFeePerGas),
  };
}
