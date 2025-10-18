# Login Process Documentation

## Overview
This document describes the 2-step login process with email verification for enhanced security.

---

## Current Status: ✅ **COMPLETE**

The 2-step login authentication flow is fully implemented and ready for testing.

---

## Multi-Step Login Flow

The login system follows a secure 2-step process:

```
Step 1: Login with Email & Password
    ↓
    (Verification code sent via email)
    ↓
Step 2: Verify Login Code
    ↓
    (JWT token issued)
```

---

## Step 1: Login with Email & Password ✅

### Endpoint
```
POST /api/auth/login/step1
```

### Request Body
```json
{
  "email": "user@example.com",
  "password": "YourPassword123"
}
```

### Logic Flow

1. **Validation**: Check if email and password are provided
2. **Find User**: Retrieve user from database by email (including password field)
3. **Account Status Check**: Verify the account is confirmed
4. **Password Verification**: Compare provided password with hashed password using bcrypt
5. **Generate Verification Code**: Create a random 6-digit code
6. **Set Expiration**: Code expires in 10 minutes
7. **Save to Database**: Store login code and expiration in user document
8. **Send Email**: Trigger email service to send verification code
9. **Response**: Return success message with userId

### Response
```json
{
  "success": true,
  "message": "Login verification code sent to your email.",
  "userId": "507f1f77bcf86cd799439011",
  "loginCode": "654321",
  "devNote": "Login code included because NODE_ENV=development"
}
```

**Note**: The `loginCode` is only included in the response when `NODE_ENV=development` for testing purposes. In production, it will only be sent via email.

### Error Responses

**Invalid Credentials (401)**:
```json
{
  "success": false,
  "message": "Invalid email or password."
}
```

**Unconfirmed Account (403)**:
```json
{
  "success": false,
  "message": "Please verify your email before logging in."
}
```

### Code Location
- **Controller**: `backend/src/controllers/auth.controller.js` (loginStep1 function)
- **Route**: `backend/src/routes/auth.routes.js`

---

## Step 2: Verify Login Code ✅

### Endpoint
```
POST /api/auth/login/verify
```

### Request Body
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "loginCode": "654321"
}
```
OR
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "code": "654321"
}
```

**Note**: The endpoint accepts both `loginCode` and `code` parameter names for flexibility.

### Logic Flow

1. **Validation**: Check if userId and verification code are provided
2. **Find User**: Retrieve user from database by userId
3. **Code Existence Check**: Verify login code exists
4. **Expiration Check**: Ensure code hasn't expired (10 minutes)
5. **Code Validation**: Compare provided code with stored code
6. **Clear Code**: Remove login code and expiration from database
7. **Generate JWT Token**: Create authentication token (expires in 7 days)
8. **Response**: Return success message with user info and JWT token

### Response
```json
{
  "success": true,
  "message": "Login successful!",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "fullName": "John Doe",
    "school": "SSE",
    "major": "Computer Science",
    "classification": "Junior",
    "role": "student"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Error Responses

**No Login Code (400)**:
```json
{
  "success": false,
  "message": "No login code found. Please request a new one."
}
```

**Expired Code (400)**:
```json
{
  "success": false,
  "message": "Login code has expired. Please login again."
}
```

**Invalid Code (401)**:
```json
{
  "success": false,
  "message": "Invalid verification code."
}
```

### Code Location
- **Controller**: `backend/src/controllers/auth.controller.js` (loginStep2 function)
- **Route**: `backend/src/routes/auth.routes.js`
- **Token Generator**: `backend/src/utils/generateToken.js`

---

## Database Schema Changes

### User Model Updates
Added new fields to support login verification:

```javascript
{
  loginCode: String (nullable, default: null),
  loginCodeExpires: Date (nullable, default: null)
}
```

**File Location**: `backend/src/models/User.js`

---

## Security Features

### 1. **Two-Factor Authentication (2FA)**
- Users must verify both their password AND email access
- Reduces risk of unauthorized access even if password is compromised

### 2. **Time-Limited Codes**
- Login codes expire after 10 minutes
- Prevents code reuse attacks
- Codes are deleted after use

### 3. **Password Security**
- Passwords are hashed with bcrypt
- Passwords never returned in API responses
- Uses `select: false` in User model

### 4. **Rate Limiting Ready**
- Login endpoints are prepared for rate limiting implementation
- Prevents brute force attacks

### 5. **Account Status Validation**
- Only confirmed accounts can login
- Protects against unauthorized email use

---

## Testing the Login Flow

### Step 1: Request Login Code
```http
POST http://localhost:4000/api/auth/login/step1
Content-Type: application/json

