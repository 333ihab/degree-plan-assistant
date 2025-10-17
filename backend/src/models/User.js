import mongoose from "mongoose";
import validator from "validator";

const userSchema = new mongoose.Schema(
    //proposed schema for user model
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, "Invalid email address"],
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false, // hide password in queries by default
    },
    confirmationCode: {
        type: String,
        default: null,
      },
      isConfirmed: {
        type: Boolean,
        default: false,
      },
    role: {
      type: String,
      enum: ["student", "peer_mentor", "fye_teacher", "admin"],
      default: "student",
    },
    confirmationCode: String,
    isConfirmed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
