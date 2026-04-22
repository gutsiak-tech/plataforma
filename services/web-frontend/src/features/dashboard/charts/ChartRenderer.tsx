import { Suspense } from "react";
import { LazyEChart } from "./LazyEChart";
import { Skeleton } from "../../../components/common/Skeleton";

export function ChartRenderer({
  option,
  onError,
  height = 340,
}: {
  option: Record<string, unknown>;
  onError: (message: string) => void;
  height?: number;
}) {
  return (
    <Suspense fallback={<Skeleton className="h-[340px] w-full" />}>
      <LazyEChart
        option={option}
        style={{ height, width: "100%" }}
        notMerge
        lazyUpdate
        onEvents={{
          finished: () => onError(""),
        }}
      />
    </Suspense>
  );
}
