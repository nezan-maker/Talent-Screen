import mongoose from "mongoose";
import { buildEntityId } from "../utils/ids.js";
const userSchema = new mongoose.Schema({
    _id: {
        type: String,
        default: () => buildEntityId("user"),
    },
    user_name: {
        type: String,
        required: true,
    },
    user_pass: {
        type: String,
        required: true,
    },
    company_name: {
        type: String,
        required: true,
    },
    user_email: {
        type: String,
        unique: true,
        required: true,
        index: true,
    },
    pass_token: {
        type: String,
        default: null,
    },
    sign_otp_token: {
        type: String,
        default: null,
    },
    refresh_token: {
        type: String,
        default: null,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    confirmation_link_id: {
        type: String,
        default: "",
    },
}, { timestamps: true });
const User = mongoose.model("User", userSchema);
export default User;
//# sourceMappingURL=User.js.map