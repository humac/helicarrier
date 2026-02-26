/**
 * Cron Expression Parser and Utilities
 */

export interface CronParts {
  minute: string;
  hour: string;
  day: string;
  month: string;
  weekday: string;
}

export interface CronSchedule {
  minute: number[];
  hour: number[];
  day: number[];
  month: number[];
  weekday: number[];
}

/**
 * Parses a cron expression string into parts
 */
export function parseCronExpression(expr: string): CronParts | null {
  const parts = expr.trim().split(/\s+/);
  
  if (parts.length !== 5) {
    return null;
  }

  return {
    minute: parts[0],
    hour: parts[1],
    day: parts[2],
    month: parts[3],
    weekday: parts[4],
  };
}

/**
 * Expands a cron field to an array of values
 */
function expandField(field: string, min: number, max: number): number[] {
  const values: number[] = [];

  if (field === '*') {
    for (let i = min; i <= max; i++) {
      values.push(i);
    }
    return values;
  }

  // Handle comma-separated values (e.g., "1,3,5")
  if (field.includes(',')) {
    const parts = field.split(',');
    for (const part of parts) {
      values.push(...expandField(part, min, max));
    }
    return values;
  }

  // Handle ranges (e.g., "1-5")
  if (field.includes('-')) {
    const [startStr, endStr] = field.split('-');
    const start = parseInt(startStr, 10);
    const end = parseInt(endStr, 10);
    for (let i = start; i <= end; i++) {
      values.push(i);
    }
    return values;
  }

  // Handle step values (e.g., "*/5" or "1-10/2")
  if (field.includes('/')) {
    const [base, stepStr] = field.split('/');
    const step = parseInt(stepStr, 10);
    
    if (base === '*') {
      for (let i = min; i <= max; i += step) {
        values.push(i);
      }
      return values;
    }
    
    // Handle range with step (e.g., "1-10/2")
    const range = expandField(base, min, max);
    for (let i = 0; i < range.length; i += step) {
      values.push(range[i]);
    }
    return values;
  }

  // Single value
  values.push(parseInt(field, 10));
  return values;
}

/**
 * Converts cron parts to a schedule object with expanded arrays
 */
export function parseCronToSchedule(expr: string): CronSchedule | null {
  const parts = parseCronExpression(expr);
  if (!parts) {
    return null;
  }

  return {
    minute: expandField(parts.minute, 0, 59),
    hour: expandField(parts.hour, 0, 23),
    day: expandField(parts.day, 1, 31),
    month: expandField(parts.month, 1, 12),
    weekday: expandField(parts.weekday, 0, 6),
  };
}

/**
 * Gets the number of days in a given month
 */
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Checks if a date matches the cron schedule
 */
function matchesSchedule(
  date: Date,
  schedule: CronSchedule,
  tz: string = 'UTC'
): boolean {
  const dateInTZ = new Date(date.toLocaleString('en-US', { timeZone: tz }));

  // Check minute
  if (!schedule.minute.includes(dateInTZ.getMinutes())) {
    return false;
  }

  // Check hour
  if (!schedule.hour.includes(dateInTZ.getHours())) {
    return false;
  }

  // Check month
  if (!schedule.month.includes(dateInTZ.getMonth() + 1)) {
    return false;
  }

  // Check day/weekday logic
  const dayOfWeek = dateInTZ.getDay();
  const dayOfMonth = dateInTZ.getDate();

  // If both day and weekday are not '*' (wildcard), use OR logic
  // If one is '*', match the other
  const dayWildcard = schedule.day.length === 31;
  const weekdayWildcard = schedule.weekday.length === 7;

  if (!dayWildcard && !weekdayWildcard) {
    // Both are specified - match if either matches (standard cron behavior)
    if (!schedule.day.includes(dayOfMonth) && !schedule.weekday.includes(dayOfWeek)) {
      return false;
    }
  } else if (!dayWildcard) {
    // Only day is specified
    if (!schedule.day.includes(dayOfMonth)) {
      return false;
    }
  } else if (!weekdayWildcard) {
    // Only weekday is specified
    if (!schedule.weekday.includes(dayOfWeek)) {
      return false;
    }
  }

  return true;
}

