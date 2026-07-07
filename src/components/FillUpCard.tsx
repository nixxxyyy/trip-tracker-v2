import { useState } from "react";
import { format } from "date-fns";
import { Droplet, MapPin, Trash2, ChevronDown, ChevronUp, Zap, Tag } from "lucide-react";
import type { FillUp } from "@/types";
import { Button } from "@/components/ui/button";
import { formatVolume, formatCurrency, formatEfficiency } from "@/lib/utils";
import { useAppContext } from "@/contexts/AppContext";
import { cn } from "@/lib/utils";

interface FillUpCardProps {
  fillUp: FillUp;
  onDelete?: (id: string) => void;
}

export function FillUpCard({ fillUp, onDelete }: FillUpCardProps) {
  const { settings } = useAppContext();
  const [expanded, setExpanded] = useState(false);
  const volumeUnit = settings?.units.volume || "liters";
  const currency = settings?.units.currency || "$";
  const effUnit = settings?.units.fuelEfficiency || "L/100km";

  const effectivePrice = fillUp.discount
    ? fillUp.pricePerUnit - fillUp.discount / 100
    : fillUp.pricePerUnit;

  const economyColor =
    fillUp.fuelEconomy && fillUp.fuelEconomy < 8
      ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60"
      : "text-primary bg-primary/10";

  return (
    <div
      className="bg-card border border-card-border rounded-2xl overflow-hidden card-lift"
      data-testid={`fillup-card-${fillUp.id}`}
    >
      {/* Main row */}
      <button
        className="w-full p-4 text-left hover:bg-muted/30 active:bg-muted/50 transition-colors"
        onClick={() => setExpanded(e => !e)}
        aria-expanded={expanded}
      >
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="font-bold text-xl">{formatCurrency(fillUp.totalCost, currency)}</span>
              <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                <Droplet className="h-3 w-3 text-primary" />
                {formatVolume(fillUp.liters, volumeUnit)}
              </span>
            </div>
            <span className="block text-xs text-muted-foreground mt-0.5">
              {format(new Date(fillUp.date), "MMM d, yyyy")}
              {fillUp.station && <> · <MapPin className="inline h-2.5 w-2.5 mx-0.5" />{fillUp.station}</>}
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {fillUp.fuelEconomy && fillUp.isFull ? (
              <span className={cn("text-[11px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-0.5", economyColor)}>
                <Zap className="h-2.5 w-2.5" />
                {formatEfficiency(fillUp.fuelEconomy, effUnit)}
              </span>
            ) : !fillUp.isFull ? (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-muted text-muted-foreground">
                Partial
              </span>
            ) : null}
            {expanded
              ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
              : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </div>
        </div>

        {/* Summary line when collapsed */}
        {!expanded && (
          <p className="text-xs text-muted-foreground mt-1.5">
            {currency}{fillUp.pricePerUnit.toFixed(3)}/L
            {fillUp.discount ? ` (${fillUp.discount}¢ discount)` : ""}
            {fillUp.fuelGrade ? ` · ${fillUp.fuelGrade}` : ""}
          </p>
        )}
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4 pt-3 border-t border-border space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Detail label="Volume" value={formatVolume(fillUp.liters, volumeUnit)} />
            <Detail label="Price per L" value={`${currency}${fillUp.pricePerUnit.toFixed(3)}`} />
            {fillUp.discount && (
              <Detail label="Discount" value={`${fillUp.discount}¢/L`} sub={`eff. ${currency}${effectivePrice.toFixed(3)}/L`} />
            )}
            <Detail label="Total Cost" value={formatCurrency(fillUp.totalCost, currency)} />
            {fillUp.odometer > 0 && (
              <Detail label="Odometer" value={`${fillUp.odometer.toLocaleString()} km`} />
            )}
            {fillUp.fuelGrade && (
              <Detail label="Grade" value={fillUp.fuelGrade} />
            )}
            {fillUp.station && (
              <Detail label="Station" value={fillUp.station} />
            )}
            <Detail label="Fill Type" value={fillUp.isFull ? "Full Tank" : "Partial"} />
            {fillUp.fuelEconomy && fillUp.isFull && (
              <Detail label="Economy" value={formatEfficiency(fillUp.fuelEconomy, effUnit)} />
            )}
          </div>
          {fillUp.notes && (
            <p className="text-sm text-muted-foreground bg-muted/40 rounded-xl px-3 py-2">{fillUp.notes}</p>
          )}
          {onDelete && (
            <Button
              variant="ghost" size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10 -ml-2"
              onClick={(e) => { e.stopPropagation(); onDelete(fillUp.id); }}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete Fill-Up
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function Detail({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground block">{label}</span>
      <span className="font-semibold text-sm">{value}</span>
      {sub && <span className="text-xs text-muted-foreground block">{sub}</span>}
    </div>
  );
}
