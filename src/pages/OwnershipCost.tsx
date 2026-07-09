import { useEffect, useState } from "react";
import { Link } from "wouter";
import { getOwnershipCost } from "@/lib/db";
import { useData } from "@/contexts/DataContext";
import { useAppContext } from "@/contexts/AppContext";
import { formatCurrency, formatDistance } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Car, TrendingDown, DollarSign, Gauge } from "lucide-react";
import type { OwnershipCostSummary } from "@/types";
import { cn } from "@/lib/utils";

function Row({ label, value, sub, highlight, color }: {
  label: string; value: string; sub?: string; highlight?: boolean; color?: string;
}) {
  return (
    <div className={cn("flex justify-between items-center px-4 py-3 border-b border-border last:border-0", highlight && "bg-primary/5")}>
      <div>
        <span className={cn("text-sm", highlight ? "font-semibold text-foreground" : "text-muted-foreground")}>{label}</span>
        {sub && <span className="text-xs text-muted-foreground block">{sub}</span>}
      </div>
      <span className={cn("text-sm font-bold", color ?? (highlight ? "text-primary" : "text-foreground"))}>{value}</span>
    </div>
  );
}

function BigStat({ label, value, sub, icon, accent }: {
  label: string; value: string; sub?: string; icon: React.ReactNode; accent?: boolean;
}) {
  return (
    <div className={cn("rounded-2xl p-4 border", accent ? "bg-primary text-primary-foreground border-primary/20" : "bg-card border-card-border")}>
      <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center mb-3", accent ? "bg-white/20" : "bg-primary/10")}>
        <span className={accent ? "text-white" : "text-primary"}>{icon}</span>
      </div>
      <p className={cn("text-[11px] font-semibold uppercase tracking-wide mb-0.5", accent ? "text-white/70" : "text-muted-foreground/70")}>{label}</p>
      <p className={cn("text-xl font-bold leading-tight", accent ? "text-white" : "text-foreground")}>{value}</p>
      {sub && <p className={cn("text-[11px] mt-0.5", accent ? "text-white/60" : "text-muted-foreground")}>{sub}</p>}
    </div>
  );
}

