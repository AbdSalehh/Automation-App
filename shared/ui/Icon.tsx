import {
  Play,
  Webhook,
  Clock,
  Globe,
  MessageCircle,
  MessageSquare,
  MessageSquareDot,
  MessageSquareReply,
  Send,
  Sheet,
  TableProperties,
  CalendarClock,
  CalendarPlus,
  CalendarDays,
  Filter,
  Code,
  GitBranch,
  CircleHelp,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/shared/lib/utils";

/**
 * Resolves a string icon name (stored in node definitions / database) to a
 * lucide-react icon component. Falls back to a neutral icon for unknown names.
 */
const ICON_REGISTRY: Record<string, LucideIcon> = {
  Play,
  Webhook,
  Clock,
  Globe,
  MessageCircle,
  MessageSquare,
  MessageSquareDot,
  MessageSquareReply,
  Send,
  Sheet,
  SheetIcon: Sheet,
  TableProperties,
  CalendarClock,
  CalendarPlus,
  CalendarDays,
  Filter,
  Code,
  GitBranch,
};

interface IconProps {
  name: string;
  className?: string;
}

export function Icon({ name, className }: IconProps) {
  const LucideComponent = ICON_REGISTRY[name] ?? CircleHelp;

  return <LucideComponent className={cn("size-4", className)} />;
}
