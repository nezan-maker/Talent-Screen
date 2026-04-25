import crypto from "node:crypto";
export function buildEntityId(prefix) {
    const suffix = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
    return `${prefix}_${suffix}`;
}
//# sourceMappingURL=ids.js.map