import mongoose, { model, Model } from "mongoose";
interface User_ {
  user_name: string;
  user_pass: string;
  company_name: string;
  user_email: string;
  isVerified: boolean;
  pass_token: string | null;
  sign_otp_token: string | null;
  refresh_token: string | null;
}
const userSchema = new mongoose.Schema(
  {
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
  },
  { timestamps: true },
);
const User = mongoose.model("User", userSchema);

export default User;
