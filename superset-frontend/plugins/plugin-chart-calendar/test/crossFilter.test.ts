import {
  getClearCrossFilterDataMask,
  getCrossFilterDataMask,
  getTemporalRange,
  isCellSelected,
} from '../src/crossFilter';

const ts = (iso: string) => Date.parse(`${iso}Z`);

test('day bucket', () => {
  expect(getTemporalRange(ts('2024-03-15T00:00:00'), 'day')).toBe(
    '2024-03-15T00:00:00 : 2024-03-16T00:00:00',
  );
});

test('day bucket on a month boundary', () => {
  expect(getTemporalRange(ts('2024-01-31T00:00:00'), 'day')).toBe(
    '2024-01-31T00:00:00 : 2024-02-01T00:00:00',
  );
});

test('week bucket spans 7 days', () => {
  expect(getTemporalRange(ts('2024-03-11T00:00:00'), 'week')).toBe(
    '2024-03-11T00:00:00 : 2024-03-18T00:00:00',
  );
});

test('month bucket handles December and leap February', () => {
  expect(getTemporalRange(ts('2023-12-01T00:00:00'), 'month')).toBe(
    '2023-12-01T00:00:00 : 2024-01-01T00:00:00',
  );
  expect(getTemporalRange(ts('2024-02-01T00:00:00'), 'month')).toBe(
    '2024-02-01T00:00:00 : 2024-03-01T00:00:00',
  );
});

test('hour and minute buckets', () => {
  expect(getTemporalRange(ts('2024-03-15T13:00:00'), 'hour')).toBe(
    '2024-03-15T13:00:00 : 2024-03-15T14:00:00',
  );
  expect(getTemporalRange(ts('2024-03-15T13:45:00'), 'min')).toBe(
    '2024-03-15T13:45:00 : 2024-03-15T13:46:00',
  );
});

test('builds a TEMPORAL_RANGE DataMask with time_range override', () => {
  const range = '2024-03-15T00:00:00 : 2024-03-16T00:00:00';
  const mask = getCrossFilterDataMask({
    timestamp: ts('2024-03-15T00:00:00'),
    granularity: 'day',
    temporalColumn: 'event_time',
  });
  expect(mask.extraFormData).toEqual({
    filters: [{ col: 'event_time', op: 'TEMPORAL_RANGE', val: range }],
    time_range: range,
  });
  expect(mask.filterState?.value).toEqual([range]);
  expect(mask.filterState?.selectedValues).toEqual([range]);
});

test('clicking the selected bucket again clears the filter', () => {
  const args = {
    timestamp: ts('2024-03-15T00:00:00'),
    granularity: 'day' as const,
    temporalColumn: 'event_time',
  };
  const selected = getCrossFilterDataMask(args);
  expect(
    getCrossFilterDataMask({ ...args, filterState: selected.filterState }),
  ).toEqual(getClearCrossFilterDataMask());
});

test('missing temporal column produces a clearing mask', () => {
  expect(
    getCrossFilterDataMask({ timestamp: 0, granularity: 'day' }),
  ).toEqual(getClearCrossFilterDataMask());
});

test('isCellSelected matches only the selected bucket', () => {
  const mask = getCrossFilterDataMask({
    timestamp: ts('2024-03-15T00:00:00'),
    granularity: 'day',
    temporalColumn: 'c',
  });
  expect(
    isCellSelected(mask.filterState, ts('2024-03-15T00:00:00'), 'day'),
  ).toBe(true);
  expect(
    isCellSelected(mask.filterState, ts('2024-03-16T00:00:00'), 'day'),
  ).toBe(false);
  expect(isCellSelected(undefined, ts('2024-03-15T00:00:00'), 'day')).toBe(
    false,
  );
});