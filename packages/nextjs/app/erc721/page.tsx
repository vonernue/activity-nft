"use client";

import { useRef, useState } from "react";
import { AllNfts } from "./components/AllNfts";
import { MyNfts } from "./components/MyNfts";
import { SquareHeatmap } from "./components/drawNFT";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { AddressInput, RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useOutsideClick } from "~~/hooks/scaffold-eth";

const ERC721: NextPage = () => {
  const { address: connectedAddress } = useAccount();

  const [toAddress, setToAddress] = useState<string>("");

  const { writeContractAsync: writeSE2TokenAsync } = useScaffoldWriteContract("SE2NFT");

  const svgRef = useRef<SVGSVGElement | null>(null);

  const networks = ["ETH", "ZetaChain", "Arbitrum", "Optimism"];

  const [selectingNetwork, setSelectingNetwork] = useState(false);
  const [networkType, setNetworkType] = useState("");
  const dropdownRef = useRef<HTMLDetailsElement>(null);
  const closeDropdown = () => {
    setSelectingNetwork(false);
    dropdownRef.current?.removeAttribute("open");
  };
  useOutsideClick(dropdownRef, closeDropdown);

  const handleMint = async (toAddress: string) => {
    if (svgRef.current) {
      const rawSvg = svgRef.current;
      const svgString = new XMLSerializer().serializeToString(rawSvg);
      try {
        // Send the raw SVG to the API to handle IPFS upload and metadata creation
        const response = await fetch("/api/upload-to-ipfs", {
          method: "POST",
          headers: { "Content-Type": "application/text" },
          body: JSON.stringify({ svg: svgString }),
        });

        const { metadataUrl } = await response.json(); // Get the IPFS URL for metadata

        // Now mint the token with the metadata URL
        await writeSE2TokenAsync({
          functionName: "mintItem",
          args: [toAddress, metadataUrl],
        });

        console.log("Minted successfully with token URI:", metadataUrl);
      } catch (e) {
        console.error("Error while minting token", e);
      }
    }
  };

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
        </div>

        {connectedAddress ? (
          <div className="flex flex-col justify-center items-center bg-base-300 w-full mt-8 px-8 pt-6 pb-12">
            <details
              ref={dropdownRef}
              className="dropdown leading-1 flex items-center flex-col pt-10"
              onClick={() => setSelectingNetwork(false)}
            >
              <summary
                tabIndex={0}
                className="btn btn-secondary btn-md pl-0 pr-5 shadow-md dropdown-toggle gap-0 !h-auto"
              >
                <h1 className="h-2 pl-5"> {networkType != "" ? networkType : "BlockChain"} </h1>
                <ChevronDownIcon className="h-6 w-4 ml-2 sm:ml-0" />
              </summary>
              <ul
                tabIndex={0}
                className="dropdown-content menu z-[2] p-2 mt-2 shadow-center shadow-accent bg-base-200 rounded-box gap-2"
              >
                <li className={selectingNetwork ? "hidden" : "visible"}>
                  {networks.map((network, index) => (
                    <button
                      key={index} // Adding key for list items
                      className="menu-item text-error btn-sm !rounded-xl flex gap-3 py-3"
                      type="button"
                      onClick={() => {
                        setNetworkType(network); // Set network name dynamically
                      }}
                    >
                      <span>{network}</span> {/* Use networkName dynamically */}
                    </button>
                  ))}
                </li>
              </ul>
            </details>
            <SquareHeatmap svgRef={svgRef} networkName={networkType} />
            <div className="flex justify-center items-center space-x-2 flex-col sm:flex-row mb-2">
              <button className="btn btn-accent text-lg px-12 mt-2" onClick={() => handleMint(connectedAddress)}>
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
                  onClick={() => handleMint(toAddress)}
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
