export function expectRow<T>(row: T | undefined, message = 'Data database tidak ditemukan.') {
  if (!row) {
    throw new Error(message);
  }

  return row;
}
