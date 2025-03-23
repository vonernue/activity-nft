"use client";

import { useRef, useState } from "react";
import TranXTable from "./components/TranXTable";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import TransactionComp from "~~/app/blockexplorer/transaction/_components/TransactionComp";
import { NetworkOptions } from "~~/components/scaffold-eth/RainbowKitCustomConnectButton/NetworkOptions";
import { useOutsideClick } from "~~/hooks/scaffold-eth";

const Transactions: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const networks = ['ETH', 'ZetaChain', 'Arbitrum', 'Optimism'];

  const [selectingNetwork, setSelectingNetwork] = useState(false);
  const [networkType, setNetworkType] = useState("");
  const dropdownRef = useRef<HTMLDetailsElement>(null);
  const closeDropdown = () => {
    setSelectingNetwork(false);
    dropdownRef.current?.removeAttribute("open");
  };
  useOutsideClick(dropdownRef, closeDropdown);

  return (
    <>
      <h1 className="flex items-center flex-col pt-10 font-bold text-3xl"> Transactions Retrieval </h1>
      <div className="flex items-center flex-col ">{connectedAddress}</div>

      <details
        ref={dropdownRef}
        className="dropdown leading-1 flex items-center flex-col pt-10"
        onClick={() => setSelectingNetwork(false)}
      >
        <summary tabIndex={0} className="btn btn-secondary btn-md pl-0 pr-5 shadow-md dropdown-toggle gap-0 !h-auto">
          <h1 className="h-2 pl-5"> { networkType != "" ? networkType : "BlockChain" } </h1>
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

      <div hidden={networkType != ""} className="p-5 m-2 flex items-center flex-col">
        <TranXTable networkName={networkType} />
      </div>
    </>
  );
};

export default Transactions;
