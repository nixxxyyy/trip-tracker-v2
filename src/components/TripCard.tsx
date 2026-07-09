import { useState } from "react";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import { MapPin, Tag, Clock, Trash2, ChevronDown, ChevronUp, Navigation, Edit2, Check, X, Zap, DollarSign } from "lucide-react";
import type { Trip } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatDistance, formatDuration, formatCurrency, formatEfficiency } from "@/lib/utils";
import { useAppContext } from "@/contexts/AppContext";
import { cn } from "@/lib/utils";

const CATEGORY_COLORS: Record<string, string> = {
  Commute:  "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300",
  Business: "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300",
  Personal: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
  Medical:  "bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300",
  Moving:   "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
  Partner:  "bg-pink-50 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300",
};

interface TripCardProps {
  trip: Trip;
  onDelete?: (id: string) => void;
  onSave?: (trip: Trip) => void;
}

type FormVals = {
  date: string; distance: string; category: string; purpose: string;
  startLocation: string; endLocation: string; startOdometer: string;
  endOdometer: string; duration: string; fuelUsed: string;
  fuelEconomy: string; tripCost: string; notes: string;
};

export function TripCard({ trip, onDelete, onSave }: TripCardProps) {
  const { settings } = useAppContext();
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const unit = settings?.units.distance || "km";
  const currency = settings?.units.currency || "$";
  const effUnit = settings?.units.fuelEfficiency || "L/100km";
  const categories = settings?.categories ?? [];

  const { register, handleSubmit, setValue, watch } = useForm<FormVals>({
    defaultValues: {
      date: trip.date?.slice(0, 16) ?? "",
      distance: String(trip.distance ?? ""),
      category: trip.category ?? "Personal",
      purpose: trip.purpose ?? "",
      startLocation: trip.startLocation ?? "",
      endLocation: trip.endLocation ?? "",
      startOdometer: trip.startOdometer != null ? String(trip.startOdometer) : "",
      endOdometer: trip.endOdometer != null ? String(trip.endOdometer) : "",
      duration: trip.duration != null ? String(trip.duration) : "",
      fuelUsed: trip.fuelUsed != null ? String(trip.fuelUsed) : "",
      fuelEconomy: trip.fuelEconomy != null ? String(trip.fuelEconomy) : "",
      tripCost: trip.tripCost != null ? String(trip.tripCost) : "",
      notes: trip.notes ?? "",
    },
  });

  const catColor = CATEGORY_COLORS[trip.category] ?? "bg-primary/10 text-primary";

  const onSubmit = (vals: FormVals) => {
    const startO = parseFloat(vals.startOdometer);
    const endO = parseFloat(vals.endOdometer);
    let dist = parseFloat(vals.distance);
    if (!isNaN(startO) && !isNaN(endO) && endO > startO) dist = parseFloat((endO - startO).toFixed(1));
    onSave?.({
      ...trip,
      date: vals.date || trip.date,
      distance: isNaN(dist) ? trip.distance : dist,
      category: vals.category,
      purpose: vals.purpose || undefined,
      startLocation: vals.startLocation || undefined,
      endLocation: vals.endLocation || undefined,
      startOdometer: isNaN(startO) ? undefined : startO,
      endOdometer: isNaN(endO) ? undefined : endO,
      duration: parseFloat(vals.duration) || undefined,
      fuelUsed: parseFloat(vals.fuelUsed) || undefined,
      fuelEconomy: parseFloat(vals.fuelEconomy) || undefined,
      tripCost: parseFloat(vals.tripCost) || undefined,
      notes: vals.notes || undefined,
    });
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="bg-card border border-primary/30 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-bold text-primary">Edit Trip</span>
          <button onClick={() => setEditing(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <label className="text-xs text-muted-foreground">Date & Time</label>
              <Input type="datetime-local" {...register("date")} className="h-9 mt-0.5" />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-muted-foreground">Category</label>
              <Select value={watch("category")} onValueChange={v => setValue("category", v)}>
                <SelectTrigger className="h-9 mt-0.5"><SelectValue /></SelectTrigger>
                <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <label className="text-xs text-muted-foreground">Distance (km)</label>
              <Input type="number" step="0.1" {...register("distance")} className="h-9 mt-0.5" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Start Odometer</label>
              <Input type="number" {...register("startOdometer")} className="h-9 mt-0.5" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">End Odometer</label>
              <Input type="number" {...register("endOdometer")} className="h-9 mt-0.5" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Duration (min)</label>
              <Input type="number" {...register("duration")} className="h-9 mt-0.5" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Fuel Used (L)</label>
              <Input type="number" step="0.01" {...register("fuelUsed")} className="h-9 mt-0.5" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Fuel Economy (L/100km)</label>
              <Input type="number" step="0.1" {...register("fuelEconomy")} className="h-9 mt-0.5" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Trip Cost ({currency})</label>
              <Input type="number" step="0.01" {...register("tripCost")} className="h-9 mt-0.5" />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-muted-foreground">Purpose</label>
              <Input {...register("purpose")} className="h-9 mt-0.5" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">From</label>
              <Input {...register("startLocation")} className="h-9 mt-0.5" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">To</label>
              <Input {...register("endLocation")} className="h-9 mt-0.5" />
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
              <span className="font-bold text-xl leading-tight">{formatDistance(trip.distance, unit)}</span>
              {trip.duration && (
                <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                  <Clock className="h-3 w-3" />{formatDuration(trip.duration)}
                </span>
              )}
            </div>
            <span className="block text-xs text-muted-foreground mt-0.5">{format(new Date(trip.date), "MMM d, yyyy · h:mm a")}</span>
            {/* Fuel economy + cost inline */}
            {(trip.fuelEconomy || trip.tripCost) && (
              <div className="flex items-center gap-3 mt-1">
                {trip.fuelEconomy && (
                  <span className="text-[11px] text-muted-foreground flex items-center gap-0.5">
                    <Zap className="h-3 w-3 text-primary" />{formatEfficiency(trip.fuelEconomy, effUnit)}
                  </span>
                )}
                {trip.tripCost && (
                  <span className="text-[11px] text-muted-foreground flex items-center gap-0.5">
                    <DollarSign className="h-3 w-3 text-amber-500" />{formatCurrency(trip.tripCost, currency)}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={cn("text-[11px] font-bold px-2 py-0.5 rounded-lg", catColor)}>{trip.category}</span>
            {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </div>
        </div>
        {!expanded && (trip.purpose || trip.startLocation) && (
          <p className="text-xs text-muted-foreground mt-1.5 truncate">
            {trip.purpose ?? `${trip.startLocation}${trip.endLocation ? ` → ${trip.endLocation}` : ""}`}
          </p>
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-3 border-t border-border space-y-2.5">
          {trip.purpose && <div className="flex items-start gap-2 text-sm"><Tag className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" /><span>{trip.purpose}</span></div>}
          {(trip.startLocation || trip.endLocation) && (
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span className="truncate">{trip.startLocation || "—"} → {trip.endLocation || "—"}</span>
            </div>
          )}
          {(trip.startOdometer != null || trip.endOdometer != null) && (
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <Navigation className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>{trip.startOdometer?.toLocaleString() ?? "—"} → {trip.endOdometer?.toLocaleString() ?? "—"} km</span>
            </div>
          )}
          {trip.fuelUsed != null && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Zap className="h-3.5 w-3.5 shrink-0" />
              <span>{trip.fuelUsed.toFixed(2)} L used{trip.fuelEconomy ? ` · ${formatEfficiency(trip.fuelEconomy, effUnit)}` : ""}</span>
            </div>
          )}
          {trip.notes && <p className="text-sm text-muted-foreground bg-muted/40 rounded-xl px-3 py-2">{trip.notes}</p>}
          <div className="flex gap-2 pt-1">
            {onSave && (
              <Button variant="outline" size="sm" className="gap-1.5 rounded-xl" onClick={() => { setEditing(true); setExpanded(true); }}>
                <Edit2 className="h-3.5 w-3.5" />Edit
              </Button>
            )}
            {onDelete && (
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5"
                onClick={() => onDelete(trip.id)}>
                <Trash2 className="h-3.5 w-3.5" />Delete
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
