import { useEffect, useState } from "react";
import { getStatsForRange } from "@/lib/db";
import type { StatsResult, MonthStats } from "@/types";
import { useData } from "@/contexts/DataContext";
import { useAppContext } from "@/contexts/AppContext";
import {
  SpendBarChart, DistanceBarChart, CostPerKmBarChart,
  FuelEconomyLineChart, FuelUsageBarChart, CategoryBarChart, YearlySpendBarChart, CHART_COLORS,
} from "@/components/Charts";
import { formatDistance, formatCurrency, formatEfficiency, formatDuration, formatVolume } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Award, MapPin, Calendar, Zap, BarChart2, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type CategoryTab = "distance" | "cost" | "fuel" | "trips";

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

const INSIGHT_COLORS: Record<string, { bg: string; text: string }> = {
  primary:     { bg: "bg-primary/10",                                                text: "text-primary" },
  accent:      { bg: "bg-amber-100 dark:bg-amber-900/40",                            text: "text-amber-600 dark:text-amber-400" },
  destructive: { bg: "bg-rose-100 dark:bg-rose-900/40",                              text: "text-rose-600 dark:text-rose-400" },
  success:     { bg: "bg-emerald-100 dark:bg-emerald-900/40",                        text: "text-emerald-600 dark:text-emerald-400" },
};

