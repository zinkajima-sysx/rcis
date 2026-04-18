export const DEFAULT_TABLE_ROWS = 10;
export const DEFAULT_CARD_PAGE_SIZE = 6;
export const TABLE_PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

export function getPageCount(totalItems: number, pageSize: number) {
  return Math.max(1, Math.ceil(totalItems / pageSize));
}

export function getSafePage(
  requestedPage: number,
  totalItems: number,
  pageSize: number
) {
  return Math.min(Math.max(1, requestedPage), getPageCount(totalItems, pageSize));
}

export function paginateItems<T>(items: T[], page: number, pageSize: number) {
  const safePage = getSafePage(page, items.length, pageSize);
  const start = (safePage - 1) * pageSize;
  const end = start + pageSize;

  return {
    page: safePage,
    pageCount: getPageCount(items.length, pageSize),
    start,
    end,
    items: items.slice(start, end),
  };
}
