import express from "express";
import { 
  signUpStep1, 
  signUpStep2, 
  completeProfileStep3,
  loginStep1,
  loginStep2
} from "../controllers/auth.controller.js";

const router = express.Router();

// ===== SIGNUP ROUTES =====
// Step 1: Signup (email + password)
router.post("/signup/step1", signUpStep1);

// Step 2: Verify confirmation code
router.post("/signup/verify", signUpStep2);

// Step 3: Complete profile (no auth required - part of signup process)
router.post("/signup/step3", completeProfileStep3);

// ===== LOGIN ROUTES =====
// Step 1: Login with email and password, send verification code
router.post("/login/step1", loginStep1);

// Step 2: Verify login code and get JWT token
router.post("/login/verify", loginStep2);

export default router;
