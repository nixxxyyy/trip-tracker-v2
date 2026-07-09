import { useState } from "react";
import { Link } from "wouter";
import { Search, Plus, X, TrendingUp, TrendingDown, Droplet } from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { FillUpCard } from "@/components/FillUpCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppContext } from "@/contexts/AppContext";
import { formatCurrency, formatVolume } from "@/lib/utils";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function FillUps() {
  const { fillUps, isLoading, removeFillUp, editFillUp } = useData();
  const { settings } = useAppContext();
  const [search, setSearch] = useState("");
  const [filterGrade, setFilterGrade] = useState<string | null>(null);
  const [showStations, setShowStations] = useState(false);
  const currency = settings?.units.currency || "$";
  const volUnit = settings?.units.volume || "liters";

  const filtered = fillUps.filter(f => {
    const q = search.toLowerCase();
    const matchSearch = !search || f.station?.toLowerCase().includes(q)
      || f.notes?.toLowerCase().includes(q) || f.fuelGrade?.toLowerCase().includes(q);
    return matchSearch && (!filterGrade || f.fuelGrade === filterGrade);
  });

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this fill-up?")) return;
    await removeFillUp(id);
    toast.success("Fill-up deleted");
  };

  const handleSave = async (f: Parameters<typeof editFillUp>[0]) => {
    await editFillUp(f);
    toast.success("Fill-up updated");
  };

  // Station analytics
  const stationMap: Record<string, { totalSpend: number; visits: number; totalPrice: number; totalLiters: number }> = {};
  fillUps.forEach(f => {
    if (!f.station) return;
    if (!stationMap[f.station]) stationMap[f.station] = { totalSpend: 0, visits: 0, totalPrice: 0, totalLiters: 0 };
    stationMap[f.station].totalSpend += f.totalCost;
    stationMap[f.station].visits += 1;
    stationMap[f.station].totalPrice += f.pricePerUnit;
    stationMap[f.station].totalLiters += f.liters;
  });
  const stations = Object.entries(stationMap)
    .map(([name, v]) => ({ name, avgPrice: v.totalPrice / v.visits, totalSpend: v.totalSpend, visits: v.visits, totalLiters: v.totalLiters }))
    .sort((a, b) => b.totalSpend - a.totalSpend);

  const totalSpend = fillUps.reduce((s, f) => s + f.totalCost, 0);
  const totalLitres = fillUps.reduce((s, f) => s + f.liters, 0);
  const grades = [...new Set(fillUps.filter(f => f.fuelGrade).map(f => f.fuelGrade!))];

  let priceTrend: { up: boolean; pct: number } | null = null;
  if (fillUps.length >= 4) {
    const recent = fillUps.slice(0, 3).reduce((s, f) => s + f.pricePerUnit, 0) / 3;
    const older = fillUps.slice(3, 6).reduce((s, f) => s + f.pricePerUnit, 0) / Math.min(3, fillUps.slice(3).length);
    if (older > 0) priceTrend = { up: recent > older, pct: Math.abs((recent - older) / older * 100) };
  }

  return (
    <div className="flex flex-col gap-4 page-enter pb-8 pt-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fill-Ups</h1>
          {fillUps.length > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {fillUps.length} fill-up{fillUps.length !== 1 ? "s" : ""}
              {totalLitres > 0 ? ` · ${formatVolume(totalLitres, volUnit)}` : ""}
              {totalSpend > 0 ? ` · ${formatCurrency(totalSpend, currency)}` : ""}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {stations.length > 0 && (
            <Button size="sm" variant="outline"
              className={cn("h-9 rounded-xl gap-1.5", showStations && "bg-primary/10 text-primary border-primary/20")}
              onClick={() => setShowStations(!showStations)}>
              <TrendingUp className="h-3.5 w-3.5" />Stations
            </Button>
          )}
          <Link href="/add-fillup">
            <Button size="sm" className="h-9 gap-1.5 rounded-xl"><Plus className="h-4 w-4" />Add</Button>
          </Link>
        </div>
      </div>

      {priceTrend && (
        <div className={cn("flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium border",
          priceTrend.up
            ? "bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-400"
            : "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-400"
        )}>
          {priceTrend.up ? <TrendingUp className="h-4 w-4 shrink-0" /> : <TrendingDown className="h-4 w-4 shrink-0" />}
          <span>Fuel prices are {priceTrend.up ? "up" : "down"} {priceTrend.pct.toFixed(1)}% vs. earlier fill-ups</span>
        </div>
      )}

      {showStations && stations.length > 0 && (
        <div className="bg-card border border-card-border rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border"><p className="font-semibold text-sm">Station Analytics</p></div>
          <div className="divide-y divide-border">
            {stations.map((s, i) => (
              <div key={s.name} className={cn("flex items-center justify-between px-4 py-3", i === 0 && "bg-primary/5")}>
                <div>
                  <p className={cn("font-semibold text-sm", i === 0 && "text-primary")}>{s.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {s.visits} visit{s.visits !== 1 ? "s" : ""} · avg {currency}{s.avgPrice.toFixed(3)}/L · {formatVolume(s.totalLiters, volUnit)}
                  </p>
                </div>
                <span className={cn("font-bold text-sm", i === 0 && "text-primary")}>{formatCurrency(s.totalSpend, currency)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search stations, grades, notes…" className="pl-9 pr-9 h-11 bg-card rounded-xl"
          value={search} onChange={e => setSearch(e.target.value)} />
        {search && <button className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => setSearch("")}><X className="h-4 w-4 text-muted-foreground" /></button>}
      </div>

      {grades.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          <Badge variant={filterGrade === null ? "default" : "secondary"} className="cursor-pointer shrink-0 rounded-lg" onClick={() => setFilterGrade(null)}>All grades</Badge>
          {grades.map(g => (
            <Badge key={g} variant={filterGrade === g ? "default" : "secondary"} className="cursor-pointer shrink-0 rounded-lg" onClick={() => setFilterGrade(filterGrade === g ? null : g)}>{g}</Badge>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        {isLoading ? (
          [...Array(3)].map((_, i) => <div key={i} className="h-20 bg-card border border-card-border rounded-2xl animate-pulse" />)
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 flex flex-col items-center">
            <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center mb-4">
              <Droplet className="h-7 w-7 text-muted-foreground opacity-40" />
            </div>
            <h3 className="font-bold text-lg">No fill-ups found</h3>
            <p className="text-muted-foreground text-sm mt-1 mb-5">
              {search || filterGrade ? "Try a different filter." : "Track your fuel purchases here."}
            </p>
            {!search && !filterGrade && <Link href="/add-fillup"><Button>Log First Fill-Up</Button></Link>}
          </div>
        ) : (
          filtered.map(f => <FillUpCard key={f.id} fillUp={f} onDelete={handleDelete} onSave={handleSave} />)
        )}
      </div>
    </div>
  );
}
