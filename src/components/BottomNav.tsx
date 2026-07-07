import { Link, useLocation } from "wouter";
import { LayoutDashboard, Map, Droplet, Settings, BarChart2, Wrench, Car } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/", icon: LayoutDashboard, label: "Home" },
  { href: "/trips", icon: Map, label: "Trips" },
  { href: "/fillups", icon: Droplet, label: "Fuel" },
  { href: "/maintenance", icon: Wrench, label: "Service" },
  { href: "/analytics", icon: BarChart2, label: "Stats" },
  { href: "/settings", icon: Settings, label: "More" },
];

export function BottomNav() {
  const [location] = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border pb-safe">
      <div className="flex justify-around items-stretch h-[60px] max-w-md mx-auto px-1">
        {tabs.map((tab) => {
          const isActive = location === tab.href || (tab.href !== "/" && location.startsWith(tab.href));
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 gap-0.5 text-[10px] font-semibold tracking-wide transition-all duration-200 relative",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className={cn(
                "flex items-center justify-center w-9 h-7 rounded-xl transition-all duration-200",
                isActive ? "bg-primary/12" : "hover:bg-muted/60"
              )}>
                <Icon
                  className={cn("transition-all duration-200", isActive ? "h-[18px] w-[18px]" : "h-4 w-4")}
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </div>
              <span>{tab.label}</span>
              {isActive && <span className="nav-active-dot mt-0.5" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
