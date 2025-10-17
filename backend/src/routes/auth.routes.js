import express from "express";
import { signUpStep1, signUpStep2, completeProfileStep3 } from "../controllers/auth.controller.js";

const router = express.Router();

// Step 1: Signup (email + password)
router.post("/signup/step1", signUpStep1);

// Step 2: Verify confirmation code
router.post("/signup/verify", signUpStep2);

// Step 3: Complete profile
router.post("/signup/step3", completeProfileStep3);
export default router;
