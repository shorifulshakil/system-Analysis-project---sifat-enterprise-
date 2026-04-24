import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: string;
  icon: LucideIcon;
  hint?: string;
  tone?: "default" | "success" | "warning" | "destructive" | "accent";
}

const toneMap = {
  default: "bg-secondary text-secondary-foreground",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  destructive: "bg-destructive/10 text-destructive",
  accent: "bg-accent/10 text-accent",
};

export const StatCard = ({ label, value, icon: Icon, hint, tone = "default" }: Props) => (
  <Card className="p-5 shadow-soft border border-border/60 hover:shadow-elegant transition-shadow">
    <div className="flex items-start justify-between">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground font-medium">{label}</p>
        <p className="text-2xl font-display font-bold text-foreground">{value}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center", toneMap[tone])}>
        <Icon size={20} />
      </div>
    </div>
  </Card>
);
