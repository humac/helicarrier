'use client';

import React from 'react';
import { CronJob } from '@/lib/types';
import DayCell from './DayCell';

interface WeekGridProps {
  weekStart: Date;
  jobs: CronJob[];
  selectedJob: CronJob | null;
  onSelectJob: (job: CronJob) => void;
}

export default function WeekGrid({
  weekStart,
  jobs,
  selectedJob,
  onSelectJob,
}: WeekGridProps) {
  // Get all days in the week
  const weekDays = getWeekDays(weekStart);

  // Group jobs by day of week (0-6)
  const jobsByDay = jobs.reduce((acc, job) => {
    const cronParts = job.schedule.expr.split(/\s+/);
    const weekdayField = cronParts[4]; // 5th field is weekday

    // Parse weekday field
    const daysOfWeek = parseWeekdayField(weekdayField);

    for (const day of daysOfWeek) {
      if (day >= 0 && day <= 6) {
        if (!acc[day]) acc[day] = [];
        acc[day].push(job);
      }
    }
    return acc;
  }, {} as Record<number, CronJob[]>);

  function getWeekDays(start: Date): Date[] {
    const days: Date[] = [];
    const current = new Date(start);

    for (let i = 0; i < 7; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return days;
  }

  function parseWeekdayField(field: string): number[] {
    const values: number[] = [];

    if (field === '*') {
      // Every day of the week
      for (let i = 0; i < 7; i++) {
        values.push(i);
      }
      return values;
    }

    // Handle comma-separated values (e.g., "1,3,5")
    if (field.includes(',')) {
      const parts = field.split(',');
      for (const part of parts) {
        values.push(...parseWeekdayField(part));
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

    // Handle step values (e.g., "*/2")
    if (field.includes('/')) {
      const [base, stepStr] = field.split('/');
      const step = parseInt(stepStr, 10);

      if (base === '*') {
        for (let i = 0; i < 7; i += step) {
          values.push(i);
        }
        return values;
      }

      // Handle range with step (e.g., "1-6/2")
      const range = parseWeekdayField(base);
      for (let i = 0; i < range.length; i += step) {
        values.push(range[i]);
      }
      return values;
    }

    // Single value
    values.push(parseInt(field, 10));
    return values;
  }

  return (
    <div className="grid grid-cols-7 gap-2 h-full">
      {weekDays.map((date, index) => {
        const dayJobs = jobsByDay[index] || [];
        return (
          <DayCell
            key={index}
            date={date}
            jobs={dayJobs}
            isSelected={selectedJob !== null}
            onSelectJob={onSelectJob}
          />
        );
      })}
    </div>
  );
}
