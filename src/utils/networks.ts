export async function fetchNetworkDefaults(chainId: number) {
  const url = "https://raw.githubusercontent.com/FastLane-Labs/shbundler-sdk/main/configs/networks.json";
  const res = await fetch(url);
  const data = await res.json();

  return data[chainId] || null;
}