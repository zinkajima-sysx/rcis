export function formatBusinessId(prefix: string, width: number, value: number) {
  return `${prefix}-${String(value).padStart(width, '0')}`;
}

export function extractBusinessIdNumber(rawValue: string | null | undefined, prefix: string) {
  if (!rawValue) {
    return null;
  }

  const expectedPrefix = `${prefix.toUpperCase()}-`;
  const normalizedValue = rawValue.trim().toUpperCase();

  if (!normalizedValue.startsWith(expectedPrefix)) {
    return null;
  }

  const numericPart = normalizedValue.slice(expectedPrefix.length);
  if (!/^\d+$/.test(numericPart)) {
    return null;
  }

  const parsed = Number.parseInt(numericPart, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

export function getNextBusinessId(values: Array<string | null | undefined>, prefix: string, width: number) {
  const highestValue = values.reduce((currentHighest, item) => {
    const parsedValue = extractBusinessIdNumber(item, prefix);
    return parsedValue === null ? currentHighest : Math.max(currentHighest, parsedValue);
  }, 0);

  return formatBusinessId(prefix, width, highestValue + 1);
}

export function getNextNumericTextId(values: Array<string | null | undefined>) {
  const highestValue = values.reduce((currentHighest, item) => {
    if (!item) {
      return currentHighest;
    }

    const parsedValue = Number.parseInt(item.trim(), 10);
    return Number.isFinite(parsedValue) ? Math.max(currentHighest, parsedValue) : currentHighest;
  }, 0);

  return String(highestValue + 1);
}