export default function OwnershipCostPage() {
  const { trips, fillUps, vehicleCosts, isLoading: dataLoading } = useData();
  const { activeVehicle, settings } = useAppContext();
  const [summary, setSummary] = useState<OwnershipCostSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const currency = settings?.units.currency ?? "$";
  const unit = settings?.units.distance ?? "km";

  useEffect(() => {
    if (dataLoading) return;
    getOwnershipCost().then(setSummary).catch(console.error).finally(() => setLoading(false));
  }, [trips, fillUps, vehicleCosts, activeVehicle, dataLoading]);

  if (loading || dataLoading) {
    return <div className="flex flex-col gap-4 pt-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>;
  }

  const vehicleName = activeVehicle?.name
    ?? (activeVehicle ? `${activeVehicle.year} ${activeVehicle.make} ${activeVehicle.model}` : "Your Vehicle");

  return (
    <div className="flex flex-col gap-5 page-enter pb-8 pt-4">
      <div className="flex items-center gap-3">
        <Link href="/settings">
          <button className="w-8 h-8 rounded-xl bg-card border border-card-border flex items-center justify-center">
            <ArrowLeft className="h-4 w-4" />
          </button>
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Ownership Cost</h1>
          <p className="text-xs text-muted-foreground">{vehicleName}</p>
        </div>
      </div>

      {!summary || summary.totalCost === 0 ? (
        <div className="bg-card border border-card-border rounded-2xl p-8 text-center">
          <Car className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
          <h3 className="font-bold text-lg">No cost data yet</h3>
          <p className="text-muted-foreground text-sm mt-1 mb-5">
            Add vehicle costs, fill-ups, and set a purchase price in Settings to see your ownership cost breakdown.
          </p>
          <Link href="/settings"><Button variant="outline" size="sm">Go to Settings</Button></Link>
        </div>
      ) : (
        <>
          {/* Big stats */}
          <div className="grid grid-cols-2 gap-3">
            <BigStat label="Net Ownership Cost" value={formatCurrency(summary.netCost, currency)}
              sub={`after ${summary.saleValue > 0 ? "sale" : "no sale yet"}`}
              icon={<DollarSign className="h-4 w-4" />} accent />
            <BigStat label="Total Cost" value={formatCurrency(summary.totalCost, currency)}
              sub="all expenses" icon={<Car className="h-4 w-4" />} />
            <BigStat label={`Cost per ${unit}`} value={summary.costPerKm > 0 ? `${currency}${summary.costPerKm.toFixed(4)}` : "—"}
              sub={`over ${formatDistance(summary.totalKm, unit as any)}`}
              icon={<Gauge className="h-4 w-4" />} />
            <BigStat label="Cost per Day" value={summary.costPerDay > 0 ? formatCurrency(summary.costPerDay, currency) : "—"}
              sub={`over ${summary.totalDays} days`}
              icon={<TrendingDown className="h-4 w-4" />} />
          </div>

          {/* Cost breakdown */}
          <div>
            <h2 className="text-base font-bold mb-2">Cost Breakdown</h2>
            <div className="bg-card border border-card-border rounded-2xl overflow-hidden">
              {summary.purchasePrice > 0 && <Row label="Purchase Price" value={formatCurrency(summary.purchasePrice, currency)} />}
              {summary.fuel > 0 && <Row label="Fuel" value={formatCurrency(summary.fuel, currency)} sub="total fill-ups" />}
              {summary.maintenance > 0 && <Row label="Maintenance" value={formatCurrency(summary.maintenance, currency)} />}
              {summary.insurance > 0 && <Row label="Insurance" value={formatCurrency(summary.insurance, currency)} />}
              {summary.registration > 0 && <Row label="Registration" value={formatCurrency(summary.registration, currency)} />}
              {summary.repairs > 0 && <Row label="Repairs" value={formatCurrency(summary.repairs, currency)} />}
              {summary.tires > 0 && <Row label="Tires" value={formatCurrency(summary.tires, currency)} />}
              {summary.accessories > 0 && <Row label="Accessories" value={formatCurrency(summary.accessories, currency)} />}
              {summary.interest > 0 && <Row label="Interest / Financing" value={formatCurrency(summary.interest, currency)} />}
              <Row label="Total Spent" value={formatCurrency(summary.totalCost, currency)} highlight />
            </div>
          </div>

          {/* Sale & net */}
          {(summary.saleValue > 0 || summary.totalDepreciation > 0) && (
            <div>
              <h2 className="text-base font-bold mb-2">Depreciation</h2>
              <div className="bg-card border border-card-border rounded-2xl overflow-hidden">
                {summary.purchasePrice > 0 && <Row label="Purchase Price" value={formatCurrency(summary.purchasePrice, currency)} />}
                {summary.saleValue > 0 && <Row label="Sale / Trade Value" value={formatCurrency(summary.saleValue, currency)} color="text-emerald-600 dark:text-emerald-400" />}
                <Row label="Total Depreciation" value={formatCurrency(summary.totalDepreciation, currency)} highlight color="text-rose-600 dark:text-rose-400" />
                <Row label="Net Ownership Cost" value={formatCurrency(summary.netCost, currency)} highlight />
              </div>
            </div>
          )}

          {/* Efficiency metrics */}
          {summary.totalKm > 0 && (
            <div>
              <h2 className="text-base font-bold mb-2">Efficiency</h2>
              <div className="bg-card border border-card-border rounded-2xl overflow-hidden">
                <Row label="Total Distance" value={formatDistance(summary.totalKm, unit as any)} />
                <Row label="Days Owned" value={`${summary.totalDays} days`} />
                <Row label={`Cost per ${unit}`} value={summary.costPerKm > 0 ? `${currency}${summary.costPerKm.toFixed(4)}/${unit}` : "—"} highlight />
                <Row label="Cost per Day" value={summary.costPerDay > 0 ? formatCurrency(summary.costPerDay, currency) : "—"} />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
