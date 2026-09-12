"use client";

import type { UIToolInvocation } from "ai";
import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker";
import { Spinner } from "@/components/ui/spinner";
import type { financialChartTool } from "@/lib/ai/tools";

export type FinancialChartProps = UIToolInvocation<typeof financialChartTool>;

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const compactCurrencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  notation: "compact",
  maximumFractionDigits: 1,
});

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export function FinancialChart(props: FinancialChartProps) {
  const output = "output" in props ? props.output : undefined;
  const state = props.state;
  const errorText = "errorText" in props ? props.errorText : undefined;

  const chartType = output?.chartType ?? "donut";
  const data = output?.data ?? [];
  const title = output?.title ?? "Financial Chart";
  const description = output?.description;
  const primaryLabel = output?.primaryKeyLabel ?? "Amount";
  const secondaryLabel = output?.secondaryKeyLabel;
  const totalLabel = output?.totalLabel ?? "Total";
  const calculatedTotal =
    output?.calculatedTotal ??
    data.reduce((acc, curr) => acc + (curr.value || 0), 0);

  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {
      value: {
        label: primaryLabel,
        color: "var(--chart-1)",
      },
      secondaryValue: {
        label: secondaryLabel ?? "Secondary",
        color: "var(--chart-2)",
      },
    };

    data.forEach((item, index) => {
      config[item.label] = {
        label: item.label,
        color: CHART_COLORS[index % CHART_COLORS.length],
      };
    });

    return config;
  }, [data, primaryLabel, secondaryLabel]);

  if (state === "input-streaming" || state === "input-available") {
    return (
      <Marker role="status" className="my-2">
        <MarkerIcon>
          <Spinner />
        </MarkerIcon>
        <MarkerContent className="shimmer">
          Generating financial chart...
        </MarkerContent>
      </Marker>
    );
  }

  if (state === "output-error" || errorText) {
    return (
      <Card size="sm" className="w-full max-w-sm my-2">
        <CardContent className="text-destructive text-xs">
          Failed to load chart: {errorText ?? "Unknown error occurred"}
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return null;
  }

  return (
    <Card size="sm" className="w-full max-w-md my-2">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {calculatedTotal > 0 && (
            <div className="text-right">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground block">
                {totalLabel}
              </span>
              <span className="text-sm font-semibold tabular-nums text-foreground">
                {currencyFormatter.format(calculatedTotal)}
              </span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {chartType === "donut" && (
          <div className="flex flex-col gap-3">
            <ChartContainer
              config={chartConfig}
              className="mx-auto aspect-square max-h-[220px] w-full"
            >
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      hideLabel
                      formatter={(value, name) => (
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">
                            {String(name)}:
                          </span>
                          <span className="font-semibold tabular-nums">
                            {currencyFormatter.format(Number(value))}
                          </span>
                        </div>
                      )}
                    />
                  }
                />
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="label"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                >
                  {data.map((item, index) => (
                    <Cell
                      key={`cell-${item.label}`}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>

            {/* Compact Category Legend */}
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 pt-1 border-t text-xs">
              {data.map((item, index) => (
                <div
                  key={`legend-${item.label}`}
                  className="flex items-center justify-between gap-1.5"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{
                        backgroundColor:
                          CHART_COLORS[index % CHART_COLORS.length],
                      }}
                    />
                    <span className="truncate text-muted-foreground text-[11px]">
                      {item.label}
                    </span>
                  </div>
                  <span className="tabular-nums font-medium text-[11px]">
                    {compactCurrencyFormatter.format(item.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {chartType === "bar" && (
          <ChartContainer config={chartConfig} className="h-[200px] w-full">
            <BarChart
              data={data}
              margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={6}
                fontSize={11}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => compactCurrencyFormatter.format(val)}
                fontSize={10}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => (
                      <span className="font-semibold tabular-nums">
                        {currencyFormatter.format(Number(value))}
                      </span>
                    )}
                  />
                }
              />
              <Bar
                dataKey="value"
                name={primaryLabel}
                fill="var(--chart-1)"
                radius={[4, 4, 0, 0]}
              />
              {secondaryLabel && (
                <Bar
                  dataKey="secondaryValue"
                  name={secondaryLabel}
                  fill="var(--chart-2)"
                  radius={[4, 4, 0, 0]}
                />
              )}
            </BarChart>
          </ChartContainer>
        )}

        {chartType === "area" && (
          <ChartContainer config={chartConfig} className="h-[200px] w-full">
            <AreaChart
              data={data}
              margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="fillArea" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--chart-1)"
                    stopOpacity={0.4}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--chart-1)"
                    stopOpacity={0.05}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={6}
                fontSize={11}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => compactCurrencyFormatter.format(val)}
                fontSize={10}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => (
                      <span className="font-semibold tabular-nums">
                        {currencyFormatter.format(Number(value))}
                      </span>
                    )}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="var(--chart-1)"
                fill="url(#fillArea)"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        )}

        {chartType === "line" && (
          <ChartContainer config={chartConfig} className="h-[200px] w-full">
            <LineChart
              data={data}
              margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={6}
                fontSize={11}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => compactCurrencyFormatter.format(val)}
                fontSize={10}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value) => (
                      <span className="font-semibold tabular-nums">
                        {currencyFormatter.format(Number(value))}
                      </span>
                    )}
                  />
                }
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--chart-1)"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
