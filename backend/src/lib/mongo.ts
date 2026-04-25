import mongoose from "mongoose";

export async function connectToMongo(uri: string) {
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);

}

