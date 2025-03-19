"use client";

import React, { useEffect, useState } from "react";
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

const config = {
  apiKey: scaffoldConfig.alchemyApiKey, // Replace with your Alchemy API key.
  network: Network.LINEA_MAINNET, // Replace with your network.
};

const getDailyTxCounts = async (walletAddress: string | undefined, year: number) => {
  if (!walletAddress) {
    return [];
  }
  const alchemy = new Alchemy(config);

  const start = new Date(`${year}-01-01T00:00:00Z`);
  const end = new Date(`${year}-12-31T23:59:59Z`);

  const dates = eachDayOfInterval({ start, end });

  const txCounts: { date: string; count: number }[] = [];

  const txs: any[] = [];

  let init = true;
  let newPageKey: string | undefined = "";

  while (init || newPageKey) {
    const { transfers, pageKey } = await alchemy.core.getAssetTransfers({
      fromBlock: "0x0",
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

export const SquareHeatmap = () => {
  const { address: connectedAddress } = useAccount();
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
        <svg width={width} height={height} fill={background}>
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
