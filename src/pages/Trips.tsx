import { useState } from "react";
import { Link } from "wouter";
import { Search, Plus, X } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { TripCard } from "@/components/TripCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppContext } from "@/contexts/AppContext";
import { formatDistance } from "@/lib/utils";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function Trips() {
  const { trips, isLoading, removeTrip, editTrip } = useData();
  const { settings } = useAppContext();
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest" | "longest">("newest");

  const categories = settings?.categories || [];
  const unit = settings?.units.distance || "km";

  const filtered = trips
    .filter(t => {
      const q = search.toLowerCase();
      const matchSearch = !search || t.purpose?.toLowerCase().includes(q)
        || t.category.toLowerCase().includes(q)
        || t.startLocation?.toLowerCase().includes(q)
        || t.endLocation?.toLowerCase().includes(q)
        || t.notes?.toLowerCase().includes(q);
      return matchSearch && (!filterCategory || t.category === filterCategory);
    })
    .sort((a, b) => {
      if (sortOrder === "newest") return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortOrder === "oldest") return new Date(a.date).getTime() - new Date(b.date).getTime();
      return b.distance - a.distance;
    });

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this trip?")) return;
    await removeTrip(id);
    toast.success("Trip deleted");
  };

  const handleSave = async (trip: Parameters<typeof editTrip>[0]) => {
    await editTrip(trip);
    toast.success("Trip updated");
  };

  const totalFiltered = filtered.reduce((s, t) => s + t.distance, 0);

  return (
    <div className="flex flex-col gap-4 page-enter pb-8 pt-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Trips</h1>
          {trips.length > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {filtered.length}{filtered.length !== trips.length ? ` of ${trips.length}` : ""} trip{filtered.length !== 1 ? "s" : ""}
              {totalFiltered > 0 ? ` · ${formatDistance(totalFiltered, unit)}` : ""}
            </p>
          )}
        </div>
        <Link href="/add">
          <Button size="sm" className="h-9 gap-1.5 rounded-xl"><Plus className="h-4 w-4" />Add</Button>
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search trips…" className="pl-9 pr-9 h-11 bg-card rounded-xl"
          value={search} onChange={e => setSearch(e.target.value)} />
        {search && (
          <button className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => setSearch("")}>
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        <Badge variant={filterCategory === null ? "default" : "secondary"}
          className="cursor-pointer shrink-0 rounded-lg" onClick={() => setFilterCategory(null)}>
          All ({trips.length})
        </Badge>
        {categories.filter(c => trips.some(t => t.category === c)).map(cat => (
          <Badge key={cat} variant={filterCategory === cat ? "default" : "secondary"}
            className="cursor-pointer shrink-0 rounded-lg"
            onClick={() => setFilterCategory(filterCategory === cat ? null : cat)}>
            {cat} ({trips.filter(t => t.category === cat).length})
          </Badge>
        ))}
      </div>

      {trips.length > 1 && (
        <div className="flex gap-1 bg-muted/60 rounded-xl p-1">
          {(["newest", "oldest", "longest"] as const).map(s => (
            <button key={s} onClick={() => setSortOrder(s)}
              className={cn("flex-1 py-1 text-xs font-semibold rounded-lg transition-all capitalize",
                sortOrder === s ? "bg-card shadow text-foreground" : "text-muted-foreground")}>
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        {isLoading ? (
          [...Array(3)].map((_, i) => <div key={i} className="h-20 bg-card border border-card-border rounded-2xl animate-pulse" />)
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 flex flex-col items-center">
            <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center mb-4">
              <Search className="h-7 w-7 text-muted-foreground opacity-40" />
            </div>
            <h3 className="font-bold text-lg">No trips found</h3>
            <p className="text-muted-foreground text-sm mt-1 mb-5">
              {search || filterCategory ? "Try a different filter." : "Log your first trip to get started."}
            </p>
            {!search && !filterCategory && <Link href="/add"><Button>Log First Trip</Button></Link>}
          </div>
        ) : (
          filtered.map(trip => (
            <TripCard key={trip.id} trip={trip} onDelete={handleDelete} onSave={handleSave} />
          ))
        )}
      </div>
    </div>
  );
}
