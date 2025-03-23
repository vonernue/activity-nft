"use client";

import { useRef, useState, useEffect } from "react";
import { Alchemy, Network, AssetTransfersCategory, AssetTransfersResult } from "alchemy-sdk";
import { useAccount } from "wagmi";
import scaffoldConfig from "~~/scaffold.config";

const TranXTable = ({ networkName }: { networkName: string }) => {

  const [blockAdd, setBlockAdd] = useState("0x0"); //default block
  const [network, setNetwork] = useState<Network>(Network.ETH_MAINNET); //default block
  const { address: connectedAddress } = useAccount();

  useEffect(() => {
    if (networkName == "Optimism") {
      setNetwork(Network.OPT_MAINNET);
    } else if (networkName == "Arbitrum") {
      setNetwork(Network.ARB_MAINNET);
    }
  });

  const config = {
    apiKey: scaffoldConfig.alchemyApiKey, // Replace with your Alchemy API key.
    network: network, // Replace with your network.
  };

  const alchemy = new Alchemy(config);

  const getTransfer = async () => {
    const data = await alchemy.core.getAssetTransfers({
      fromBlock: blockAdd,
      fromAddress: connectedAddress,
      category: [
        AssetTransfersCategory.ERC20,
        AssetTransfersCategory.ERC721,
        AssetTransfersCategory.ERC1155,
      ],
    });
    return data.transfers;
  }

  const [transfers, setTransfers] = useState<AssetTransfersResult[]>([]);

  useEffect(() => {
    // Fetch the transfer data when component mounts or blockAdd/connectedAddress change
    const fetchData = async () => {
      const transferData = await getTransfer();
      setTransfers(transferData); // Set the data to state
    };

    fetchData();
  });

  return (
    <>
      <table className="table-fixed p-5 border-2 border-solid">
        <thead className="border-2 border-solid">
          <tr className="p-5 m-2 border-2 border-solid">
            <th className="p-2 border-2 border-solid">Block Number</th>
            <th className="p-5 m-2 border-2 border-solid">From</th>
            <th className="p-5 m-2 border-2 border-solid">To</th>
            <th className="p-5 m-2 border-2 border-solid">Value</th>
            <th className="p-5 m-2 border-2 border-solid">Category</th>
          </tr>
        </thead>
        <tbody className="p-5 m-2 border-2 border-solid">
          {transfers.map((transfer, index) => (
            <tr key={index} className="p-5 m-2 border-2 border-solid">
              <td className="p-5 m-2 border-2 border-solid">{transfer.blockNum}</td>
              <td className="p-5 m-2 border-2 border-solid">{transfer.from}</td>
              <td className="p-5 m-2 border-2 border-solid">{transfer.to}</td>
              <td className="p-5 m-2 border-2 border-solid">{transfer.value} {transfer.asset}</td>
              <td className="p-5 m-2 border-2 border-solid">{transfer.category}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
};

export default TranXTable;