/**
 * Gets the next N occurrence timestamps for a cron expression
 */
export function getNextRuns(
  expr: string,
  tz: string = 'UTC',
  count: number = 5
): number[] {
  const schedule = parseCronToSchedule(expr);
  if (!schedule) {
    return [];
  }

  const runs: number[] = [];
  const now = new Date();
  
  // Start checking from the current minute
  let current = new Date(now);
  current.setSeconds(0, 0);

  // If we're not at a valid minute, move to the next minute
  if (!schedule.minute.includes(current.getMinutes())) {
    current.setMinutes(current.getMinutes() + 1);
    current.setSeconds(0, 0);
  }

  const maxIterations = 100000; // Prevent infinite loops
  let iterations = 0;

  while (runs.length < count && iterations < maxIterations) {
    if (matchesSchedule(current, schedule, tz)) {
      runs.push(current.getTime());
    }
    
    // Move to the next minute
    current.setMinutes(current.getMinutes() + 1);
    iterations++;
  }

  return runs;
}

/**
 * Calculates which days of the week a cron job runs on
 */
export function getWeekdayOccurrences(expr: string): number[] {
  const schedule = parseCronToSchedule(expr);
  if (!schedule) {
    return [];
  }

  // Return the days of the week the job runs on
  return schedule.weekday;
}

/**
 * Maps jobs to days in a week based on their cron expressions
 */
export function getWeekOccurrences(
  jobs: Array<{ id: string; name: string; schedule: { expr: string } }>,
  weekStart: Date
): Map<number, Array<{ id: string; name: string }>> {
  const occurrences = new Map<number, Array<{ id: string; name: string }>>();

  // Initialize empty arrays for each day of the week
  for (let i = 0; i < 7; i++) {
    occurrences.set(i, []);
  }

  for (const job of jobs) {
    const schedule = parseCronToSchedule(job.schedule.expr);
    if (!schedule) {
      continue;
    }

    // Get the day of week for this job
    for (const day of schedule.weekday) {
      if (!occurrences.has(day)) {
        occurrences.set(day, []);
      }
      occurrences.get(day)?.push({ id: job.id, name: job.name });
    }
  }

  return occurrences;
}

/**
 * Formats a timestamp into a human-readable time string
 */
export function formatTime(epochMs: number, tz: string = 'UTC'): string {
  return new Date(epochMs).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: tz,
  });
}

/**
 * Gets the start of the week (Sunday) for a given date
 */
export function getWeekStart(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay();
  result.setDate(result.getDate() - day);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Gets the end of the week (Saturday) for a given date
 */
export function getWeekEnd(date: Date): Date {
  const start = getWeekStart(date);
  const result = new Date(start);
  result.setDate(start.getDate() + 6);
  result.setHours(23, 59, 59, 999);
  return result;
}

/**
 * Gets all dates in a week starting from weekStart
 */
export function getWeekDays(weekStart: Date): Date[] {
  const days: Date[] = [];
  const current = new Date(weekStart);

  for (let i = 0; i < 7; i++) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  return days;
}

/**
 * Formats a date as a day name and date
 */
export function formatDayDate(date: Date, tz: string = 'UTC'): string {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayName = dayNames[date.getDay()];
  const day = date.getDate();
  const month = date.toLocaleString('en-US', { month: 'short', timeZone: tz });

  return `${dayName} ${month} ${day}`;
}

/**
 * Checks if a date is today (in the specified timezone)
 */
export function isToday(date: Date, tz: string = 'UTC'): boolean {
  const now = new Date();
  const dateInTZ = new Date(date.toLocaleString('en-US', { timeZone: tz }));
  const nowInTZ = new Date(now.toLocaleString('en-US', { timeZone: tz }));

  return (
    dateInTZ.getFullYear() === nowInTZ.getFullYear() &&
    dateInTZ.getMonth() === nowInTZ.getMonth() &&
    dateInTZ.getDate() === nowInTZ.getDate()
  );
}
