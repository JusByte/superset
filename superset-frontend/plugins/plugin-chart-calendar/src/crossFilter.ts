import {
  createTimeRangeFromGranularity,
  DataMask,
  FilterState,
  TimeGranularity,
} from '@superset-ui/core';

export type CalendarGranularity = 'min' | 'hour' | 'day' | 'week' | 'month';

const GRANULARITY_MAP: Record<CalendarGranularity, TimeGranularity> = {
  min: TimeGranularity.MINUTE,
  hour: TimeGranularity.HOUR,
  day: TimeGranularity.DAY,
  week: TimeGranularity.WEEK,
  month: TimeGranularity.MONTH,
};

const pad = (n: number) => String(n).padStart(2, '0');

// Keeping same format as ECharts
const formatDateTime = (date: Date) =>
  `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(
    date.getUTCDate(),
  )}T${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(
    date.getUTCSeconds(),
  )}`;

/**
 * @param bucketStart UTC ms of the START of the clicked cell
 *   (createTimeRangeFromGranularity does not snap to a bucket).
 */
export const getTemporalRange = (
  bucketStart: number,
  granularity: CalendarGranularity,
): string => {
  const [start, inclusiveEnd] = createTimeRangeFromGranularity(
    new Date(bucketStart),
    GRANULARITY_MAP[granularity],
    false,
  );
  // same thing done for ECharts
  const exclusiveEnd = new Date(inclusiveEnd.getTime() + 1);
  return `${formatDateTime(start)} : ${formatDateTime(exclusiveEnd)}`;
};

export const getClearCrossFilterDataMask = (): DataMask => ({
  extraFormData: { filters: [] },
  filterState: { label: undefined, value: null, selectedValues: null },
});

export interface CrossFilterArgs {
  timestamp: number; // UTC ms, start of the clicked cell
  granularity: CalendarGranularity;
  temporalColumn?: string;
  filterState?: FilterState; // current selection, used to toggle off
}

export function getCrossFilterDataMask({
  timestamp,
  granularity,
  temporalColumn,
  filterState,
}: CrossFilterArgs): DataMask {
  if (!temporalColumn) return getClearCrossFilterDataMask();
  const range = getTemporalRange(timestamp, granularity);
  // Clicking the selected cell again clears the filter
  if (filterState?.value?.[0] === range) return getClearCrossFilterDataMask();
  return {
    extraFormData: {
      filters: [{ col: temporalColumn, op: 'TEMPORAL_RANGE', val: range }],
      time_range: range,
    },
    filterState: { label: [range], value: [range], selectedValues: [range] },
  };
}

// for cell highlighting - whoever's doing that part double check this
export const isCellSelected = (
  filterState: FilterState | undefined,
  timestamp: number,
  granularity: CalendarGranularity,
) => filterState?.value?.[0] === getTemporalRange(timestamp, granularity);