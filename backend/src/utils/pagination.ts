type ParsePaginationOptions = {
  pageKey?: string;
  pageSizeKey?: string;
  defaultPage?: number;
  defaultPageSize?: number;
  maxPageSize?: number;
};

export type PaginationParams = {
  page: number;
  pageSize: number;
  skip: number;
  limit: number;
};

export type PaginationMeta = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

function readQueryValue(query: unknown, key: string): unknown {
  if (!query || typeof query !== "object") {
    return undefined;
  }

  const value = (query as Record<string, unknown>)[key];
  return Array.isArray(value) ? value[0] : value;
}

function toPositiveInteger(value: unknown, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  const normalized = Math.trunc(parsed);
  return normalized > 0 ? normalized : fallback;
}

export function parsePagination(
  query: unknown,
  options: ParsePaginationOptions = {},
): PaginationParams {
  const pageKey = options.pageKey ?? "page";
  const pageSizeKey = options.pageSizeKey ?? "pageSize";
  const defaultPage = options.defaultPage ?? 1;
  const defaultPageSize = options.defaultPageSize ?? 5;
  const maxPageSize = options.maxPageSize ?? 100;

  const page = toPositiveInteger(readQueryValue(query, pageKey), defaultPage);
  const sizeInput =
    readQueryValue(query, pageSizeKey) ??
    readQueryValue(query, "perPage") ??
    readQueryValue(query, "limit");
  const pageSize = Math.min(
    toPositiveInteger(sizeInput, defaultPageSize),
    maxPageSize,
  );

  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    limit: pageSize,
  };
}

export function buildPaginationMeta(
  totalItems: number,
  page: number,
  pageSize: number,
): PaginationMeta {
  const normalizedTotalItems = Math.max(0, totalItems);
  const totalPages =
    normalizedTotalItems === 0 ? 1 : Math.ceil(normalizedTotalItems / pageSize);

  return {
    page,
    pageSize,
    totalItems: normalizedTotalItems,
    totalPages,
    hasNextPage: normalizedTotalItems > 0 && page < totalPages,
    hasPreviousPage: page > 1,
  };
}
