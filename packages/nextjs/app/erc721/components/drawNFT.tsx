"use client";

import React, { useEffect, useState, RefObject} from "react";
import { AxisBottom, AxisLeft } from "@visx/axis";
import { Group } from "@visx/group";
import { HeatmapCircle } from "@visx/heatmap";
import { Bin, Bins } from "@visx/mock-data/lib/generators/genBins";
import { scaleBand, scaleLinear } from "@visx/scale";
import { Alchemy, AssetTransfersCategory, Network, SortingOrder } from "alchemy-sdk";
import { eachDayOfInterval, format } from "date-fns";
import { useAccount } from "wagmi";
import scaffoldConfig from "~~/scaffold.config";

const hot1 = "#77312f";
const hot2 = "#f33d15";
const background = "#28272c";

function max<Datum>(data: Datum[], value: (d: Datum) => number): number {
  if (data == undefined) {
    return 0;
  }
  return Math.max(...data.map(value));
}

interface HeatmapData {
  date: string;
  count: number;
}

interface BlockData {
  network: string;
  block: {
    number: number;
    timestamp: string;
  }
}

const config = {
  apiKey: scaffoldConfig.alchemyApiKey, // Replace with your Alchemy API key.
  network: Network.ETH_MAINNET, // Replace with your network.
};

const getBlockByTimestamp = async (timestamp: string): Promise<BlockData | undefined> => {
  const apiKey = scaffoldConfig.alchemyApiKey;
  if (!apiKey) {
    console.error('API key is missing in the environment variables.');
    return;
  }

  const url = `https://api.g.alchemy.com/data/v1/${apiKey}/utility/blocks/by-timestamp?networks=eth-mainnet&timestamp=${encodeURIComponent(timestamp)}&direction=AFTER`;

  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
    },
  };

  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(data)
    const blockData: BlockData = {
      network: 'eth-mainnet', // Static network or dynamic based on response if needed
      block: {
        number: data.data[0].block.number,
        timestamp: data.data[0].block.timestamp,
      },
    };

    console.log('Block data:', blockData);
    return blockData;
  } catch (err) {
    console.error('Error fetching block by timestamp:', err);
  }
};

const getDailyTxCounts = async (walletAddress: string | undefined, year: number) => {
  if (!walletAddress) {
    return [];
  }
  const alchemy = new Alchemy(config);

  const start = new Date(`${year}-01-01T00:00:00Z`);
  const end = new Date(`${year}-12-31T23:59:59Z`);

  const startBlock = await getBlockByTimestamp(start.toISOString());
  const endBlock = await getBlockByTimestamp(end.toISOString());
  
  const dates = eachDayOfInterval({ start, end });
  const txCounts: { date: string; count: number }[] = [];
  const txs: any[] = [];

  let init = true;
  let newPageKey: string | undefined = "";

  while (init || newPageKey) {
    const { transfers, pageKey } = await alchemy.core.getAssetTransfers({
      fromBlock: '0x' + startBlock?.block.number.toString(16),
      toBlock: '0x' + endBlock?.block.number.toString(16),
      fromAddress: walletAddress,
      category: [
        AssetTransfersCategory.EXTERNAL,
        AssetTransfersCategory.ERC20,
        AssetTransfersCategory.ERC721,
        AssetTransfersCategory.ERC1155,
      ],
      withMetadata: true,
      order: SortingOrder.ASCENDING,
    });
    console.log(pageKey)
    txs.push(...transfers);
    newPageKey = pageKey;
    init = false;
  }

  for (const date of dates) {
    const dayStart = Math.floor(new Date(format(date, "yyyy-MM-dd") + "T00:00:00Z").getTime() / 1000);
    const dayEnd = Math.floor(new Date(format(date, "yyyy-MM-dd") + "T23:59:59Z").getTime() / 1000);

    // Filter transactions within this day based on block timestamp
    const filtered = txs.filter(tx => {
      const txTime = Math.floor(new Date(tx.metadata.blockTimestamp).getTime() / 1000);
      return txTime >= dayStart && txTime <= dayEnd;
    });

    txCounts.push({
      date: format(date, "yyyy-MM-dd"),
      count: filtered.length,
    });
  }

  return txCounts;
};

