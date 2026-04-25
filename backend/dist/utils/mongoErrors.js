export function isMongoTransientError(error) {
    const candidate = error;
    const name = String(candidate?.name ?? "");
    const message = String(candidate?.message ?? "").toLowerCase();
    const labels = candidate?.errorLabelSet;
    if (name === "MongoPoolClearedError" ||
        name === "MongoNetworkError" ||
        name === "MongoServerSelectionError") {
        return true;
    }
    if (labels?.has?.("PoolRequestedRetry") || labels?.has?.("ResetPool")) {
        return true;
    }
    if (message.includes("connection <monitor>") ||
        message.includes("pool for") ||
        message.includes("server selection timed out")) {
        return true;
    }
    if (candidate?.cause) {
        return isMongoTransientError(candidate.cause);
    }
    return false;
}
function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
export async function withMongoTransientRetry(operation, options = {}) {
    const attempts = Math.max(1, options.attempts ?? 2);
    const delayMs = Math.max(0, options.delayMs ?? 350);
    let lastError = null;
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
        try {
            return await operation();
        }
        catch (error) {
            lastError = error;
            if (!isMongoTransientError(error) || attempt >= attempts) {
                throw error;
            }
            await delay(delayMs * attempt);
        }
    }
    throw lastError ?? new Error("Mongo operation failed");
}
//# sourceMappingURL=mongoErrors.js.map