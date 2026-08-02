import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Loader2,
  Square,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AgentStepStatus } from "@/types/resume-agent-ui";

const ICONS: Record<AgentStepStatus, typeof Circle> = {
  pending: Circle,
  running: Loader2,
  completed: CheckCircle2,
  warning: AlertTriangle,
  error: AlertCircle,
  cancelled: Square,
};

const COLORS: Record<AgentStepStatus, string> = {
  pending: "text-muted-foreground/60",
  running: "text-primary animate-spin",
  completed: "text-emerald-600 dark:text-emerald-500",
  warning: "text-amber-600 dark:text-amber-500",
  error: "text-destructive",
  cancelled: "text-muted-foreground",
};

interface AgentStepIconProps {
  status: AgentStepStatus;
  className?: string;
}

export const AgentStepIcon = ({ status, className }: AgentStepIconProps) => {
  const Icon = ICONS[status];
  return <Icon aria-hidden className={cn("h-3.5 w-3.5 shrink-0", COLORS[status], className)} />;
};
