function readQueryValue(query, key) {
    if (!query || typeof query !== "object") {
        return undefined;
    }
    const value = query[key];
    return Array.isArray(value) ? value[0] : value;
}
function toPositiveInteger(value, fallback) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
        return fallback;
    }
    const normalized = Math.trunc(parsed);
    return normalized > 0 ? normalized : fallback;
}
export function parsePagination(query, options = {}) {
    const pageKey = options.pageKey ?? "page";
    const pageSizeKey = options.pageSizeKey ?? "pageSize";
    const defaultPage = options.defaultPage ?? 1;
    const defaultPageSize = options.defaultPageSize ?? 5;
    const maxPageSize = options.maxPageSize ?? 100;
    const page = toPositiveInteger(readQueryValue(query, pageKey), defaultPage);
    const sizeInput = readQueryValue(query, pageSizeKey) ??
        readQueryValue(query, "perPage") ??
        readQueryValue(query, "limit");
    const pageSize = Math.min(toPositiveInteger(sizeInput, defaultPageSize), maxPageSize);
    return {
        page,
        pageSize,
        skip: (page - 1) * pageSize,
        limit: pageSize,
    };
}
export function buildPaginationMeta(totalItems, page, pageSize) {
    const normalizedTotalItems = Math.max(0, totalItems);
    const totalPages = normalizedTotalItems === 0 ? 1 : Math.ceil(normalizedTotalItems / pageSize);
    return {
        page,
        pageSize,
        totalItems: normalizedTotalItems,
        totalPages,
        hasNextPage: normalizedTotalItems > 0 && page < totalPages,
        hasPreviousPage: page > 1,
    };
}
//# sourceMappingURL=pagination.js.map