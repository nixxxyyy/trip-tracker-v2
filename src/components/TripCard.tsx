import { useState } from "react";
import { format } from "date-fns";
import { MapPin, Tag, Clock, Trash2, ChevronDown, ChevronUp, Navigation } from "lucide-react";
import type { Trip } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistance, formatDuration } from "@/lib/utils";
import { useAppContext } from "@/contexts/AppContext";
import { cn } from "@/lib/utils";

// Colour palette for category badges
const CATEGORY_COLORS: Record<string, string> = {
  Commute:   "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300",
  Business:  "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300",
  Personal:  "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
  Medical:   "bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300",
  Moving:    "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
  Partner:   "bg-pink-50 text-pink-700 dark:bg-pink-950/60 dark:text-pink-300",
};

interface TripCardProps {
  trip: Trip;
  onDelete?: (id: string) => void;
}

export function TripCard({ trip, onDelete }: TripCardProps) {
  const { settings } = useAppContext();
  const [expanded, setExpanded] = useState(false);
  const unit = settings?.units.distance || "km";

  const catColor = CATEGORY_COLORS[trip.category] || "bg-primary/10 text-primary";

  return (
    <div
      className="bg-card border border-card-border rounded-2xl overflow-hidden card-lift"
      data-testid={`trip-card-${trip.id}`}
    >
      {/* Main row — always visible */}
      <button
        className="w-full p-4 text-left hover:bg-muted/30 active:bg-muted/50 transition-colors"
        onClick={() => setExpanded(e => !e)}
        aria-expanded={expanded}
      >
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
            <span className="block text-xs text-muted-foreground mt-0.5">
              {format(new Date(trip.date), "MMM d, yyyy")}
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={cn("text-[11px] font-bold px-2 py-0.5 rounded-lg", catColor)}>
              {trip.category}
            </span>
            {expanded
              ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
              : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </div>
        </div>

        {/* Preview when collapsed */}
        {!expanded && (trip.purpose || trip.startLocation) && (
          <p className="text-xs text-muted-foreground mt-1.5 truncate">
            {trip.purpose
              ? trip.purpose
              : `${trip.startLocation}${trip.endLocation ? ` → ${trip.endLocation}` : ""}`}
          </p>
        )}
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4 pt-3 border-t border-border space-y-2.5">
          {trip.purpose && (
            <div className="flex items-start gap-2 text-sm">
              <Tag className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
              <span>{trip.purpose}</span>
            </div>
          )}
          {(trip.startLocation || trip.endLocation) && (
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span className="truncate">
                {trip.startLocation || "—"} → {trip.endLocation || "—"}
              </span>
            </div>
          )}
          {(trip.startOdometer != null || trip.endOdometer != null) && (
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <Navigation className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>
                {trip.startOdometer != null ? trip.startOdometer.toLocaleString() : "—"}
                {" → "}
                {trip.endOdometer != null ? trip.endOdometer.toLocaleString() : "—"} km
              </span>
            </div>
          )}
          {trip.notes && (
            <p className="text-sm text-muted-foreground bg-muted/40 rounded-xl px-3 py-2">{trip.notes}</p>
          )}
          {onDelete && (
            <Button
              variant="ghost" size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10 -ml-2"
              onClick={(e) => { e.stopPropagation(); onDelete(trip.id); }}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete Trip
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
