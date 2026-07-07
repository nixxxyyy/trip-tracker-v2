import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Plus, Wrench, Trash2, ChevronDown, ChevronUp, Search, AlertTriangle, Clock } from "lucide-react";
import { generateUUID, formatCurrency } from "@/lib/utils";
import { useData } from "@/contexts/DataContext";
import { useAppContext } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { Maintenance } from "@/types";

const MAINTENANCE_TYPES = [
  "Oil Change", "Tire Rotation", "Brake Service", "Tire Replacement",
  "Battery", "Air Filter", "Cabin Filter", "Wiper Blades", "Coolant Flush",
  "Transmission Service", "Spark Plugs", "Other",
];

const SERVICE_INTERVALS: Record<string, number> = {
  "Oil Change": 8000,
  "Tire Rotation": 10000,
  "Air Filter": 20000,
  "Cabin Filter": 20000,
  "Spark Plugs": 40000,
  "Brake Service": 40000,
};

const schema = z.object({
  date: z.string().min(1, "Required"),
  type: z.string().min(1, "Required"),
  description: z.string().optional(),
  odometer: z.string().optional(),
  nextDueKm: z.string().optional(),
  nextDueDate: z.string().optional(),
  cost: z.string().optional(),
  shop: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

function MaintenanceCard({
  item,
  odometer,
  onDelete,
}: {
  item: Maintenance;
  odometer: number;
  onDelete: (id: string) => void;
}) {
  const { settings } = useAppContext();
  const [expanded, setExpanded] = useState(false);
  const currency = settings?.units.currency || "$";

  const kmLeft = item.nextDueKm != null ? item.nextDueKm - odometer : null;
  const isOverdue = kmLeft != null && kmLeft < 0;
  const isClose = kmLeft != null && kmLeft >= 0 && kmLeft < 500;
  const hasReminder = item.nextDueKm != null || item.nextDueDate != null;

  return (
    <div className={cn(
      "bg-card border rounded-2xl overflow-hidden card-lift",
      isOverdue ? "border-rose-300 dark:border-rose-800" : isClose ? "border-amber-300 dark:border-amber-800" : "border-card-border"
    )}>
      <button
        className="w-full p-4 text-left hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className={cn(
              "w-8 h-8 rounded-xl flex items-center justify-center shrink-0",
              isOverdue ? "bg-rose-100 dark:bg-rose-900" : isClose ? "bg-amber-100 dark:bg-amber-900" : "bg-primary/10"
            )}>
              <Wrench className={cn(
                "h-4 w-4",
                isOverdue ? "text-rose-600 dark:text-rose-400" : isClose ? "text-amber-600 dark:text-amber-400" : "text-primary"
              )} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{item.type}</p>
              <p className="text-xs text-muted-foreground">{format(new Date(item.date), "MMM d, yyyy")}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-2 shrink-0">
            {item.cost != null && (
              <Badge variant="secondary" className="text-xs font-semibold">{formatCurrency(item.cost, currency)}</Badge>
            )}
            {isOverdue && <AlertTriangle className="h-4 w-4 text-rose-500" />}
            {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </div>
        </div>

        {/* Reminder indicator when collapsed */}
        {!expanded && hasReminder && (
          <div className={cn(
            "flex items-center gap-1.5 mt-2 text-xs font-medium",
            isOverdue ? "text-rose-600 dark:text-rose-400" : isClose ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"
          )}>
            <Clock className="h-3 w-3" />
            {kmLeft != null && (
              isOverdue
                ? `Overdue by ${Math.abs(kmLeft).toLocaleString()} km`
                : `Due in ${kmLeft.toLocaleString()} km`
            )}
            {item.nextDueDate && kmLeft == null && `Due ${format(new Date(item.nextDueDate), "MMM d, yyyy")}`}
          </div>
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 pt-2 border-t border-border space-y-2">
          {item.description && (
            <p className="text-sm text-muted-foreground">{item.description}</p>
          )}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {item.odometer != null && (
              <div>
                <p className="text-xs text-muted-foreground">Odometer</p>
                <p className="font-medium">{item.odometer.toLocaleString()} km</p>
              </div>
            )}
            {item.shop && (
              <div>
                <p className="text-xs text-muted-foreground">Shop</p>
                <p className="font-medium">{item.shop}</p>
              </div>
            )}
            {item.nextDueKm != null && (
              <div>
                <p className="text-xs text-muted-foreground">Next Due</p>
                <p className={cn("font-medium", isOverdue ? "text-rose-600 dark:text-rose-400" : isClose ? "text-amber-600 dark:text-amber-400" : "")}>
                  {item.nextDueKm.toLocaleString()} km
                  {kmLeft != null && ` (${isOverdue ? `overdue ${Math.abs(kmLeft).toLocaleString()} km` : `${kmLeft.toLocaleString()} km left`})`}
                </p>
              </div>
            )}
            {item.nextDueDate && (
              <div>
                <p className="text-xs text-muted-foreground">Next Date</p>
                <p className="font-medium">{format(new Date(item.nextDueDate), "MMM d, yyyy")}</p>
              </div>
            )}
          </div>
          {item.notes && (
            <p className="text-sm text-muted-foreground bg-muted/40 rounded-xl px-3 py-2">{item.notes}</p>
          )}
          <Button
            variant="ghost" size="sm"
            className="text-destructive hover:text-destructive hover:bg-destructive/10 -ml-2"
            onClick={() => onDelete(item.id)}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete
          </Button>
        </div>
      )}
    </div>
  );
}

export default function MaintenancePage() {
  const { maintenance, createMaintenance, removeMaintenance, trips, fillUps } = useData();
  const { settings } = useAppContext();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string | null>(null);

  const latestOdometer = Math.max(
    ...trips.filter(t => t.endOdometer != null).map(t => t.endOdometer!),
    ...(fillUps.length > 0 ? [fillUps[0].odometer] : []),
    settings?.vehicleInfo?.initialOdometer ?? 0,
    0,
  );

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: format(new Date(), "yyyy-MM-dd"),
      type: "Oil Change",
      description: "",
      odometer: latestOdometer > 0 ? String(latestOdometer) : "",
      nextDueKm: "",
      nextDueDate: "",
      cost: "",
      shop: "",
      notes: "",
    },
  });

  const watchedType = form.watch("type");

  const autoFillNext = useCallback((type: string, odo: string) => {
    const interval = SERVICE_INTERVALS[type];
    const o = parseFloat(odo);
    if (interval && !isNaN(o) && o > 0) {
      form.setValue("nextDueKm", String(Math.round(o + interval)));
    }
  }, [form]);

  const onSubmit = async (values: FormData) => {
    try {
      const record: Maintenance = {
        id: generateUUID(),
        date: values.date,
        type: values.type,
        description: values.description || undefined,
        odometer: values.odometer ? parseFloat(values.odometer) : undefined,
        nextDueKm: values.nextDueKm ? parseInt(values.nextDueKm) : undefined,
        nextDueDate: values.nextDueDate || undefined,
        cost: values.cost ? parseFloat(values.cost) : undefined,
        shop: values.shop || undefined,
        notes: values.notes || undefined,
        createdAt: new Date().toISOString(),
      };
      await createMaintenance(record);
      toast.success(`${values.type} logged`);
      form.reset({
        date: format(new Date(), "yyyy-MM-dd"),
        type: "Oil Change",
        description: "",
        odometer: latestOdometer > 0 ? String(latestOdometer) : "",
        nextDueKm: "",
        nextDueDate: "",
        cost: "",
        shop: "",
        notes: "",
      });
      setShowForm(false);
    } catch {
      toast.error("Failed to save maintenance record");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this maintenance record?")) return;
    await removeMaintenance(id);
    toast.success("Deleted");
  };

  // Filter + search
  const filtered = maintenance.filter(m => {
    const matchSearch = !search ||
      m.type.toLowerCase().includes(search.toLowerCase()) ||
      m.shop?.toLowerCase().includes(search.toLowerCase()) ||
      m.description?.toLowerCase().includes(search.toLowerCase());
    const matchType = !filterType || m.type === filterType;
    return matchSearch && matchType;
  });

  // Unique types in data
  const typesInData = [...new Set(maintenance.map(m => m.type))];

  // Items with overdue reminders
  const overdueCount = maintenance.filter(m => m.nextDueKm != null && latestOdometer > 0 && latestOdometer >= m.nextDueKm).length;

  const totalCost = maintenance.reduce((s, m) => s + (m.cost || 0), 0);

  return (
    <div className="flex flex-col gap-4 page-enter pb-8 pt-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Service</h1>
          {maintenance.length > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {maintenance.length} record{maintenance.length !== 1 ? "s" : ""}
              {totalCost > 0 && ` · ${formatCurrency(totalCost, settings?.units.currency || "$")} total`}
              {overdueCount > 0 && ` · `}
              {overdueCount > 0 && <span className="text-rose-500 font-semibold">{overdueCount} overdue</span>}
            </p>
          )}
        </div>
        <Button
          size="sm"
          onClick={() => setShowForm(s => !s)}
          className="h-9 gap-1.5 rounded-xl"
        >
          <Plus className="h-4 w-4" />
          Log Service
        </Button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-card border border-card-border rounded-2xl p-4">
          <h2 className="font-bold mb-4">New Service Record</h2>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="date" render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Date</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="type" render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Service Type</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(v) => {
                        field.onChange(v);
                        autoFillNext(v, form.getValues("odometer") || "");
                      }}
                    >
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MAINTENANCE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="odometer" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Odometer (km)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={e => {
                          field.onChange(e);
                          autoFillNext(watchedType, e.target.value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="cost" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cost</FormLabel>
                    <FormControl><Input type="number" step="0.01" placeholder="0.00" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="nextDueKm" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Next Due (km)</FormLabel>
                    <FormControl><Input type="number" placeholder="Auto-filled" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="nextDueDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Next Due (date)</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="shop" render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Shop / Mechanic</FormLabel>
                    <FormControl><Input placeholder="Where was it done?" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Description (optional)</FormLabel>
                    <FormControl><Input placeholder="Parts replaced, details..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="notes" render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Notes</FormLabel>
                    <FormControl><Textarea rows={2} placeholder="Any additional notes..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="flex gap-2 pt-1">
                <Button type="submit" className="flex-1 rounded-xl">Save Record</Button>
                <Button type="button" variant="outline" className="rounded-xl" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </Form>
        </div>
      )}

      {/* Search */}
      {maintenance.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search service records..."
            className="pl-9 h-11 bg-card rounded-xl"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      )}

      {/* Type filter chips */}
      {typesInData.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          <Badge
            variant={filterType === null ? "default" : "secondary"}
            className="cursor-pointer shrink-0 rounded-lg"
            onClick={() => setFilterType(null)}
          >
            All
          </Badge>
          {typesInData.map(t => (
            <Badge
              key={t}
              variant={filterType === t ? "default" : "secondary"}
              className="cursor-pointer shrink-0 rounded-lg"
              onClick={() => setFilterType(filterType === t ? null : t)}
            >
              {t}
            </Badge>
          ))}
        </div>
      )}

      {/* Records list */}
      <div className="flex flex-col gap-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 flex flex-col items-center">
            <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center mb-4">
              <Wrench className="h-7 w-7 text-muted-foreground opacity-40" />
            </div>
            <h3 className="font-bold text-lg">No records yet</h3>
            <p className="text-muted-foreground text-sm mt-1 mb-5">
              {search || filterType ? "Try a different search or filter." : "Keep track of oil changes, tire rotations, and more."}
            </p>
            {!search && !filterType && (
              <Button onClick={() => setShowForm(true)}>Log First Service</Button>
            )}
          </div>
        ) : (
          filtered.map(m => (
            <MaintenanceCard key={m.id} item={m} odometer={latestOdometer} onDelete={handleDelete} />
          ))
        )}
      </div>
    </div>
  );
}
