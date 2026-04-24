const INDONESIAN_DATE_PATTERN = /^(\d{2})\/(\d{2})\/(\d{4})$/;

export function formatDateIndonesia(value: Date | string | null | undefined) {
  if (!value) {
    return '-';
  }

  const resolvedDate = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(resolvedDate.getTime())) {
    return '-';
  }

  return resolvedDate.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatDateForInputIndonesia(value: Date | string | null | undefined) {
  if (!value) {
    return '';
  }

  const resolvedDate = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(resolvedDate.getTime())) {
    return '';
  }

  return [
    String(resolvedDate.getDate()).padStart(2, '0'),
    String(resolvedDate.getMonth() + 1).padStart(2, '0'),
    String(resolvedDate.getFullYear()),
  ].join('/');
}

export function parseIndonesianDate(value: string) {
  const normalizedValue = value.trim();
  const match = INDONESIAN_DATE_PATTERN.exec(normalizedValue);

  if (!match) {
    return null;
  }

  const day = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10);
  const year = Number.parseInt(match[3], 10);
  const resolvedDate = new Date(year, month - 1, day);

  if (
    Number.isNaN(resolvedDate.getTime()) ||
    resolvedDate.getFullYear() !== year ||
    resolvedDate.getMonth() !== month - 1 ||
    resolvedDate.getDate() !== day
  ) {
    return null;
  }

  resolvedDate.setHours(0, 0, 0, 0);
  return resolvedDate;
}

export function getTodayStart() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

export function getDaysUntilDate(value: Date | string | null | undefined, baseDate = getTodayStart()) {
  if (!value) {
    return null;
  }

  const resolvedDate = value instanceof Date ? new Date(value) : new Date(value);

  if (Number.isNaN(resolvedDate.getTime())) {
    return null;
  }

  resolvedDate.setHours(0, 0, 0, 0);
  return Math.ceil((resolvedDate.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));
}
