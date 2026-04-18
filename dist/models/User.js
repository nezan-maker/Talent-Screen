import mongoose, { Mongoose } from "mongoose";
const userSchema = new mongoose.Schema({
    user_name: {
        type: String,
        required: true,
    },
    user_pass: {
        type: String,
        required: true,
    },
    user_email: {
        type: String,
        unique: true,
        required: true,
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
        type: "String",
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
});
const User = mongoose.model("User", userSchema);
export default User;
//# sourceMappingURL=User.js.map