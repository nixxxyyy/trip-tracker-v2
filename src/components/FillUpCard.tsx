import { useState } from "react";
import { format } from "date-fns";
import { Droplet, MapPin, Trash2, ChevronDown, ChevronUp, Zap, Edit2, Check, X } from "lucide-react";
import type { FillUp } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { formatVolume, formatCurrency, formatEfficiency } from "@/lib/utils";
import { useAppContext } from "@/contexts/AppContext";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";

type FormVals = {
  date: string; odometer: string; liters: string; pricePerUnit: string;
  discount: string; totalCost: string; station: string; fuelGrade: string;
  isFull: boolean; notes: string;
};

interface FillUpCardProps {
  fillUp: FillUp;
  onDelete?: (id: string) => void;
  onSave?: (fillUp: FillUp) => void;
}

export function FillUpCard({ fillUp, onDelete, onSave }: FillUpCardProps) {
  const { settings } = useAppContext();
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const volumeUnit = settings?.units.volume || "liters";
  const currency = settings?.units.currency || "$";
  const effUnit = settings?.units.fuelEfficiency || "L/100km";

  const { register, handleSubmit, setValue, watch } = useForm<FormVals>({
    defaultValues: {
      date: fillUp.date?.slice(0, 16) ?? "",
      odometer: fillUp.odometer != null ? String(fillUp.odometer) : "",
      liters: String(fillUp.liters ?? ""),
      pricePerUnit: String(fillUp.pricePerUnit ?? ""),
      discount: fillUp.discount != null ? String(fillUp.discount) : "",
      totalCost: String(fillUp.totalCost ?? ""),
      station: fillUp.station ?? "",
      fuelGrade: fillUp.fuelGrade ?? "Regular",
      isFull: fillUp.isFull ?? true,
      notes: fillUp.notes ?? "",
    },
  });

  const isFullVal = watch("isFull");

  const recalcTotal = (liters?: number, price?: number, discount?: number) => {
    const l = liters ?? parseFloat(watch("liters")) || 0;
    const p = price ?? parseFloat(watch("pricePerUnit")) || 0;
    const d = discount ?? parseFloat(watch("discount")) || 0;
    const eff = Math.max(0, p - d / 100);
    if (l > 0 && eff > 0) setValue("totalCost", (l * eff).toFixed(2));
  };

  const onSubmit = (vals: FormVals) => {
    onSave?.({
      ...fillUp,
      date: vals.date || fillUp.date,
      odometer: parseFloat(vals.odometer) || fillUp.odometer,
      liters: parseFloat(vals.liters) || fillUp.liters,
      pricePerUnit: parseFloat(vals.pricePerUnit) || fillUp.pricePerUnit,
      discount: parseFloat(vals.discount) || undefined,
      totalCost: parseFloat(vals.totalCost) || fillUp.totalCost,
      station: vals.station || undefined,
      fuelGrade: vals.fuelGrade || undefined,
      isFull: vals.isFull,
      notes: vals.notes || undefined,
    });
    setEditing(false);
  };

  const effectivePrice = fillUp.discount ? fillUp.pricePerUnit - fillUp.discount / 100 : fillUp.pricePerUnit;
  const economyColor = fillUp.fuelEconomy && fillUp.fuelEconomy < 8
    ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60"
    : "text-primary bg-primary/10";

  if (editing) {
    return (
      <div className="bg-card border border-primary/30 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-bold text-primary">Edit Fill-Up</span>
          <button onClick={() => setEditing(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <label className="text-xs text-muted-foreground">Date & Time</label>
              <Input type="datetime-local" {...register("date")} className="h-9 mt-0.5" />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-muted-foreground">Odometer (km)</label>
              <Input type="number" {...register("odometer")} className="h-9 mt-0.5" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Litres</label>
              <Input type="number" step="0.01" {...register("liters")}
                onChange={e => { register("liters").onChange(e); recalcTotal(parseFloat(e.target.value)); }}
                className="h-9 mt-0.5" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Price/L ({currency})</label>
              <Input type="number" step="0.001" {...register("pricePerUnit")}
                onChange={e => { register("pricePerUnit").onChange(e); recalcTotal(undefined, parseFloat(e.target.value)); }}
                className="h-9 mt-0.5" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Discount (¢/L)</label>
              <Input type="number" step="0.1" {...register("discount")}
                onChange={e => { register("discount").onChange(e); recalcTotal(undefined, undefined, parseFloat(e.target.value)); }}
                className="h-9 mt-0.5" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Total Cost ({currency})</label>
              <Input type="number" step="0.01" {...register("totalCost")} className="h-9 mt-0.5" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Station</label>
              <Input {...register("station")} className="h-9 mt-0.5" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Grade</label>
              <Select value={watch("fuelGrade")} onValueChange={v => setValue("fuelGrade", v)}>
                <SelectTrigger className="h-9 mt-0.5"><SelectValue /></SelectTrigger>
                <SelectContent>{["Regular", "Mid-Grade", "Premium", "Diesel", "E85"].map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2 flex items-center justify-between py-1">
              <Label className="text-xs text-muted-foreground">Full Tank?</Label>
              <Switch checked={isFullVal} onCheckedChange={v => setValue("isFull", v)} />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-muted-foreground">Notes</label>
              <Textarea {...register("notes")} rows={2} className="mt-0.5 resize-none" />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <Button type="submit" size="sm" className="flex-1 rounded-xl gap-1"><Check className="h-3.5 w-3.5" />Save</Button>
            <Button type="button" size="sm" variant="outline" className="rounded-xl" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-card border border-card-border rounded-2xl overflow-hidden card-lift">
      <button className="w-full p-4 text-left hover:bg-muted/30 active:bg-muted/50 transition-colors" onClick={() => setExpanded(e => !e)}>
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="font-bold text-xl">{formatCurrency(fillUp.totalCost, currency)}</span>
              <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                <Droplet className="h-3 w-3 text-primary" />{formatVolume(fillUp.liters, volumeUnit)}
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
                <Zap className="h-2.5 w-2.5" />{formatEfficiency(fillUp.fuelEconomy, effUnit)}
              </span>
            ) : !fillUp.isFull ? (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-lg bg-muted text-muted-foreground">Partial</span>
            ) : null}
            {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </div>
        </div>
        {!expanded && (
          <p className="text-xs text-muted-foreground mt-1.5">
            {currency}{fillUp.pricePerUnit.toFixed(3)}/L{fillUp.discount ? ` (${fillUp.discount}¢ off)` : ""}
            {fillUp.fuelGrade ? ` · ${fillUp.fuelGrade}` : ""}
          </p>
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-3 border-t border-border space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {[
              ["Volume", formatVolume(fillUp.liters, volumeUnit)],
              ["Price/L", `${currency}${fillUp.pricePerUnit.toFixed(3)}`],
              ...(fillUp.discount ? [["Discount", `${fillUp.discount}¢/L`], ["Eff. Price", `${currency}${effectivePrice.toFixed(3)}/L`]] : []),
              ["Total Cost", formatCurrency(fillUp.totalCost, currency)],
              ...(fillUp.odometer > 0 ? [["Odometer", `${fillUp.odometer.toLocaleString()} km`]] : []),
              ...(fillUp.fuelGrade ? [["Grade", fillUp.fuelGrade]] : []),
              ...(fillUp.station ? [["Station", fillUp.station]] : []),
              ["Fill Type", fillUp.isFull ? "Full Tank" : "Partial"],
              ...(fillUp.fuelEconomy && fillUp.isFull ? [["Economy", formatEfficiency(fillUp.fuelEconomy, effUnit)]] : []),
            ].map(([label, value]) => (
              <div key={label}>
                <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground block">{label}</span>
                <span className="font-semibold text-sm">{value}</span>
              </div>
            ))}
          </div>
          {fillUp.notes && <p className="text-sm text-muted-foreground bg-muted/40 rounded-xl px-3 py-2">{fillUp.notes}</p>}
          <div className="flex gap-2 pt-1">
            {onSave && (
              <Button variant="outline" size="sm" className="gap-1.5 rounded-xl" onClick={() => { setEditing(true); setExpanded(true); }}>
                <Edit2 className="h-3.5 w-3.5" />Edit
              </Button>
            )}
            {onDelete && (
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5"
                onClick={() => onDelete(fillUp.id)}>
                <Trash2 className="h-3.5 w-3.5" />Delete
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
