const pad = (value: number): string => String(value).padStart(2, '0');

export function formatDateInputValue(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function formatDateTimeLocalInputValue(date: Date): string {
  return `${formatDateInputValue(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function getTodayDateInputValue(now = new Date()): string {
  return formatDateInputValue(now);
}

export function getFirstDayOfCurrentMonthInputValue(now = new Date()): string {
  return formatDateInputValue(new Date(now.getFullYear(), now.getMonth(), 1));
}

export function getNowDateTimeLocalInputValue(now = new Date()): string {
  return formatDateTimeLocalInputValue(now);
}

export function toDateTimeLocalInputValue(value: string | Date | null | undefined): string {
  if (!value) {
    return '';
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return formatDateTimeLocalInputValue(date);
}
