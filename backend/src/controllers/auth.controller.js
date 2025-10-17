import bcrypt from "bcryptjs";
import User from "../models/user.js";
import { sendConfirmationEmail } from "../utils/emailService.js";

// STEP 1: Sign up with email & password
export const signUpStep1 = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide both email and password." });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "This email is already registered." });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate confirmation code (6-digit)
    const confirmationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Create new unconfirmed user
    const newUser = await User.create({
      email,
      password: hashedPassword,
      confirmationCode,
      isConfirmed: false,
    });

    // Send confirmation email
    await sendConfirmationEmail(email, confirmationCode);

    console.log(`📧 Confirmation email sent to ${email} (code: ${confirmationCode})`);

    res.status(201).json({
      success: true,
      message:
        "Signup step 1 complete. A confirmation code has been sent to your email.",
      userId: newUser._id,
    });
  } catch (error) {
    console.error("❌ Signup error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error during signup. Please try again later.",
    });
  }
};

// STEP 2: Verify confirmation code
export const signUpStep2 = async (req, res) => {
  try {
    const { userId, code } = req.body;

    if (!userId || !code) {
      return res
        .status(400)
        .json({ message: "Please provide both userId and confirmation code." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.isConfirmed) {
      return res.status(400).json({ message: "Account already confirmed." });
    }

    if (user.confirmationCode !== code) {
      return res.status(400).json({ message: "Invalid confirmation code." });
    }

    user.isConfirmed = true;
    user.confirmationCode = null;
    await user.save();

    console.log(`✅ User ${user.email} confirmed successfully.`);

    res.status(200).json({
      success: true,
      message: "Email verified successfully. Account activated!",
    });
  } catch (error) {
    console.error("❌ Verification error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error during verification. Please try again later.",
    });
  }
};


