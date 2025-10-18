import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { sendConfirmationEmail } from "../utils/emailService.js";
import { generateToken } from "../utils/generateToken.js"; // add this import


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

    // Send confirmation email (skip if credentials not configured)
    try {
      await sendConfirmationEmail(email, confirmationCode);
      console.log(`Confirmation email sent to ${email} (code: ${confirmationCode})`);
    } catch (emailError) {
      console.warn(`  Email not sent (credentials not configured). Confirmation code: ${confirmationCode}`);
      // Continue signup even if email fails in development
    }

    res.status(201).json({
      success: true,
      message:
        "Signup step 1 complete. A confirmation code has been sent to your email.",
      userId: newUser._id,
      // Include confirmation code in development mode for testing
      ...(process.env.NODE_ENV === 'development' && { 
        confirmationCode: confirmationCode,
        devNote: "Confirmation code included because NODE_ENV=development"
      }),
    });
  } catch (error) {
    console.error("Signup error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error during signup. Please try again later.",
    });
  }
};

// STEP 2: Verify confirmation code
export const signUpStep2 = async (req, res) => {
  try {
    // Accept both 'code' and 'confirmationCode' for flexibility
    const { userId, code, confirmationCode } = req.body;
    const verificationCode = code || confirmationCode;

    if (!userId || !verificationCode) {
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

    if (user.confirmationCode !== verificationCode) {
      return res.status(400).json({ message: "Invalid confirmation code." });
    }

    user.isConfirmed = true;
    user.confirmationCode = null;
    await user.save();

    console.log(`User ${user.email} confirmed successfully.`);

    res.status(200).json({
      success: true,
      message: "Email verified successfully. Account activated!",
    });
  } catch (error) {
    console.error("Verification error:", error.message);
    res.status(500).json({
      success: false,
      message: "Server error during verification. Please try again later.",
    });
  }
};

// STEP 3: Complete Student Profile
export const completeProfileStep3 = async (req, res) => {
  try {
    const { userId, fullName, school, major, classification } = req.body;

    if (!userId || !fullName || !school) {
      return res.status(400).json({
        success: false,
        message: "Please provide at least full name and school.",
      });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found." });

    if (!user.isConfirmed) {
      return res.status(400).json({
        message: "Please confirm your email before completing your profile.",
      });
    }

    // Update fields
    user.fullName = fullName;
    user.school = school;

    if (user.role === "student") {
      if (!major || !classification) {
        return res.status(400).json({
          message: "Students must provide both major and classification.",
        });
      }
      user.major = major;
      user.classification = classification;
    }

    await user.save();

    // Generate JWT token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: `${user.role} profile completed successfully.`,
      user: {
        id: user._id,
        email: user.email,
        fullName: user.fullName,
        school: user.school,
        ...(user.role === "student" && {
          major: user.major,
          classification: user.classification,
        }),
        role: user.role,
      },
      token, // <--- include JWT here
    });
  } catch (error) {
    console.error("Profile completion error:", error.message);
    res.status(500).json({ message: "Server error during profile completion." });
  }
};