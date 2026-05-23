export function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  d.setHours(0, 0, 0, 0);
  return d;
}

export interface DateWindows {
  thisWeekStart: Date;
  lastWeekStart: Date;
  lastWeekEnd: Date;
  thirtyDaysAgo: Date;
}

export function computeDateWindows(today: Date): DateWindows {
  const thisWeekStart = getMondayOfWeek(today);
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const lastWeekEnd = new Date(thisWeekStart);
  lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);
  return { thisWeekStart, lastWeekStart, lastWeekEnd, thirtyDaysAgo };
}
