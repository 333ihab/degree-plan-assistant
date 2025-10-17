import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },
    confirmationCode: { type: String, default: null },
    isConfirmed: { type: Boolean, default: false },
    role: {
      type: String,
      enum: ["student", "peer_mentor", "fye_teacher", "admin"],
      default: "student",
    },
    fullName: { type: String },
    school: { type: String },
    major: { type: String, default: null }, // only for students
    classification: { type: String, default: null }, // only for students
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