export const SquareHeatmap = ({ svgRef }: { svgRef: RefObject<SVGSVGElement | null> }) => {
  // const { address: connectedAddress } = useAccount();
  const connectedAddress = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";
  const [txCounts, setTxCounts] = useState<HeatmapData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const dataYear = 2024;
  const currentYear = dataYear;

  // const connectedAddress = "0x3ddfa8ec3052539b6c9549f12cea2c295cff5296";

  useEffect(() => {
    const fetchData = async () => {
      if (connectedAddress) {
        setLoading(true);
        try {
          const data = await getDailyTxCounts(connectedAddress, currentYear);
          console.log(data);
          setTxCounts(data);
        } catch (error) {
          console.error("Error fetching transaction counts:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [connectedAddress, currentYear]);

  // Create the grid for the heatmap (12 rows for months, 12 columns for blocks in the month)
  const gridData = Array(12)
    .fill(null)
    .map((_, rowIndex) => ({
      bin: rowIndex,
      bins: Array(12)
        .fill(null)
        .map((_, columnIndex) => ({
          bin: columnIndex,
          count: 0,
          row: rowIndex,
          column: columnIndex,
        })),
    }));

  txCounts.forEach(entry => {
    const date = new Date(entry.date);
    const month = date.getMonth(); // Get month (0-11)
    const day = date.getDate(); // Get day of the month (1-31)

    // Determine which "block" within the month the transaction count belongs to
    const blockIndex = Math.floor((day - 1) / 3); // Dividing days into 12 blocks (each block for approx. 3 days)
    gridData[month].bins[blockIndex].count = entry.count; // Fill the grid with transaction counts
  });

  console.log(gridData);

  const width = 400; // Adjust width as necessary
  const height = 400; // Adjust height as necessary
  const radius = 400 / 12 / 2;

  const xScale = scaleBand<number>({
    domain: Array.from({ length: 12 }, (_, i) => i), // 12 blocks (columns) for each month
    padding: 0.1,
  });

  const yScale = scaleBand<number>({
    domain: Array.from({ length: 12 }, (_, i) => i), // 12 months (rows)
    padding: 0.1,
  });

  // accessors
  const bins = (d: Bins) => d.bins;
  const count = (d: Bin) => d.count;

  xScale.range([0, width]);
  yScale.range([height, 0]);

  const colorMax = max(gridData, d => max(bins(d), count));
  const circleColorScale = scaleLinear<string>({
    range: [hot1, hot2],
    domain: [0, colorMax],
  });
  const opacityScale = scaleLinear<number>({
    range: [0.1, 1],
    domain: [0, colorMax],
  });

  return (
    <div className="square-heatmap" style={{ width, height }}>
      {loading ? (
        <div className="flex justify-center items-center mt-10">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : (
        <svg ref={svgRef} width={width} height={height} fill={background}>
          <rect x={0} y={0} width={width} height={height} rx={14} fill={background} />
          <Group>
            <HeatmapCircle
              data={gridData}
              xScale={d => xScale(d) ?? 0}
              yScale={d => yScale(d) ?? 0}
              colorScale={circleColorScale}
              opacityScale={opacityScale}
              radius={radius}
              gap={2}
            >
              {heatmap =>
                heatmap.map(heatmapBins =>
                  heatmapBins.map(bin => (
                    <circle
                      key={`heatmap-circle-${bin.row}-${bin.column}`}
                      className="visx-heatmap-circle"
                      cx={bin.cx}
                      cy={bin.cy}
                      r={bin.r}
                      fill={bin.color}
                      fillOpacity={bin.opacity}
                    />
                  )),
                )
              }
            </HeatmapCircle>
          </Group>

          <AxisBottom scale={xScale} top={height} />
          <AxisLeft scale={yScale} />
        </svg>
      )}
    </div>
  );
};
