import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Plus, Droplet, Wrench, Fuel, Car, Gauge, TrendingUp, TrendingDown, Calendar, Activity, ChevronRight, AlertTriangle, Zap, MapPin } from "lucide-react";
import { getStatsForRange } from "@/lib/db";
import type { StatsResult, Maintenance } from "@/types";
import { TripCard } from "@/components/TripCard";
import { FillUpCard } from "@/components/FillUpCard";
import { formatDistance, formatCurrency, formatEfficiency, formatVolume } from "@/lib/utils";
import { useAppContext } from "@/contexts/AppContext";
import { useData } from "@/contexts/DataContext";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";

// ── Helpers ──────────────────────────────────────────────────────────────────

function StatCard({
  title, value, sub, icon, accent = false, trend, href
}: {
  title: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  accent?: boolean;
  trend?: { up: boolean; text: string };
  href?: string;
}) {
  const inner = (
    <div className={cn(
      "rounded-2xl p-4 border card-lift cursor-default",
      accent
        ? "bg-primary text-primary-foreground border-primary/20"
        : "bg-card border-card-border"
    )}>
      <div className="flex items-start justify-between mb-3">
        <div className={cn(
          "w-8 h-8 rounded-xl flex items-center justify-center",
          accent ? "bg-white/20" : "bg-primary/10"
        )}>
          <span className={accent ? "text-white" : "text-primary"}>{icon}</span>
        </div>
        {trend && (
          <span className={cn(
            "text-[10px] font-semibold flex items-center gap-0.5 px-1.5 py-0.5 rounded-full",
            accent
              ? "bg-white/20 text-white"
              : trend.up
                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
                : "bg-red-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400"
          )}>
            {trend.up ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
            {trend.text}
          </span>
        )}
      </div>
      <p className={cn("text-[11px] font-semibold tracking-wide uppercase mb-0.5", accent ? "text-white/70" : "text-muted-foreground/70")}>
        {title}
      </p>
      <p className={cn("text-xl font-bold stat-value leading-tight", accent ? "text-white" : "text-foreground")}>
        {value}
      </p>
      {sub && <p className={cn("text-[11px] mt-0.5", accent ? "text-white/60" : "text-muted-foreground")}>{sub}</p>}
    </div>
  );
  if (href) return <Link href={href}>{inner}</Link>;
  return inner;
}

function QuickAction({ href, label, icon, className }: {
  href: string; label: string; icon: React.ReactNode; className?: string;
}) {
  return (
    <Link href={href}>
      <button className={cn(
        "flex flex-col items-center justify-center gap-1.5 w-full py-3 px-2 rounded-2xl text-xs font-semibold transition-all duration-200 active:scale-95",
        className
      )}>
        <span className="text-lg">{icon}</span>
        {label}
      </button>
    </Link>
  );
}

function UpcomingMaintenanceCard({ item, odometer }: { item: Maintenance; odometer: number }) {
  const isDue = item.nextDueKm != null && odometer >= item.nextDueKm;
  const kmLeft = item.nextDueKm != null ? item.nextDueKm - odometer : null;
  const isClose = kmLeft != null && kmLeft < 500 && kmLeft >= 0;

  return (
    <div className={cn(
      "flex items-center gap-3 px-4 py-3 border-b border-border last:border-0",
      isDue ? "bg-rose-50/50 dark:bg-rose-950/20" : isClose ? "bg-amber-50/50 dark:bg-amber-950/20" : ""
    )}>
      <div className={cn(
        "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
        isDue ? "bg-rose-100 dark:bg-rose-900" : isClose ? "bg-amber-100 dark:bg-amber-900" : "bg-muted"
      )}>
        <Wrench className={cn("h-3.5 w-3.5", isDue ? "text-rose-600 dark:text-rose-400" : isClose ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground")} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{item.type}</p>
        {item.nextDueKm != null && (
          <p className={cn("text-xs", isDue ? "text-rose-600 dark:text-rose-400" : isClose ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground")}>
            {isDue ? `Overdue by ${Math.abs(kmLeft!).toLocaleString()} km` : `Due in ${kmLeft!.toLocaleString()} km`}
          </p>
        )}
        {item.nextDueDate && (
          <p className="text-xs text-muted-foreground">Due {format(parseISO(item.nextDueDate), "MMM d, yyyy")}</p>
        )}
      </div>
      {isDue && <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0" />}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { settings } = useAppContext();
  const { trips, fillUps, maintenance, isLoading: dataLoading } = useData();
  const [stats, setStats] = useState<StatsResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (dataLoading) return;
    getStatsForRange("", "")
      .then(setStats)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [trips, fillUps, dataLoading]);

  const unit = settings?.units.distance || "km";
  const currency = settings?.units.currency || "$";
  const effUnit = settings?.units.fuelEfficiency || "L/100km";
  const volUnit = settings?.units.volume || "liters";

  const vehicle = settings?.vehicleInfo;
  const vehicleName = vehicle?.name || (vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : null);

  // Current odometer estimate
  const latestOdometer = Math.max(
    ...trips.filter(t => t.endOdometer != null).map(t => t.endOdometer!),
    ...(fillUps.length > 0 ? [fillUps[0].odometer] : []),
    vehicle?.initialOdometer ?? 0,
  );

  // Upcoming maintenance items
  const upcomingMaintenance = maintenance
    .filter(m => m.nextDueKm != null || m.nextDueDate != null)
    .sort((a, b) => {
      const aKm = a.nextDueKm ?? Infinity;
      const bKm = b.nextDueKm ?? Infinity;
      return aKm - bKm;
    })
    .slice(0, 3);

  // Last fill-up
  const lastFillUp = fillUps[0];

  if (isLoading || dataLoading) {
    return (
      <div className="flex flex-col gap-4 pt-4">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    );
  }

  if (!stats) return <div className="py-12 text-center text-muted-foreground">Error loading stats</div>;

  const lt = stats.lifetime;
  const isEmpty = trips.length === 0 && fillUps.length === 0;

  // Monthly trend for fuel spending
  const thisMonth = stats.monthlySpend[stats.monthlySpend.length - 1];
  const lastMonth = stats.monthlySpend[stats.monthlySpend.length - 2];
  const spendTrend = thisMonth && lastMonth && lastMonth.spend > 0
    ? { up: thisMonth.spend > lastMonth.spend, text: `${Math.abs(((thisMonth.spend - lastMonth.spend) / lastMonth.spend) * 100).toFixed(0)}%` }
    : undefined;

  // Fuel gauge percent
  let fuelPct = 0;
  if (stats.estimatedFuelRemaining != null && vehicle?.fuelTankCapacity) {
    fuelPct = Math.min(100, Math.max(0, (stats.estimatedFuelRemaining / vehicle.fuelTankCapacity) * 100));
  }
  const fuelColor = fuelPct > 50 ? "#22c55e" : fuelPct > 25 ? "#f59e0b" : "#ef4444";

  return (
    <div className="flex flex-col gap-5 page-enter pb-8 pt-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{format(new Date(), "EEEE, MMM d")}</p>
        </div>
        {vehicle && (
          <Link href="/settings">
            <div className="flex items-center gap-2 bg-card border border-card-border rounded-xl px-3 py-2">
              <Car className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="text-xs font-semibold truncate max-w-[100px]">{vehicleName}</span>
            </div>
          </Link>
        )}
      </div>

      {/* ── Empty state ── */}
      {isEmpty && (
        <div className="bg-card border border-card-border rounded-2xl p-8 text-center">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Gauge className="h-7 w-7 text-primary" />
          </div>
          <h3 className="font-bold text-lg mb-1">Ready to track</h3>
          <p className="text-muted-foreground text-sm mb-6">Log your first trip or fill-up to see your stats here.</p>
          <div className="flex gap-3 justify-center">
            <Link href="/add"><Button size="sm">Log Trip</Button></Link>
            <Link href="/add-fillup"><Button size="sm" variant="outline">Log Fill-Up</Button></Link>
          </div>
        </div>
      )}

      {/* ── Quick Actions ── */}
      {!isEmpty && (
        <div className="grid grid-cols-3 gap-2">
          <QuickAction href="/add" label="Add Trip" icon={<MapPin className="h-5 w-5" />} className="action-btn-trip" />
          <QuickAction href="/add-fillup" label="Add Fuel" icon={<Droplet className="h-5 w-5" />} className="action-btn-fuel" />
          <QuickAction href="/maintenance" label="Service" icon={<Wrench className="h-5 w-5" />} className="action-btn-maintenance" />
        </div>
      )}

      {/* ── Fuel gauge ── */}
      {stats.estimatedFuelRemaining != null && vehicle?.fuelTankCapacity && (
        <div className="bg-card border border-card-border rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Fuel className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Fuel Level</span>
            </div>
            <span className="text-sm font-bold">{formatVolume(stats.estimatedFuelRemaining, volUnit)}</span>
          </div>
          <div className="fuel-bar-track mb-2">
            <div
              className="fuel-bar-fill"
              style={{ width: `${fuelPct}%`, background: fuelColor }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{fuelPct.toFixed(0)}% full</span>
            {stats.estimatedRangeRemaining != null && (
              <span>~{stats.estimatedRangeRemaining.toLocaleString()} {unit} range</span>
            )}
          </div>
        </div>
      )}

      {/* ── Stats grid ── */}
      {!isEmpty && (
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            title="This Month"
            value={formatCurrency(stats.currentMonthSpend, currency)}
            sub={`${stats.currentMonthDistance > 0 ? formatDistance(stats.currentMonthDistance, unit) : "—"} driven`}
            icon={<Calendar className="h-4 w-4" />}
            trend={spendTrend}
          />
          <StatCard
            title="Lifetime Distance"
            value={formatDistance(lt.totalDistance, unit)}
            sub={`${lt.totalTrips} trips`}
            icon={<Activity className="h-4 w-4" />}
            accent
          />
          <StatCard
            title="Fuel Economy"
            value={lt.avgFuelConsumption > 0 ? formatEfficiency(lt.avgFuelConsumption, effUnit) : "—"}
            sub="lifetime average"
            icon={<Zap className="h-4 w-4" />}
          />
          <StatCard
            title="Odometer"
            value={latestOdometer > 0 ? `${latestOdometer.toLocaleString()} km` : "—"}
            sub="current estimate"
            icon={<Gauge className="h-4 w-4" />}
          />
        </div>
      )}

      {/* ── Last fill-up ── */}
      {lastFillUp && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="section-label">Last Fill-Up</span>
            <Link href="/fillups" className="text-xs text-primary font-semibold flex items-center gap-0.5">
              All <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <FillUpCard fillUp={lastFillUp} />
        </div>
      )}

      {/* ── Upcoming maintenance ── */}
      {upcomingMaintenance.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="section-label">Upcoming Service</span>
            <Link href="/maintenance" className="text-xs text-primary font-semibold flex items-center gap-0.5">
              All <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="bg-card border border-card-border rounded-2xl overflow-hidden">
            {upcomingMaintenance.map(m => (
              <UpcomingMaintenanceCard key={m.id} item={m} odometer={latestOdometer} />
            ))}
          </div>
        </div>
      )}

      {/* ── Recent trips ── */}
      {stats.recentTrips.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="section-label">Recent Trips</span>
            <Link href="/trips" className="text-xs text-primary font-semibold flex items-center gap-0.5">
              All <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="flex flex-col gap-2.5">
            {stats.recentTrips.slice(0, 3).map(trip => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        </div>
      )}

      {/* ── Quick stats summary row ── */}
      {lt.totalFuelCost > 0 && (
        <div className="bg-card border border-card-border rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex justify-between">
            <span className="text-sm text-muted-foreground">Total Fuel Spend</span>
            <span className="text-sm font-semibold">{formatCurrency(lt.totalFuelCost, currency)}</span>
          </div>
          <div className="px-4 py-3 border-b border-border flex justify-between">
            <span className="text-sm text-muted-foreground">Cost per km</span>
            <span className="text-sm font-semibold">
              {lt.costPerKm > 0 ? `${currency}${lt.costPerKm.toFixed(4)}/km` : "—"}
            </span>
          </div>
          <div className="px-4 py-3 flex justify-between">
            <span className="text-sm text-muted-foreground">Total Fuel Used</span>
            <span className="text-sm font-semibold">{formatVolume(lt.totalFuelUsed, volUnit)}</span>
          </div>
        </div>
      )}
    </div>
  );
}


