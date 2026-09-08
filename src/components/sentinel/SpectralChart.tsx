import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { SensorReading } from "@/lib/sentinel/types";

const axis = {
  stroke: "var(--muted-foreground)",
  fontSize: 11,
  fontFamily: "var(--font-mono)",
};

export function SpectralChart({
  reading,
  height = 260,
}: {
  reading: SensorReading;
  height?: number;
}) {
  /*
   * The current Expo detector provides a single spectral reading.
   * We use that value to scale a visual spectral response curve.
   *
   * This is a prototype visualization, not raw AS7341 channel data.
   */

  const liveValue =
    Number(reading.spectral_reading) || 2500;

  const liveScale = Math.max(
    0.2,
    Math.min(1.1, liveValue / 2500),
  );

  const wavelengths = [
    400,
    450,
    500,
    550,
    600,
    650,
    700,
    750,
    800,
  ];

  const center = 550;
  const spread = 90;

  const data = wavelengths.map((nm) => {
    const distance =
      (nm - center) / spread;

    const reference =
      Math.exp(
        -(distance * distance) / 2,
      );

    const variation =
      Math.sin(nm / 70) * 0.025;

    const live = Math.min(
      1.1,
      reference * liveScale +
        variation,
    );

    return {
      nm: `${nm}`,
      live: Number(live.toFixed(3)),
      reference: Number(
        reference.toFixed(3),
      ),
    };
  });

  return (
    <ResponsiveContainer
      width="100%"
      height={height}
    >
      <LineChart
        data={data}
        margin={{
          top: 8,
          right: 8,
          bottom: 4,
          left: -18,
        }}
      >
        <CartesianGrid
          stroke="var(--grid-line)"
          strokeDasharray="3 3"
        />

        <XAxis
          dataKey="nm"
          tick={axis}
          tickLine={false}
          axisLine={{
            stroke: "var(--border)",
          }}
          unit="nm"
        />

        <YAxis
          tick={axis}
          tickLine={false}
          axisLine={{
            stroke: "var(--border)",
          }}
          domain={[0, 1.1]}
        />

        <Tooltip
          contentStyle={{
            background: "var(--popover)",
            border:
              "1px solid var(--border)",
            borderRadius: 8,
            fontSize: 12,
          }}
        />

        <Legend
          wrapperStyle={{
            fontSize: 11,
            fontFamily:
              "var(--font-mono)",
          }}
        />

        <Line
          type="monotone"
          dataKey="reference"
          name="Reference curve"
          stroke="var(--chart-2)"
          strokeDasharray="5 4"
          strokeWidth={2}
          dot={false}
        />

        <Line
          type="monotone"
          dataKey="live"
          name="Live sensor curve"
          stroke="var(--chart-1)"
          strokeWidth={2.4}
          dot={{ r: 2.5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}