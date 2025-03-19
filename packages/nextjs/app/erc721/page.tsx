"use client";

import { useState } from "react";
import { AllNfts } from "./components/AllNfts";
import { MyNfts } from "./components/MyNfts";
import { SquareHeatmap } from "./components/drawNFT";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { AddressInput, RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

const ERC721: NextPage = () => {
  const { address: connectedAddress } = useAccount();

  const [toAddress, setToAddress] = useState<string>("");

  const { writeContractAsync: writeSE2TokenAsync } = useScaffoldWriteContract("SE2NFT");

  return (
    <>
      <div className="flex items-center flex-col flex-grow pt-10">
        <div className="px-5 text-center max-w-4xl">
          <h1 className="text-4xl font-bold">On-Chain Activity NFT</h1>
          <div>
            <p>
              This is a NFT that represents your on-chain activities. It shows the number of transactions you have made
              on the Ethereum network throughout 2024. Every row is one month.
            </p>
          </div>

          <div className="divider my-0" />

          {/* <h2 className="text-3xl font-bold mt-4">Interact with the NFT</h2>

          <div>
            <p>Below you can mint an NFT for yourself or to another address.</p>
            <p>
              You can see your balance and your NFTs, and below that, you can see the total supply and all the NFTs
              minted.
            </p>
            <p>
              Check the code under <em>packages/nextjs/app/erc721</em> to learn more about how to interact with the
              ERC721 contract.
            </p>
          </div> */}
        </div>

        {connectedAddress ? (
          <div className="flex flex-col justify-center items-center bg-base-300 w-full mt-8 px-8 pt-6 pb-12">
            <SquareHeatmap />
            <div className="flex justify-center items-center space-x-2 flex-col sm:flex-row mb-2">
              <button
                className="btn btn-accent text-lg px-12 mt-2"
                onClick={async () => {
                  try {
                    await writeSE2TokenAsync({ functionName: "mintItem", args: [connectedAddress] });
                  } catch (e) {
                    console.error("Error while minting token", e);
                  }
                }}
              >
                Mint token to your address
              </button>
            </div>
            <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center w-full md:w-2/4 rounded-3xl mt-5 mb-8">
              <h3 className="text-2xl font-bold">Mint token to another address</h3>
              <div className="flex flex-col items-center justify-between w-full lg:w-3/5 px-2 mt-4">
                <div className="font-bold mb-2">To:</div>
                <div>
                  <AddressInput value={toAddress} onChange={setToAddress} placeholder="Address" />
                </div>
              </div>
              <div>
                <button
                  className="btn btn-primary text-lg px-12 mt-2"
                  disabled={!toAddress}
                  onClick={async () => {
                    try {
                      await writeSE2TokenAsync({ functionName: "mintItem", args: [toAddress] });
                      setToAddress("");
                    } catch (e) {
                      console.error("Error while minting token", e);
                    }
                  }}
                >
                  Mint
                </button>
              </div>
            </div>
            <MyNfts />
            <AllNfts />
          </div>
        ) : (
          <div className="flex flex-col justify-center items-center bg-base-300 w-full mt-8 px-8 pt-6 pb-12">
            <p className="text-xl font-bold">Please connect your wallet to interact with the token.</p>
            <RainbowKitCustomConnectButton />
          </div>
        )}
      </div>
    </>
  );
};

export default ERC721;
