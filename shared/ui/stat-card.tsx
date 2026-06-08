import * as React from "react";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import { Badge } from "@/shared/ui/Badge";
import { TrendingUpIcon, TrendingDownIcon, LucideIcon } from "lucide-react";

export interface StatCardProps {
  title: string;
  value: string | number;
  trendValue: number | string; // e.g. "+12.5%" or 12.5
  trendIsPositive: boolean;
  trendDescription: string;
  footerDescription: string;
}

export function StatCard({
  title,
  value,
  trendValue,
  trendIsPositive,
  trendDescription,
  footerDescription,
}: StatCardProps) {
  const TrendIcon = trendIsPositive ? TrendingUpIcon : TrendingDownIcon;
  const trendDisplay =
    typeof trendValue === "number"
      ? `${trendValue > 0 ? "+" : ""}${trendValue}%`
      : trendValue;

  return (
    <Card className="">
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
          {value}
        </CardTitle>
        <CardAction>
          <Badge variant="outline">
            <TrendIcon className="mr-1 h-3 w-3" />
            {trendDisplay}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1.5 text-sm">
        <div className="line-clamp-1 flex gap-2 font-medium">
          {trendDescription} <TrendIcon className="size-4" />
        </div>
        <div className="text-muted-foreground">{footerDescription}</div>
      </CardFooter>
    </Card>
  );
}
