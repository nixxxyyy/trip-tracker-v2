import { useEffect, useState } from "react";
import { getStatsForRange } from "@/lib/db";
import type { StatsResult } from "@/types";
import { useData } from "@/contexts/DataContext";
import { useAppContext } from "@/contexts/AppContext";
import {
  SpendBarChart, DistanceBarChart, CostPerKmBarChart,
  FuelEconomyLineChart, FuelUsageBarChart,
  CategoryBarChart, YearlySpendBarChart, CHART_COLORS,
} from "@/components/Charts";
import { formatDistance, formatCurrency, formatEfficiency, formatDuration, formatVolume } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Award, MapPin, Calendar, Zap, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";

type CategoryTab = "distance" | "cost" | "fuel" | "trips";
type TimeRange = "1m" | "3m" | "6m" | "1y" | "all";

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({ title, icon }: { title: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      {icon && <span className="text-primary">{icon}</span>}
      <h2 className="text-base font-bold tracking-tight">{title}</h2>
    </div>
  );
}

function ChartCard({ title, children, icon }: { title: string; children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="bg-card border border-card-border rounded-2xl overflow-hidden">
      <div className="px-4 pt-4 pb-2 flex items-center gap-2">
        {icon && <span className="text-primary">{icon}</span>}
        <span className="text-sm font-semibold">{title}</span>
      </div>
      <div className="px-4 pb-4 h-44">{children}</div>
    </div>
  );
}

function StatRow({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: boolean }) {
  return (
    <div className={cn("flex justify-between items-center px-4 py-3 border-b border-border last:border-0", highlight && "bg-primary/5")}>
      <div>
        <span className={cn("text-sm", highlight ? "text-foreground font-medium" : "text-muted-foreground")}>{label}</span>
        {sub && <span className="text-xs text-muted-foreground/70 block">{sub}</span>}
      </div>
      <span className={cn("text-sm font-bold", highlight && "text-primary")}>{value}</span>
    </div>
  );
}

