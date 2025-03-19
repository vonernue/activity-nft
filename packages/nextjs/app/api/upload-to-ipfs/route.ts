import { NextRequest, NextResponse } from "next/server";
import { create } from "@web3-storage/w3up-client";

const client = await create();
await client.login('seanho12345@gmail.com');
await client.setCurrentSpace('did:key:z6MkhcsWWVJX8cp3ovTHS5NNtdgTy11sXL2YLFJTGemX76Wm');

export async function POST(req: NextRequest) {
  const { svg } = await req.json();

  // Step 1: Upload the SVG to IPFS
  const blob = new Blob([svg], { type: "image/svg+xml" });
  const file = new File([blob], "heatmap.svg", { type: "image/svg+xml" });

  const cid = await client.uploadDirectory([file]);
  const svgIpfsUrl = `https://${cid}.ipfs.w3s.link/heatmap.svg`;

  // Step 2: Create the metadata JSON
  const metadata = {
    name: "On-Chain Activity NFT",
    description: "This NFT contains an on-chain activity heatmap.",
    image: svgIpfsUrl, // The image field points to the IPFS URL of the SVG
  };

  const metadataBlob = new Blob([JSON.stringify(metadata)], { type: "application/json" });
  const metadataFile = new File([metadataBlob], "metadata.json");

  // Step 3: Upload the metadata JSON to IPFS
  const metadataCid = await client.uploadDirectory([metadataFile]);
  const metadataUrl = `https://${metadataCid}.ipfs.w3s.link/metadata.json`;

  // Return the IPFS URL of the metadata
  return NextResponse.json({ metadataUrl });
}
