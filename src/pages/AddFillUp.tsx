import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { generateUUID } from "@/lib/utils";
import { useData } from "@/contexts/DataContext";
import { useAppContext } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ArrowLeft, Info } from "lucide-react";

const fillUpSchema = z.object({
  date: z.string(),
  odometer: z.coerce.number().min(0, "Must be positive"),
  liters: z.coerce.number().min(0.01, "Must be > 0"),
  pricePerUnit: z.coerce.number().min(0.001, "Must be > 0"),
  discount: z.string().optional(),
  totalCost: z.coerce.number().min(0.01, "Must be > 0"),
  station: z.string().optional(),
  fuelGrade: z.string().optional(),
  isFull: z.boolean().default(true),
  notes: z.string().optional(),
});

type FillUpForm = z.infer<typeof fillUpSchema>;

export default function AddFillUp() {
  const [, setLocation] = useLocation();
  const { createFillUp, fillUps } = useData();
  const { settings } = useAppContext();
  const currency = settings?.units.currency || "$";

  const lastOdometer = fillUps.length > 0
    ? fillUps[0].odometer
    : (settings?.vehicleInfo?.initialOdometer || 0);

  const form = useForm<FillUpForm>({
    resolver: zodResolver(fillUpSchema),
    defaultValues: {
      date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      odometer: lastOdometer,
      liters: "" as any,
      pricePerUnit: "" as any,
      discount: "",
      totalCost: "" as any,
      station: "",
      fuelGrade: "Regular",
      isFull: true,
      notes: "",
    },
  });

  const recalcTotal = (liters?: number, price?: number) => {
    const l = liters ?? form.getValues("liters") ?? 0;
    const p = price ?? form.getValues("pricePerUnit") ?? 0;
    const discountCents = parseFloat(form.getValues("discount") || "0");
    const effectivePrice = Math.max(0, p - discountCents / 100);
    if (l > 0 && effectivePrice > 0) {
      form.setValue("totalCost", parseFloat((l * effectivePrice).toFixed(2)));
    }
  };

  const onSubmit = async (values: FillUpForm) => {
    const discount = values.discount ? parseFloat(values.discount) : undefined;

    // Compute fuel economy against last full fill-up
    let fuelEconomy: number | undefined;
    if (values.isFull && fillUps.length > 0) {
      const lastFull = fillUps.find(f => f.isFull);
      if (lastFull && values.odometer > lastFull.odometer) {
        const distanceKm = values.odometer - lastFull.odometer;
        fuelEconomy = parseFloat(((values.liters / distanceKm) * 100).toFixed(2));
      }
    }

    try {
      await createFillUp({
        id: generateUUID(),
        date: values.date,
        odometer: values.odometer,
        liters: values.liters,
        pricePerUnit: values.pricePerUnit,
        discount,
        totalCost: values.totalCost,
        station: values.station || undefined,
        fuelGrade: values.fuelGrade || undefined,
        isFull: values.isFull,
        fuelEconomy,
        notes: values.notes || undefined,
        createdAt: new Date().toISOString(),
      });
      toast.success("Fill-up saved");
      setLocation("/fillups");
    } catch {
      toast.error("Failed to save fill-up");
    }
  };

  return (
    <div className="flex flex-col gap-5 page-enter pb-8 pt-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setLocation("/fillups")}
          className="w-8 h-8 rounded-xl bg-card border border-card-border flex items-center justify-center"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-xl font-bold tracking-tight">Log Fill-Up</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

          {/* Core fuel data */}
          <div className="bg-card border border-card-border rounded-2xl p-4 space-y-4">
            <FormField control={form.control} name="date" render={({ field }) => (
              <FormItem>
                <FormLabel>Date & Time</FormLabel>
                <FormControl><Input type="datetime-local" {...field} className="h-11" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="odometer" render={({ field }) => (
              <FormItem>
                <FormLabel>Odometer (km)</FormLabel>
                <FormControl>
                  <Input type="number" inputMode="decimal" {...field} className="h-12 text-lg font-semibold" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="liters" render={({ field }) => (
                <FormItem>
                  <FormLabel>Litres (L)</FormLabel>
                  <FormControl>
                    <Input
                      type="number" step="0.01" inputMode="decimal" placeholder="0.00"
                      {...field}
                      className="h-11"
                      onChange={e => { field.onChange(e); recalcTotal(parseFloat(e.target.value) || 0); }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="pricePerUnit" render={({ field }) => (
                <FormItem>
                  <FormLabel>Price/L ({currency})</FormLabel>
                  <FormControl>
                    <Input
                      type="number" step="0.001" inputMode="decimal" placeholder="0.000"
                      {...field}
                      className="h-11"
                      onChange={e => { field.onChange(e); recalcTotal(undefined, parseFloat(e.target.value) || 0); }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="discount" render={({ field }) => (
              <FormItem>
                <FormLabel>Discount (¢/L) <span className="text-muted-foreground font-normal text-xs">— PC Points, Rewards, etc.</span></FormLabel>
                <FormControl>
                  <Input
                    type="number" step="0.1" inputMode="decimal" placeholder="0.0"
                    {...field}
                    className="h-11"
                    onChange={e => { field.onChange(e); recalcTotal(); }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="totalCost" render={({ field }) => (
              <FormItem>
                <FormLabel>Total Cost ({currency}) <span className="text-muted-foreground font-normal text-xs">— auto-calculated above</span></FormLabel>
                <FormControl>
                  <Input
                    type="number" step="0.01" inputMode="decimal"
                    {...field}
                    className="h-14 text-2xl font-bold text-primary tracking-tight"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>

          {/* Tank & station */}
          <div className="bg-card border border-card-border rounded-2xl p-4 space-y-4">
            <FormField control={form.control} name="isFull" render={({ field }) => (
              <FormItem className="flex items-center justify-between">
                <div>
                  <FormLabel className="text-sm font-semibold">Full Tank?</FormLabel>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Info className="h-3 w-3" /> Required for accurate fuel economy tracking
                  </p>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )} />

            <div className="grid grid-cols-2 gap-3">
              <FormField control={form.control} name="station" render={({ field }) => (
                <FormItem>
                  <FormLabel>Station</FormLabel>
                  <FormControl><Input placeholder="e.g. Petro-Canada" {...field} className="h-11" /></FormControl>
                </FormItem>
              )} />

              <FormField control={form.control} name="fuelGrade" render={({ field }) => (
                <FormItem>
                  <FormLabel>Grade</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {["Regular", "Mid-Grade", "Premium", "Diesel", "E85"].map(g => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea placeholder="Any extra details..." {...field} className="resize-none" rows={2} />
                </FormControl>
              </FormItem>
            )} />
          </div>

          <Button type="submit" className="w-full h-13 text-base font-bold rounded-2xl">
            Save Fill-Up
          </Button>
        </form>
      </Form>
    </div>
  );
}
