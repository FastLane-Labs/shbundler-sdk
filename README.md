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
  rpcUrl: "https://rpc.monadlabs.dev", 
  chain: monadTestnet, // a viem chain object
  // optional parameters
  // bundlerUrl: string // defaults to specificed in `networks.json`
  // paymasterUrl: string // defaults to specificed in `networks.json`
  // paymasterAddress: Address // defaults to specificed in `networks.json`
  // paymasterMode: "user" | "sponsor" // defaults to "user"
  // sponsor: Address // required if paymasterMode is "sponsor"
  // sponsorSignature: `0x${string}` // required if paymasterMode is "sponsor"
  // validUntil: string // required if paymasterMode is "sponsor"
  // validAfter: string // required if paymasterMode is "sponsor"
});

await client.sendUserOperation({
  target: "0xTargetAddress",
  data: "0xCallData",
});
```