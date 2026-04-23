import crypto from "crypto";

const randomId = crypto.randomBytes(16).toString("hex");
console.log(randomId);
