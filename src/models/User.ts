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
    required: true,
  },
  pass_token: {
    type: String,
    default: null,
  },
  isVerified:{
    type:Boolean,
    default:false
  }
});
const User = mongoose.model("User",userSchema)
export default User
