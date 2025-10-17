import express from "express";
import { signUpStep1, signUpStep2 } from "../controllers/auth.controller.js";

const router = express.Router();

// Step 1: Signup (email + password)
router.post("/signup/step1", signUpStep1);

// Step 2: Verify confirmation code
router.post("/signup/verify", signUpStep2);


export default router;
