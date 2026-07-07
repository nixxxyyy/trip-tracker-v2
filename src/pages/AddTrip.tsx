import { useEffect } from "react";
import { useLocation, Link } from "wouter";
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
import { toast } from "sonner";
import { ArrowLeft, ArrowRightLeft, Droplet } from "lucide-react";

const tripSchema = z.object({
  date: z.string().min(1, "Required"),
  distance: z.coerce.number().min(0.01, "Distance must be greater than 0"),
  startOdometer: z.string().optional(),
  endOdometer: z.string().optional(),
  duration: z.string().optional(),
  category: z.string().min(1, "Required"),
  purpose: z.string().optional(),
  startLocation: z.string().optional(),
  endLocation: z.string().optional(),
  notes: z.string().optional(),
});

type TripForm = z.infer<typeof tripSchema>;

export default function AddTrip() {
  const [, setLocation] = useLocation();
  const { createTrip } = useData();
  const { settings } = useAppContext();

  const defaultCategory = settings?.defaultCategory || settings?.categories?.[0] || "Personal";

  const form = useForm<TripForm>({
    resolver: zodResolver(tripSchema),
    defaultValues: {
      date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      distance: "" as any,
      startOdometer: "",
      endOdometer: "",
      duration: "",
      category: defaultCategory,
      purpose: "",
      startLocation: "",
      endLocation: "",
      notes: "",
    },
  });

  const startOdo = form.watch("startOdometer");
  const endOdo   = form.watch("endOdometer");

  // Auto-compute distance from odometer readings
  useEffect(() => {
    const s = parseFloat(startOdo || "");
    const e = parseFloat(endOdo || "");
    if (!isNaN(s) && !isNaN(e) && e > s) {
      form.setValue("distance", parseFloat((e - s).toFixed(1)));
    }
  }, [startOdo, endOdo, form]);

  const onSubmit = async (values: TripForm) => {
    try {
      await createTrip({
        id: generateUUID(),
        date: values.date,
        distance: values.distance,
        startOdometer: values.startOdometer ? parseFloat(values.startOdometer) : undefined,
        endOdometer: values.endOdometer ? parseFloat(values.endOdometer) : undefined,
        duration: values.duration ? parseFloat(values.duration) : undefined,
        category: values.category,
        purpose: values.purpose || undefined,
        startLocation: values.startLocation || undefined,
        endLocation: values.endLocation || undefined,
        notes: values.notes || undefined,
        createdAt: new Date().toISOString(),
      });
      toast.success("Trip saved");
      setLocation("/trips");
    } catch {
      toast.error("Failed to save trip");
    }
  };

  return (
    <div className="flex flex-col gap-5 page-enter pb-8 pt-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => setLocation("/trips")} className="w-8 h-8 rounded-xl bg-card border border-card-border flex items-center justify-center">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-xl font-bold tracking-tight">Log Trip</h1>
        <Link href="/add-fillup" className="ml-auto">
          <Button variant="outline" size="sm" className="h-8 gap-1.5 rounded-xl text-xs">
            <Droplet className="h-3.5 w-3.5" /> Fill-Up
          </Button>
        </Link>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

          {/* Core fields */}
          <div className="bg-card border border-card-border rounded-2xl p-4 space-y-4">
            <FormField control={form.control} name="date" render={({ field }) => (
              <FormItem>
                <FormLabel>Date & Time</FormLabel>
                <FormControl><Input type="datetime-local" {...field} className="h-11" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="distance" render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-baseline gap-1.5">
                  Distance (km)
                  <span className="text-primary text-[11px] font-medium">Required</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="number" step="0.1" inputMode="decimal"
                    placeholder="0.0"
                    {...field}
                    className="h-14 text-2xl font-bold tracking-tight"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="category" render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-11"><SelectValue placeholder="Select category" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {settings?.categories.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
          </div>

          {/* Odometer + time */}
          <div className="bg-card border border-card-border rounded-2xl p-4 space-y-4">
            <p className="text-xs text-muted-foreground font-medium">Odometer (optional — auto-fills distance)</p>
            <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-end">
              <FormField control={form.control} name="startOdometer" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Start</FormLabel>
                  <FormControl><Input type="number" inputMode="decimal" placeholder="—" {...field} className="h-11" /></FormControl>
                </FormItem>
              )} />
              <ArrowRightLeft className="h-4 w-4 text-muted-foreground mb-3" />
              <FormField control={form.control} name="endOdometer" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">End</FormLabel>
                  <FormControl><Input type="number" inputMode="decimal" placeholder="—" {...field} className="h-11" /></FormControl>
                </FormItem>
              )} />
            </div>

            <FormField control={form.control} name="duration" render={({ field }) => (
              <FormItem>
                <FormLabel>Drive Time (minutes)</FormLabel>
                <FormControl>
                  <Input type="number" inputMode="numeric" placeholder="e.g. 35" {...field} className="h-11" />
                </FormControl>
              </FormItem>
            )} />
          </div>

          {/* Optional details */}
          <div className="bg-card border border-card-border rounded-2xl p-4 space-y-4">
            <FormField control={form.control} name="purpose" render={({ field }) => (
              <FormItem>
                <FormLabel>Purpose</FormLabel>
                <FormControl><Input placeholder="e.g. Client meeting" {...field} className="h-11" /></FormControl>
              </FormItem>
            )} />

            <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-end">
              <FormField control={form.control} name="startLocation" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">From</FormLabel>
                  <FormControl><Input placeholder="Start" {...field} className="h-11" /></FormControl>
                </FormItem>
              )} />
              <ArrowRightLeft className="h-4 w-4 text-muted-foreground mb-3" />
              <FormField control={form.control} name="endLocation" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">To</FormLabel>
                  <FormControl><Input placeholder="End" {...field} className="h-11" /></FormControl>
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
            Save Trip
          </Button>
        </form>
      </Form>
    </div>
  );
}