{
  "email": "uihabkass2310@gmail.com",
  "password": "TestPassword123"
}
```

**Save the `userId` and `loginCode` from the response!**

---

### Step 2: Verify Code and Get Token
```http
POST http://localhost:4000/api/auth/login/verify
Content-Type: application/json

{
  "userId": "<userId from step 1>",
  "loginCode": "<code from step 1>"
}
```

**Save the JWT `token` for authenticated requests!**

---

## Using the JWT Token

After successful login, use the JWT token for authenticated requests:

```http
GET http://localhost:4000/api/protected-endpoint
Authorization: Bearer <your-jwt-token-here>
```

---

## Environment Variables

No additional environment variables required beyond the existing authentication setup:

```env
# Already configured for signup
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password
```

---

## Complete Authentication Flow

### New User Journey
1. **Signup Step 1**: Register with email & password
2. **Signup Step 2**: Verify email with confirmation code
3. **Signup Step 3**: Complete profile → Receive JWT token
4. Use token for authenticated requests

### Returning User Journey
1. **Login Step 1**: Login with email & password
2. **Login Step 2**: Verify with login code → Receive JWT token
3. Use token for authenticated requests

---

## Code Expiration Comparison

| Code Type | Purpose | Expiration | Field Name |
|-----------|---------|------------|------------|
| Confirmation Code | Email verification during signup | No expiration | `confirmationCode` |
| Login Code | Two-factor login verification | 10 minutes | `loginCode` |
| JWT Token | Authentication for API requests | 7 days | N/A (client-side) |

---

## Files Modified

### Modified Files
- ✅ `backend/src/models/User.js` - Added loginCode and loginCodeExpires fields
- ✅ `backend/src/controllers/auth.controller.js` - Added loginStep1 and loginStep2 functions
- ✅ `backend/src/routes/auth.routes.js` - Added login routes

### Existing Files Used
- `backend/src/utils/generateToken.js` - JWT token generation
- `backend/src/utils/emailService.js` - Email verification codes
- `backend/src/middleware/auth.middleware.js` - JWT verification for protected routes

---

## Testing Checklist

- [ ] Test Step 1: Login with valid credentials
- [ ] Test Step 1: Login with invalid email
- [ ] Test Step 1: Login with wrong password
- [ ] Test Step 1: Login with unconfirmed account
- [ ] Test Step 2: Verify with valid code
- [ ] Test Step 2: Verify with invalid code
- [ ] Test Step 2: Verify with expired code (wait 10+ minutes)
- [ ] Test Step 2: Try to reuse a code after successful login
- [ ] Test JWT token works for protected routes
- [ ] Test JWT token expires after 7 days

---

## Next Steps

1. 🔄 Test the complete login flow
2. 🔄 Add rate limiting to prevent brute force attacks
3. 🔄 Implement "Forgot Password" functionality
4. 🔄 Add account lockout after multiple failed attempts
5. 🔄 Implement refresh token mechanism
6. 🔄 Add login history/audit trail
7. 🔄 Implement "Remember Me" functionality
8. 🔄 Add IP-based security checks

---

**Last Updated**: October 18, 2025  
**Status**: ✅ 2-step login process fully implemented and ready for testing

