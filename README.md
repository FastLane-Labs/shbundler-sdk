# shbundler-sdk

A TypeScript SDK for interacting with Fastlane's 4337 bundler (ShBundler), designed to simplify the submission of UserOperations with built-in support for Fastlane paymasters and Safe-based smart accounts.

## Installation

```bash
pnpm add @fastlane-labs/shbundler-sdk
```

## Example 

```typescript
import { createShBundlerClient } from "@fastlane-labs/shbundler-sdk";
import { privateKeyToAccount } from "viem/accounts";

const signer = privateKeyToAccount("0xYOUR_PRIVATE_KEY");

const client = await createShBundlerClient({
  signer,
  rpcUrl: "https://rpc.monadlabs.dev", // e.g. Monad Testnet
  // Optional: you can override bundlerUrl and paymasterUrl,
  // otherwise they are fetched based on chain ID
});

await client.sendUserOperation({
  target: "0xTargetAddress",
  data: "0xCallData",
});
```