function InsightCard({ icon, label, value, sub, color = "primary" }: {
  icon: React.ReactNode; label: string; value: string; sub?: string; color?: string;
}) {
  return (
    <div className="bg-card border border-card-border rounded-2xl p-4 flex items-center gap-3">
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", `bg-${color}/10`)}>
        <span className={`text-${color}`}>{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide">{label}</p>
        <p className="text-sm font-bold leading-tight">{value}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}

function TabBar<T extends string>({ tabs, active, onChange }: {
  tabs: { key: T; label: string }[];
  active: T;
  onChange: (k: T) => void;
}) {
  return (
    <div className="flex gap-1 bg-muted/60 rounded-xl p-1">
      {tabs.map(t => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={cn(
            "flex-1 py-1.5 px-1 text-xs font-semibold rounded-lg transition-all",
            active === t.key
              ? "bg-card shadow text-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function Analytics() {
  const { trips, fillUps, isLoading: dataLoading } = useData();
  const { settings } = useAppContext();
  const [stats, setStats] = useState<StatsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [catTab, setCatTab] = useState<CategoryTab>("distance");

  useEffect(() => {
    if (dataLoading) return;
    getStatsForRange("", "")
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [trips, fillUps, dataLoading]);

  const unit = settings?.units.distance || "km";
  const currency = settings?.units.currency || "$";
  const effUnit = settings?.units.fuelEfficiency || "L/100km";
  const volUnit = settings?.units.volume || "liters";

  if (loading || dataLoading) {
    return (
      <div className="flex flex-col gap-4 pt-4">
        <Skeleton className="h-7 w-32 rounded-lg" />
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-52 rounded-2xl" />)}
      </div>
    );
  }

  if (!stats) return <div className="py-12 text-center text-muted-foreground">Error loading analytics</div>;

  const hasAnyData = trips.length > 0 || fillUps.length > 0;

  if (!hasAnyData) {
    return (
      <div className="pt-4">
        <h1 className="text-2xl font-bold tracking-tight mb-6">Analytics</h1>
        <div className="bg-card border border-card-border rounded-2xl p-8 text-center">
          <BarChart2 className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
          <h3 className="font-bold text-lg">No data yet</h3>
          <p className="text-muted-foreground text-sm mt-1">Add trips and fill-ups to see your analytics.</p>
        </div>
      </div>
    );
  }

  // Category tab data
  const categoryData: Record<CategoryTab, { data: any[]; valueKey: string; formatter: (v: number) => string }> = {
    distance: { data: stats.categoryDistance, valueKey: "value", formatter: v => `${v.toFixed(1)} km` },
    cost: { data: stats.categoryFuelCost, valueKey: "value", formatter: v => `${currency}${v.toFixed(2)}` },
    fuel: { data: stats.categoryFuelUsed, valueKey: "value", formatter: v => `${v.toFixed(2)} L` },
    trips: { data: stats.categoryTripCount, valueKey: "value", formatter: v => `${v}` },
  };

  const CAT_TABS: { key: CategoryTab; label: string }[] = [
    { key: "distance", label: "Distance" },
    { key: "cost", label: "Cost" },
    { key: "fuel", label: "Fuel" },
    { key: "trips", label: "Trips" },
  ];

  const avgPricePerL = fillUps.length > 0
    ? fillUps.reduce((s, f) => s + f.pricePerUnit, 0) / fillUps.length
    : 0;
  const avgL100km = stats.lifetime.avgFuelConsumption;

  const buildCategoryStats = (categoryName: string) => {
    const catTrips = trips.filter(t => t.category === categoryName);
    const distance = catTrips.reduce((s, t) => s + t.distance, 0);
    const driveTime = catTrips.reduce((s, t) => s + (t.duration || 0), 0);
    const count = catTrips.length;
    const estimatedLiters = avgL100km > 0 ? (distance / 100) * avgL100km : 0;
    const estimatedCost = estimatedLiters * avgPricePerL;
    return { distance, driveTime, count, estimatedLiters, estimatedCost };
  };

  const commuteStats = buildCategoryStats("Commute");
  const partnerStats = buildCategoryStats("Partner");

  // Month-over-month spend change
  const spendArr = stats.monthlySpend;
  const thisMonth = spendArr[spendArr.length - 1];
  const lastMonth = spendArr[spendArr.length - 2];
  const momChange = lastMonth?.spend > 0
    ? ((thisMonth.spend - lastMonth.spend) / lastMonth.spend * 100)
    : null;

  return (
    <div className="flex flex-col gap-5 page-enter pb-8 pt-4">
      <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>

      {/* ── Insights row ── */}
      <div className="grid grid-cols-2 gap-2.5">
        {stats.avgTripDistance > 0 && (
          <InsightCard
            icon={<TrendingUp className="h-4 w-4" />}
            label="Avg Trip"
            value={formatDistance(stats.avgTripDistance, unit)}
            color="primary"
          />
        )}
        {stats.longestTrip && (
          <InsightCard
            icon={<Award className="h-4 w-4" />}
            label="Longest Trip"
            value={formatDistance(stats.longestTrip.distance, unit)}
            sub={stats.longestTrip.category}
            color="accent"
          />
        )}
        {stats.mostExpensiveMonth && stats.mostExpensiveMonth.spend > 0 && (
          <InsightCard
            icon={<Calendar className="h-4 w-4" />}
            label="Priciest Month"
            value={formatCurrency(stats.mostExpensiveMonth.spend, currency)}
            sub={stats.mostExpensiveMonth.month}
            color="destructive"
          />
        )}
        {stats.cheapestStation && (
          <InsightCard
            icon={<MapPin className="h-4 w-4" />}
            label="Best Price"
            value={`${currency}${stats.cheapestStation.avgPrice.toFixed(3)}/L`}
            sub={stats.cheapestStation.station}
            color="success"
          />
        )}
      </div>

      {/* ── Monthly spend ── */}
      {stats.monthlySpend.some(m => m.spend > 0) && (
        <>
          <ChartCard title="Monthly Fuel Spending" icon={<BarChart2 className="h-4 w-4" />}>
            <SpendBarChart data={stats.monthlySpend} />
          </ChartCard>
          {momChange !== null && (
            <div className={cn(
              "flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl border",
              momChange < 0
                ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-400"
                : "bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-400"
            )}>
              {momChange < 0 ? <TrendingDown className="h-4 w-4 shrink-0" /> : <TrendingUp className="h-4 w-4 shrink-0" />}
              <span className="font-semibold">
                {Math.abs(momChange).toFixed(1)}% {momChange < 0 ? "less" : "more"} than last month
              </span>
              <span className="text-xs opacity-70 ml-auto">
                {formatCurrency(Math.abs(thisMonth.spend - lastMonth.spend), currency)} {momChange < 0 ? "saved" : "more"}
              </span>
            </div>
          )}
        </>
      )}

      {/* ── Yearly spend ── */}
      {stats.yearlySpend && stats.yearlySpend.some(y => y.spend > 0) && (
        <ChartCard title="Yearly Spending" icon={<Calendar className="h-4 w-4" />}>
          <YearlySpendBarChart data={stats.yearlySpend} />
        </ChartCard>
      )}

      {/* ── Monthly distance ── */}
      {stats.monthlyDistance.some(m => m.distance > 0) && (
        <ChartCard title="Monthly Distance">
          <DistanceBarChart data={stats.monthlyDistance} />
        </ChartCard>
      )}

      {/* ── Fuel economy trend ── */}
      {stats.fuelEconomyHistory.length > 1 && (
        <ChartCard title="Fuel Economy Trend" icon={<Zap className="h-4 w-4" />}>
          <FuelEconomyLineChart data={stats.fuelEconomyHistory} />
        </ChartCard>
      )}

      {/* ── Cost per km ── */}
      {stats.monthlyCostPerKm.some(m => m.costPerKm > 0) && (
        <ChartCard title={`Monthly Cost per ${unit}`}>
          <CostPerKmBarChart data={stats.monthlyCostPerKm} />
        </ChartCard>
      )}

      {/* ── Fuel usage per fill-up ── */}
      {stats.fuelUsageHistory.some(f => f.liters > 0) && (
        <ChartCard title="Fuel Per Fill-Up">
          <FuelUsageBarChart data={stats.fuelUsageHistory} />
        </ChartCard>
      )}

      {/* ── Lifetime summary ── */}
      {trips.length > 0 && (
        <div>
          <SectionHeader title="Lifetime Summary" />
          <div className="bg-card border border-card-border rounded-2xl overflow-hidden">
            <StatRow label="Total Distance" value={formatDistance(stats.lifetime.totalDistance, unit)} />
            <StatRow label="Total Trips" value={`${stats.lifetime.totalTrips}`} />
            <StatRow label="Average Trip" value={stats.avgTripDistance > 0 ? formatDistance(stats.avgTripDistance, unit) : "—"} />
            <StatRow label="Total Fuel Cost" value={formatCurrency(stats.lifetime.totalFuelCost, currency)} highlight />
            <StatRow label="Total Fuel Used" value={formatVolume(stats.lifetime.totalFuelUsed, volUnit)} />
            <StatRow label="Avg Fuel Economy" value={stats.lifetime.avgFuelConsumption > 0 ? formatEfficiency(stats.lifetime.avgFuelConsumption, effUnit) : "—"} />
            <StatRow label={`Cost per ${unit}`} value={stats.lifetime.costPerKm > 0 ? `${currency}${stats.lifetime.costPerKm.toFixed(4)}/${unit}` : "—"} />
            {stats.lifetime.totalDriveTime > 0 && (
              <StatRow label="Total Drive Time" value={formatDuration(stats.lifetime.totalDriveTime)} />
            )}
          </div>
        </div>
      )}

      {/* ── Category breakdown ── */}
      {trips.length > 0 && (
        <div>
          <SectionHeader title="By Category" />
          <TabBar tabs={CAT_TABS} active={catTab} onChange={setCatTab} />
          <div className="mt-2">
            {categoryData[catTab].data.length > 0 && (
              <div className="bg-card border border-card-border rounded-2xl p-4 h-44 mb-2">
                <CategoryBarChart
                  data={categoryData[catTab].data}
                  valueKey={categoryData[catTab].valueKey}
                  formatter={categoryData[catTab].formatter}
                />
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {categoryData[catTab].data.map((c, i) => (
                <div key={c.name} className="bg-card border border-card-border rounded-xl px-3 py-2 flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                  <span className="font-medium">{c.name}</span>
                  <span className="text-muted-foreground">{categoryData[catTab].formatter(c.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Commute dashboard ── */}
      {commuteStats.count > 0 && (
        <div>
          <SectionHeader title="🚗 Commute Stats" />
          <div className="bg-card border border-card-border rounded-2xl overflow-hidden">
            <StatRow label="Total Distance" value={formatDistance(commuteStats.distance, unit)} />
            <StatRow label="Trips" value={`${commuteStats.count}`} />
            <StatRow label="Avg Trip" value={commuteStats.count > 0 ? formatDistance(commuteStats.distance / commuteStats.count, unit) : "—"} />
            {commuteStats.estimatedLiters > 0 && (
              <StatRow label="Est. Fuel Used" value={formatVolume(commuteStats.estimatedLiters, volUnit)} sub="based on avg consumption" />
            )}
            {commuteStats.estimatedCost > 0 && (
              <StatRow label="Est. Fuel Cost" value={formatCurrency(commuteStats.estimatedCost, currency)} sub="based on avg price" />
            )}
            {commuteStats.driveTime > 0 && (
              <StatRow label="Drive Time" value={formatDuration(commuteStats.driveTime)} />
            )}
          </div>
        </div>
      )}

      {/* ── Partner dashboard ── */}
      {partnerStats.count > 0 && (
        <div>
          <SectionHeader title="❤️ Partner Stats" />
          <div className="bg-card border border-card-border rounded-2xl overflow-hidden">
            <StatRow label="Total Distance" value={formatDistance(partnerStats.distance, unit)} />
            <StatRow label="Trips" value={`${partnerStats.count}`} />
            <StatRow label="Avg Trip" value={partnerStats.count > 0 ? formatDistance(partnerStats.distance / partnerStats.count, unit) : "—"} />
            {partnerStats.estimatedLiters > 0 && (
              <StatRow label="Est. Fuel Used" value={formatVolume(partnerStats.estimatedLiters, volUnit)} sub="based on avg consumption" />
            )}
            {partnerStats.estimatedCost > 0 && (
              <StatRow label="Est. Fuel Cost" value={formatCurrency(partnerStats.estimatedCost, currency)} sub="based on avg price" />
            )}
          </div>
        </div>
      )}

      {/* ── Station summary ── */}
      {stats.stationStats.length > 0 && (
        <div>
          <SectionHeader title="Stations" icon={<MapPin className="h-4 w-4" />} />
          <div className="bg-card border border-card-border rounded-2xl overflow-hidden">
            {stats.stationStats.map((s, i) => (
              <div key={s.station} className={cn("px-4 py-3 border-b border-border last:border-0 flex items-center gap-3", i === 0 && "bg-primary/5")}>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{s.station}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.visits} visit{s.visits !== 1 ? "s" : ""} · avg {currency}{s.avgPrice.toFixed(3)}/L
                  </p>
                </div>
                <span className={cn("font-bold text-sm", i === 0 && "text-primary")}>
                  {formatCurrency(s.totalSpend, currency)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Fuel price history ── */}
      {fillUps.length > 0 && (
        <div>
          <SectionHeader title="Fuel Price History" />
          <div className="bg-card border border-card-border rounded-2xl overflow-hidden">
            {fillUps.slice(0, 8).map(f => (
              <div key={f.id} className="px-4 py-2.5 border-b border-border last:border-0 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">{new Date(f.date).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}</p>
                  <p className="text-xs text-muted-foreground">{f.station || "Unknown station"} · {f.fuelGrade || "Regular"}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">{currency}{f.pricePerUnit.toFixed(3)}/L</p>
                  <p className="text-xs text-muted-foreground">{formatVolume(f.liters, volUnit)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
