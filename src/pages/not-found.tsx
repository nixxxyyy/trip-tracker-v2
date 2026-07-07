import { Link } from "wouter";
import { AlertCircle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-5 px-6 text-center bg-background">
      <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center">
        <AlertCircle className="h-8 w-8 text-muted-foreground opacity-50" />
      </div>
      <div>
        <h1 className="text-2xl font-bold">Page Not Found</h1>
        <p className="text-muted-foreground text-sm mt-1">
          This route doesn't exist yet.
        </p>
      </div>
      <Link href="/">
        <Button className="gap-2 rounded-xl">
          <Home className="h-4 w-4" /> Back to Dashboard
        </Button>
      </Link>
    </div>
  );
}