function InsightCard({ icon, label, value, sub, color = "primary" }: {
  icon: React.ReactNode; label: string; value: string; sub?: string; color?: string;
}) {
  const c = INSIGHT_COLORS[color] ?? INSIGHT_COLORS.primary;
  return (
    <div className="bg-card border border-card-border rounded-2xl p-4 flex items-center gap-3">
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", c.bg)}>
        <span className={c.text}>{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide">{label}</p>
        <p className="text-sm font-bold leading-tight">{value}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}

function TabBar<T extends string>({ tabs, active, onChange }: { tabs: { key: T; label: string }[]; active: T; onChange: (k: T) => void }) {
  return (
    <div className="flex gap-1 bg-muted/60 rounded-xl p-1">
      {tabs.map(t => (
        <button key={t.key} onClick={() => onChange(t.key)}
          className={cn("flex-1 py-1.5 px-1 text-xs font-semibold rounded-lg transition-all",
            active === t.key ? "bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground")}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

// Month detail view
function MonthDetailCard({ m, currency, unit, effUnit, volUnit }: {
  m: MonthStats; currency: string; unit: string; effUnit: string; volUnit: string;
}) {
  return (
    <div className="bg-card border border-card-border rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-primary/5">
        <p className="font-bold text-primary">{m.label}</p>
      </div>
      <StatRow label="Distance" value={formatDistance(m.distance, unit as any)} />
      <StatRow label="Trip Count" value={`${m.tripCount} trip${m.tripCount !== 1 ? "s" : ""}`} />
      <StatRow label="Fill-Up Count" value={`${m.fillUpCount}`} />
      <StatRow label="Est. Fuel Cost" value={formatCurrency(m.fuelCost, currency)} sub="fuel consumed by trips" highlight />
      <StatRow label="Fuel Purchased" value={formatCurrency(m.fuelPurchased, currency)} sub="fill-ups this month" />
      {m.fuelEconomy > 0 && <StatRow label="Avg Fuel Economy" value={formatEfficiency(m.fuelEconomy, effUnit as any)} />}
      {m.costPerKm > 0 && <StatRow label={`Cost per ${unit}`} value={`${currency}${m.costPerKm.toFixed(4)}/${unit}`} />}
    </div>
  );
}

export default function Analytics() {
  const { trips, fillUps, isLoading: dataLoading } = useData();
  const { settings } = useAppContext();
  const [stats, setStats] = useState<StatsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [catTab, setCatTab] = useState<CategoryTab>("distance");
  const [selectedMonthIdx, setSelectedMonthIdx] = useState<number | null>(null);

  useEffect(() => {
    if (dataLoading) return;
    getStatsForRange("", "").then(setStats).catch(console.error).finally(() => setLoading(false));
  }, [trips, fillUps, dataLoading]);

  const unit = settings?.units.distance || "km";
  const currency = settings?.units.currency || "$";
  const effUnit = settings?.units.fuelEfficiency || "L/100km";
  const volUnit = settings?.units.volume || "liters";

  const allMonths = stats?.allMonths ?? [];

  // Default to latest month when data loads
  useEffect(() => {
    if (allMonths.length > 0 && selectedMonthIdx === null) {
      setSelectedMonthIdx(allMonths.length - 1);
    }
  }, [allMonths.length]);

  const selectedMonth = selectedMonthIdx != null ? allMonths[selectedMonthIdx] : null;

  if (loading || dataLoading) {
    return <div className="flex flex-col gap-4 pt-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-52 rounded-2xl" />)}</div>;
  }

  if (!stats) return <div className="py-12 text-center text-muted-foreground">Error loading analytics</div>;
  if (trips.length === 0 && fillUps.length === 0) {
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

  const CAT_TABS: { key: CategoryTab; label: string }[] = [
    { key: "distance", label: "Distance" },
    { key: "cost", label: "Cost" },
    { key: "fuel", label: "Fuel" },
    { key: "trips", label: "Trips" },
  ];
  const categoryData: Record<CategoryTab, { data: any[]; formatter: (v: number) => string }> = {
    distance: { data: stats.categoryDistance, formatter: v => `${v.toFixed(1)} km` },
    cost: { data: stats.categoryFuelCost, formatter: v => `${currency}${v.toFixed(2)}` },
    fuel: { data: stats.categoryFuelUsed, formatter: v => `${v.toFixed(2)} L` },
    trips: { data: stats.categoryTripCount, formatter: v => `${v}` },
  };

  const momChange = stats.monthlySpend.length >= 2
    ? (() => {
        const cur = stats.monthlySpend[stats.monthlySpend.length - 1].spend;
        const prev = stats.monthlySpend[stats.monthlySpend.length - 2].spend;
        return prev > 0 ? (cur - prev) / prev * 100 : null;
      })()
    : null;

  const avgPricePerL = fillUps.length > 0 ? fillUps.reduce((s, f) => s + f.pricePerUnit, 0) / fillUps.length : 0;
  const buildCatStats = (cat: string) => {
    const catTrips = trips.filter(t => t.category === cat);
    const distance = catTrips.reduce((s, t) => s + t.distance, 0);
    const avgL100 = stats.lifetime.avgFuelConsumption;
    const estimatedLiters = avgL100 > 0 ? (distance / 100) * avgL100 : 0;
    return { distance, count: catTrips.length, estimatedCost: estimatedLiters * avgPricePerL };
  };
  const commuteStats = buildCatStats("Commute");
  const partnerStats = buildCatStats("Partner");

  return (
    <div className="flex flex-col gap-5 page-enter pb-8 pt-4">
      <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>

      {/* ── Month selector ── */}
      {allMonths.length > 0 && (
        <div>
          <SectionHeader title="Monthly Detail" icon={<Calendar className="h-4 w-4" />} />
          <div className="flex items-center gap-2 mb-3">
            <button
              disabled={selectedMonthIdx === 0}
              onClick={() => setSelectedMonthIdx(i => Math.max(0, (i ?? 0) - 1))}
              className="w-9 h-9 rounded-xl border border-border bg-card flex items-center justify-center disabled:opacity-30">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex-1 overflow-x-auto">
              <div className="flex gap-1.5 justify-center">
                {allMonths.slice(-12).map((m, i) => {
                  const absIdx = allMonths.length - Math.min(12, allMonths.length) + i;
                  return (
                    <button key={m.month} onClick={() => setSelectedMonthIdx(absIdx)}
                      className={cn("px-2 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all shrink-0",
                        selectedMonthIdx === absIdx ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground")}>
                      {m.label.split(" ")[0]}
                    </button>
                  );
                })}
              </div>
            </div>
            <button
              disabled={selectedMonthIdx === allMonths.length - 1}
              onClick={() => setSelectedMonthIdx(i => Math.min(allMonths.length - 1, (i ?? 0) + 1))}
              className="w-9 h-9 rounded-xl border border-border bg-card flex items-center justify-center disabled:opacity-30">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          {selectedMonth && (
            <MonthDetailCard m={selectedMonth} currency={currency} unit={unit} effUnit={effUnit} volUnit={volUnit} />
          )}
        </div>
      )}

      {/* ── Insights ── */}
      <div className="grid grid-cols-2 gap-2.5">
        {stats.avgTripDistance > 0 && <InsightCard icon={<TrendingUp className="h-4 w-4" />} label="Avg Trip" value={formatDistance(stats.avgTripDistance, unit as any)} color="primary" />}
        {stats.longestTrip && <InsightCard icon={<Award className="h-4 w-4" />} label="Longest Trip" value={formatDistance(stats.longestTrip.distance, unit as any)} sub={stats.longestTrip.category} color="accent" />}
        {stats.mostExpensiveMonth?.spend > 0 && <InsightCard icon={<Calendar className="h-4 w-4" />} label="Priciest Month" value={formatCurrency(stats.mostExpensiveMonth.spend, currency)} sub={stats.mostExpensiveMonth.month} color="destructive" />}
        {stats.cheapestStation && <InsightCard icon={<MapPin className="h-4 w-4" />} label="Best Price" value={`${currency}${stats.cheapestStation.avgPrice.toFixed(3)}/L`} sub={stats.cheapestStation.station} color="success" />}
      </div>

      {/* ── Charts ── */}
      {stats.monthlySpend.some(m => m.spend > 0) && (
        <>
          <ChartCard title="Monthly Fuel Cost (consumed)" icon={<BarChart2 className="h-4 w-4" />}>
            <SpendBarChart data={stats.monthlySpend} />
          </ChartCard>
          {momChange !== null && (
            <div className={cn("flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl border",
              momChange < 0
                ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-400"
                : "bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-400")}>
              {momChange < 0 ? <TrendingDown className="h-4 w-4 shrink-0" /> : <TrendingUp className="h-4 w-4 shrink-0" />}
              <span className="font-semibold">{Math.abs(momChange).toFixed(1)}% {momChange < 0 ? "less" : "more"} than last month</span>
            </div>
          )}
        </>
      )}
      {stats.yearlySpend?.some(y => y.spend > 0) && <ChartCard title="Yearly Spending" icon={<Calendar className="h-4 w-4" />}><YearlySpendBarChart data={stats.yearlySpend} /></ChartCard>}
      {stats.monthlyDistance.some(m => m.distance > 0) && <ChartCard title="Monthly Distance"><DistanceBarChart data={stats.monthlyDistance} /></ChartCard>}
      {stats.fuelEconomyHistory.length > 1 && <ChartCard title="Fuel Economy Trend" icon={<Zap className="h-4 w-4" />}><FuelEconomyLineChart data={stats.fuelEconomyHistory} /></ChartCard>}
      {stats.monthlyCostPerKm.some(m => m.costPerKm > 0) && <ChartCard title={`Monthly Cost per ${unit}`}><CostPerKmBarChart data={stats.monthlyCostPerKm} /></ChartCard>}
      {stats.fuelUsageHistory.some(f => f.liters > 0) && <ChartCard title="Fuel Per Fill-Up"><FuelUsageBarChart data={stats.fuelUsageHistory} /></ChartCard>}

      {/* ── Lifetime ── */}
      {trips.length > 0 && (
        <div>
          <SectionHeader title="Lifetime Summary" />
          <div className="bg-card border border-card-border rounded-2xl overflow-hidden">
            <StatRow label="Total Distance" value={formatDistance(stats.lifetime.totalDistance, unit as any)} />
            <StatRow label="Total Trips" value={`${stats.lifetime.totalTrips}`} />
            <StatRow label="Average Trip" value={stats.avgTripDistance > 0 ? formatDistance(stats.avgTripDistance, unit as any) : "—"} />
            <StatRow label="Total Fuel Cost" value={formatCurrency(stats.lifetime.totalFuelCost, currency)} highlight />
            <StatRow label="Total Fuel Used" value={formatVolume(stats.lifetime.totalFuelUsed, volUnit)} />
            <StatRow label="Avg Fuel Economy" value={stats.lifetime.avgFuelConsumption > 0 ? formatEfficiency(stats.lifetime.avgFuelConsumption, effUnit as any) : "—"} />
            <StatRow label={`Cost per ${unit}`} value={stats.lifetime.costPerKm > 0 ? `${currency}${stats.lifetime.costPerKm.toFixed(4)}/${unit}` : "—"} />
            {stats.lifetime.totalDriveTime > 0 && <StatRow label="Total Drive Time" value={formatDuration(stats.lifetime.totalDriveTime)} />}
          </div>
        </div>
      )}

      {/* ── Categories ── */}
      {trips.length > 0 && (
        <div>
          <SectionHeader title="By Category" />
          <TabBar tabs={CAT_TABS} active={catTab} onChange={setCatTab} />
          <div className="mt-2">
            {categoryData[catTab].data.length > 0 && (
              <div className="bg-card border border-card-border rounded-2xl p-4 h-44 mb-2">
                <CategoryBarChart data={categoryData[catTab].data} valueKey="value" formatter={categoryData[catTab].formatter} />
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

      {/* ── Commute ── */}
      {commuteStats.count > 0 && (
        <div>
          <SectionHeader title="🚗 Commute Stats" />
          <div className="bg-card border border-card-border rounded-2xl overflow-hidden">
            <StatRow label="Total Distance" value={formatDistance(commuteStats.distance, unit as any)} />
            <StatRow label="Trips" value={`${commuteStats.count}`} />
            <StatRow label="Avg Trip" value={formatDistance(commuteStats.distance / commuteStats.count, unit as any)} />
            {commuteStats.estimatedCost > 0 && <StatRow label="Est. Fuel Cost" value={formatCurrency(commuteStats.estimatedCost, currency)} sub="based on avg consumption & price" />}
          </div>
        </div>
      )}

      {/* ── Partner ── */}
      {partnerStats.count > 0 && (
        <div>
          <SectionHeader title="❤️ Partner Stats" />
          <div className="bg-card border border-card-border rounded-2xl overflow-hidden">
            <StatRow label="Total Distance" value={formatDistance(partnerStats.distance, unit as any)} />
            <StatRow label="Trips" value={`${partnerStats.count}`} />
            {partnerStats.estimatedCost > 0 && <StatRow label="Est. Fuel Cost" value={formatCurrency(partnerStats.estimatedCost, currency)} />}
          </div>
        </div>
      )}

      {/* ── Stations ── */}
      {stats.stationStats.length > 0 && (
        <div>
          <SectionHeader title="Stations" icon={<MapPin className="h-4 w-4" />} />
          <div className="bg-card border border-card-border rounded-2xl overflow-hidden">
            {stats.stationStats.map((s, i) => (
              <div key={s.station} className={cn("px-4 py-3 border-b border-border last:border-0 flex items-center gap-3", i === 0 && "bg-primary/5")}>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{s.station}</p>
                  <p className="text-xs text-muted-foreground">{s.visits} visit{s.visits !== 1 ? "s" : ""} · avg {currency}{s.avgPrice.toFixed(3)}/L</p>
                </div>
                <span className={cn("font-bold text-sm", i === 0 && "text-primary")}>{formatCurrency(s.totalSpend, currency)}</span>
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
                  <p className="text-xs text-muted-foreground">{f.station || "Unknown"} · {f.fuelGrade || "Regular"}</p>
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
