import { addDays, format, startOfWeek } from "date-fns";

/** Monday-start week, matching the rest of the planner's Mon-Sun layout. */
export const getWeekStart = (date: Date) => startOfWeek(date, { weekStartsOn: 1 });

export const toDateKey = (date: Date) => format(date, "yyyy-MM-dd");

export const getWeekDays = (weekStart: Date) =>
  Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
