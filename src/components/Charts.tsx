import {
  Bar, BarChart as RechartsBarChart, ResponsiveContainer, XAxis, YAxis,
  Tooltip, CartesianGrid, Line, LineChart as RechartsLineChart,
  PieChart as RechartsPieChart, Pie, Cell, Area, AreaChart as RechartsAreaChart,
} from "recharts";

const TOOLTIP_STYLE = {
  backgroundColor: "hsl(var(--card))",
  borderColor: "hsl(var(--border))",
  borderRadius: "10px",
  fontSize: "12px",
  boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
  padding: "8px 12px",
};
const AXIS_TICK = { fill: "hsl(var(--muted-foreground))", fontSize: 11 };
const GRID_STYLE = { strokeDasharray: "3 3", vertical: false, stroke: "hsl(var(--border))" };

interface ChartProps {
  data: any[];
  className?: string;
}

export function SpendBarChart({ data, className }: ChartProps) {
  return (
    <div className={className} style={{ width: "100%", height: "100%" }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid {...GRID_STYLE} />
          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={AXIS_TICK} />
          <YAxis axisLine={false} tickLine={false} tick={AXIS_TICK} width={42} tickFormatter={(v) => `$${v}`} />
          <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "hsl(var(--primary)/0.06)" }} formatter={(v: number) => [`$${v.toFixed(2)}`, "Spent"]} />
          <Bar dataKey="spend" fill="hsl(var(--primary))" radius={[5, 5, 0, 0]} maxBarSize={40} />
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function YearlySpendBarChart({ data, className }: ChartProps) {
  return (
    <div className={className} style={{ width: "100%", height: "100%" }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid {...GRID_STYLE} />
          <XAxis dataKey="year" axisLine={false} tickLine={false} tick={AXIS_TICK} />
          <YAxis axisLine={false} tickLine={false} tick={AXIS_TICK} width={50} tickFormatter={(v) => `$${v}`} />
          <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "hsl(var(--primary)/0.06)" }} formatter={(v: number) => [`$${v.toFixed(2)}`, "Total Spend"]} />
          <Bar dataKey="spend" fill="hsl(280, 70%, 58%)" radius={[5, 5, 0, 0]} maxBarSize={60} />
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DistanceBarChart({ data, className }: ChartProps) {
  return (
    <div className={className} style={{ width: "100%", height: "100%" }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid {...GRID_STYLE} />
          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={AXIS_TICK} />
          <YAxis axisLine={false} tickLine={false} tick={AXIS_TICK} width={38} />
          <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "hsl(148 72% 40%/0.06)" }} formatter={(v: number) => [`${v.toFixed(1)} km`, "Distance"]} />
          <Bar dataKey="distance" fill="hsl(148, 72%, 40%)" radius={[5, 5, 0, 0]} maxBarSize={40} />
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CostPerKmBarChart({ data, className }: ChartProps) {
  return (
    <div className={className} style={{ width: "100%", height: "100%" }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid {...GRID_STYLE} />
          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={AXIS_TICK} />
          <YAxis axisLine={false} tickLine={false} tick={AXIS_TICK} width={46} tickFormatter={(v) => `$${v.toFixed(2)}`} />
          <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "hsl(38 95% 52%/0.06)" }} formatter={(v: number) => [`$${v.toFixed(4)}/km`, "Cost/km"]} />
          <Bar dataKey="costPerKm" fill="hsl(38, 95%, 52%)" radius={[5, 5, 0, 0]} maxBarSize={40} />
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function FuelEconomyLineChart({ data, className }: ChartProps) {
  return (
    <div className={className} style={{ width: "100%", height: "100%" }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsAreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="econGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid {...GRID_STYLE} />
          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={AXIS_TICK} />
          <YAxis domain={["auto", "auto"]} axisLine={false} tickLine={false} tick={AXIS_TICK} width={34} />
          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`${v.toFixed(1)} L/100km`, "Economy"]} />
          <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2.5}
            fill="url(#econGradient)"
            dot={{ r: 4, fill: "hsl(var(--card))", stroke: "hsl(var(--primary))", strokeWidth: 2.5 }}
            activeDot={{ r: 6, fill: "hsl(var(--primary))" }} />
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function FuelUsageBarChart({ data, className }: ChartProps) {
  return (
    <div className={className} style={{ width: "100%", height: "100%" }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid {...GRID_STYLE} />
          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={AXIS_TICK} />
          <YAxis axisLine={false} tickLine={false} tick={AXIS_TICK} width={34} />
          <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "hsl(200 80% 52%/0.06)" }} formatter={(v: number) => [`${v.toFixed(2)} L`, "Fuel"]} />
          <Bar dataKey="liters" fill="hsl(200, 75%, 50%)" radius={[5, 5, 0, 0]} maxBarSize={40} />
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}

export const CHART_COLORS = [
  "hsl(234, 82%, 58%)",
  "hsl(38, 95%, 52%)",
  "hsl(148, 72%, 40%)",
  "hsl(280, 70%, 58%)",
  "hsl(340, 75%, 58%)",
  "hsl(200, 75%, 50%)",
];

export function CategoryBarChart({ data, valueKey, className, formatter }: ChartProps & { valueKey: string; formatter?: (v: number) => string }) {
  return (
    <div className={className} style={{ width: "100%", height: "100%" }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart data={data} layout="vertical" margin={{ top: 4, right: 8, left: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
          <XAxis type="number" axisLine={false} tickLine={false} tick={AXIS_TICK} tickFormatter={formatter} />
          <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={AXIS_TICK} width={72} />
          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [formatter ? formatter(v) : v, ""]} />
          <Bar dataKey={valueKey} radius={[0, 5, 5, 0]} maxBarSize={24}>
            {data.map((_: any, i: number) => (
              <Cell key={`cell-${i}`} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Bar>
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CategoryPieChart({ data, className }: ChartProps) {
  return (
    <div className={className} style={{ width: "100%", height: "100%" }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
          <Pie data={data} cx="50%" cy="50%" innerRadius={44} outerRadius={66} paddingAngle={3} dataKey="value" strokeWidth={0}>
            {data.map((_: any, i: number) => (
              <Cell key={`cell-${i}`} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [Number(v).toFixed(1), ""]} />
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
}
