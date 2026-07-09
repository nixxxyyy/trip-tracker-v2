import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Plus, DollarSign, Trash2, ChevronDown, ChevronUp, Search, X } from "lucide-react";
import { generateUUID, formatCurrency } from "@/lib/utils";
import { useData } from "@/contexts/DataContext";
import { useAppContext } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { toast } from "sonner";
import type { VehicleCost } from "@/types";
import { cn } from "@/lib/utils";

const COST_CATEGORIES: { value: VehicleCost["category"]; label: string; color: string }[] = [
  { value: "maintenance",  label: "Maintenance",  color: "bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-400" },
  { value: "tires",        label: "Tires",        color: "bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-400" },
  { value: "insurance",    label: "Insurance",    color: "bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-400" },
  { value: "registration", label: "Registration", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-400" },
  { value: "repairs",      label: "Repairs",      color: "bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-400" },
  { value: "accessories",  label: "Accessories",  color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/60 dark:text-cyan-400" },
  { value: "interest",     label: "Interest",     color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-400" },
  { value: "other",        label: "Other",        color: "bg-muted text-muted-foreground" },
];

const schema = z.object({
  date: z.string().min(1, "Required"),
  category: z.enum(["maintenance", "tires", "insurance", "registration", "repairs", "accessories", "interest", "other"]),
  description: z.string().min(1, "Required"),
  amount: z.coerce.number().min(0.01, "Must be > 0"),
  notes: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

function CostCard({ cost, currency, onDelete }: { cost: VehicleCost; currency: string; onDelete: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const cat = COST_CATEGORIES.find(c => c.value === cost.category);
  return (
    <div className="bg-card border border-card-border rounded-2xl overflow-hidden card-lift">
      <button className="w-full p-4 text-left hover:bg-muted/30 transition-colors" onClick={() => setExpanded(e => !e)}>
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="font-bold text-lg">{formatCurrency(cost.amount, currency)}</span>
            </div>
            <p className="text-sm font-medium truncate mt-0.5">{cost.description}</p>
            <p className="text-xs text-muted-foreground">{format(new Date(cost.date), "MMM d, yyyy")}</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={cn("text-[11px] font-bold px-2 py-0.5 rounded-lg", cat?.color)}>{cat?.label}</span>
            {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </div>
        </div>
      </button>
      {expanded && (
        <div className="px-4 pb-4 pt-3 border-t border-border space-y-2.5">
          {cost.notes && <p className="text-sm text-muted-foreground bg-muted/40 rounded-xl px-3 py-2">{cost.notes}</p>}
          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5"
            onClick={() => onDelete(cost.id)}>
            <Trash2 className="h-3.5 w-3.5" />Delete
          </Button>
        </div>
      )}
    </div>
  );
}

export default function VehicleCostsPage() {
  const { vehicleCosts, createVehicleCost, removeVehicleCost } = useData();
  const { settings } = useAppContext();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<VehicleCost["category"] | null>(null);
  const currency = settings?.units.currency || "$";

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { date: format(new Date(), "yyyy-MM-dd"), category: "maintenance", description: "", amount: "" as any, notes: "" },
  });

  const onSubmit = async (values: FormData) => {
    try {
      await createVehicleCost({ id: generateUUID(), date: values.date, category: values.category, description: values.description, amount: values.amount, notes: values.notes || undefined, createdAt: new Date().toISOString() });
      toast.success("Cost recorded");
      form.reset({ date: format(new Date(), "yyyy-MM-dd"), category: "maintenance", description: "", amount: "" as any, notes: "" });
      setShowForm(false);
    } catch { toast.error("Failed to save cost"); }
  };

  const filtered = vehicleCosts.filter(c => {
    const matchSearch = !search || c.description.toLowerCase().includes(search.toLowerCase()) || c.notes?.toLowerCase().includes(search.toLowerCase());
    return matchSearch && (!filterCat || c.category === filterCat);
  });

  const totalCost = vehicleCosts.reduce((s, c) => s + c.amount, 0);
  const catTotals = COST_CATEGORIES.map(cat => ({ ...cat, total: vehicleCosts.filter(c => c.category === cat.value).reduce((s, c) => s + c.amount, 0) })).filter(c => c.total > 0);

  return (
    <div className="flex flex-col gap-4 page-enter pb-8 pt-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vehicle Costs</h1>
          {vehicleCosts.length > 0 && <p className="text-xs text-muted-foreground mt-0.5">{vehicleCosts.length} records · {formatCurrency(totalCost, currency)} total</p>}
        </div>
        <div className="flex gap-2">
          <Link href="/ownership-cost">
            <Button size="sm" variant="outline" className="h-9 rounded-xl text-xs gap-1.5"><DollarSign className="h-3.5 w-3.5" />Summary</Button>
          </Link>
          <Button size="sm" onClick={() => setShowForm(s => !s)} className="h-9 gap-1.5 rounded-xl"><Plus className="h-4 w-4" />Add</Button>
        </div>
      </div>

      {catTotals.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {catTotals.map(cat => (
            <button key={cat.value} onClick={() => setFilterCat(filterCat === cat.value ? null : cat.value)}
              className={cn("bg-card border rounded-xl p-3 text-left transition-all", filterCat === cat.value ? "border-primary" : "border-card-border")}>
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">{cat.label}</p>
              <p className="font-bold text-sm mt-0.5">{formatCurrency(cat.total, currency)}</p>
            </button>
          ))}
        </div>
      )}

      {showForm && (
        <div className="bg-card border border-card-border rounded-2xl p-4">
          <h2 className="font-bold mb-4">New Cost Record</h2>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="date" render={({ field }) => (
                  <FormItem className="col-span-2"><FormLabel>Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="category" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>{COST_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="amount" render={({ field }) => (
                  <FormItem><FormLabel>Amount ({currency})</FormLabel><FormControl><Input type="number" step="0.01" placeholder="0.00" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem className="col-span-2"><FormLabel>Description</FormLabel><FormControl><Input placeholder="e.g. Annual insurance renewal" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormItem className="col-span-2"><FormLabel>Notes</FormLabel><FormControl><Textarea rows={2} placeholder="Optional…" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div className="flex gap-2 pt-1">
                <Button type="submit" className="flex-1 rounded-xl">Save</Button>
                <Button type="button" variant="outline" className="rounded-xl" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </Form>
        </div>
      )}

      {vehicleCosts.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search costs…" className="pl-9 pr-9 h-11 bg-card rounded-xl" value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button className="absolute right-3 top-1/2 -translate-y-1/2" onClick={() => setSearch("")}><X className="h-4 w-4 text-muted-foreground" /></button>}
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        {filtered.length === 0 ? (
          <div className="text-center py-12 flex flex-col items-center">
            <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center mb-4"><DollarSign className="h-7 w-7 text-muted-foreground opacity-40" /></div>
            <h3 className="font-bold text-lg">No costs yet</h3>
            <p className="text-muted-foreground text-sm mt-1 mb-5">{search || filterCat ? "Try a different filter." : "Track insurance, registration, tires & more."}</p>
            {!search && !filterCat && <Button onClick={() => setShowForm(true)}>Add First Cost</Button>}
          </div>
        ) : (
          filtered.map(c => <CostCard key={c.id} cost={c} currency={currency} onDelete={async id => { if (!confirm("Delete?")) return; await removeVehicleCost(id); toast.success("Deleted"); }} />)
        )}
      </div>
    </div>
  );
}
