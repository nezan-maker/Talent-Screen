import mongoose from "mongoose";
import debug from "debug";
import dotenv from "dotenv";
dotenv.config();
export const dbDebug = debug("app:db");
let listenersAttached = false;
function attachConnectionListeners() {
    if (listenersAttached) {
        return;
    }
    listenersAttached = true;
    mongoose.connection.on("connected", () => {
        dbDebug("MongoDB connected");
    });
    mongoose.connection.on("reconnected", () => {
        dbDebug("MongoDB reconnected");
    });
    mongoose.connection.on("disconnected", () => {
        dbDebug("MongoDB disconnected");
    });
    mongoose.connection.on("error", (error) => {
        dbDebug("MongoDB connection error");
        dbDebug(error);
    });
}
function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
const connectDB = async () => {
    const { MONGO_URI } = process.env;
    if (!MONGO_URI) {
        throw new Error("MONGO_URI is not set");
    }
    attachConnectionListeners();
    const maxAttempts = 5;
    let lastError = null;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        try {
            await mongoose.connect(MONGO_URI, {
                serverSelectionTimeoutMS: 15000,
                socketTimeoutMS: 45000,
                maxPoolSize: 20,
                minPoolSize: 1,
            });
            return;
        }
        catch (error) {
            lastError = error;
            dbDebug(`Error connecting to database (attempt ${attempt}/${maxAttempts})`);
            dbDebug(error);
            if (attempt < maxAttempts) {
                await delay(2000 * attempt);
            }
        }
    }
    throw lastError ?? new Error("Unable to connect to MongoDB");
};
export default connectDB;
//# sourceMappingURL=db.js.map