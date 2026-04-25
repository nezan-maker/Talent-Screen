import mongoose from "mongoose";
export async function connectToMongo(uri) {
    mongoose.set("strictQuery", true);
    await mongoose.connect(uri);
}
//# sourceMappingURL=mongo.js.map