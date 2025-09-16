/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: Secure Authentication & Authorization API
 * 
 * components:
 *   schemas:
 *     RegisterRequest:
 *       type: object
 *       required: [email, password, firstName, lastName]
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: User email address
 *         password:
 *           type: string
 *           minLength: 8
 *           pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]'
 *           description: Strong password (min 8 chars, mixed case, number, special char)
 *         firstName:
 *           type: string
 *           minLength: 2
 *           maxLength: 50
 *           description: User first name
 *         lastName:
 *           type: string
 *           minLength: 2
 *           maxLength: 50
 *           description: User last name
 *         phone:
 *           type: string
 *           pattern: '^[\+]?[1-9][\d]{0,15}$'
 *           description: User phone number (optional)
 *     LoginRequest:
 *       type: object
 *       required: [email, password]
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: User email address
 *         password:
 *           type: string
 *           description: User password
 *         rememberMe:
 *           type: boolean
 *           default: false
 *           description: Extend session duration
 *     AuthResponse:
 *       type: object
 *       properties:
 *         user:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               format: uuid
 *             email:
 *               type: string
 *               format: email
 *             firstName:
 *               type: string
 *             lastName:
 *               type: string
 *             isVerified:
 *               type: boolean
 *             avatarUrl:
 *               type: string
 *               format: uri
 *         tokens:
 *           type: object
 *           properties:
 *             accessToken:
 *               type: string
 *               description: JWT access token
 *             refreshToken:
 *               type: string
 *               description: JWT refresh token
 *             expiresIn:
 *               type: integer
 *               description: Token expiration time in seconds
 *     RefreshRequest:
 *       type: object
 *       required: [refreshToken]
 *       properties:
 *         refreshToken:
 *           type: string
 *           description: Valid refresh token
 *     ForgotPasswordRequest:
 *       type: object
 *       required: [email]
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: User email address
 *     ResetPasswordRequest:
 *       type: object
 *       required: [token, newPassword]
 *       properties:
 *         token:
 *           type: string
 *           description: Password reset token from email
 *         newPassword:
 *           type: string
 *           minLength: 8
 *           pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]'
 *           description: New strong password
 *     PerformanceMetrics:
 *       type: object
 *       properties:
 *         responseTime:
 *           type: number
 *           description: Response time in milliseconds
 *         securityScore:
 *           type: string
 *           enum: [A+, A, B+, B, C]
 *           description: Security implementation grade
 *         rateLimitRemaining:
 *           type: integer
 *           description: Remaining requests in rate limit window
 */
 
 import { Router } from 'express';
 import AuthController from '@/controllers/auth.controller';
 import { authenticateToken } from '@/middleware/auth.middleware';
 const router = Router();
 
 /**
  * @swagger
  * /auth/register:
  *   post:
  *     summary: Register new user account
  *     description: |
  *       Create a new user account with comprehensive validation and security.
  *       **Security Features:**
  *       - Strong password requirements
  *       - Email verification workflow
  *       - Rate limiting protection
  *       - Input sanitization and validation
  *       - Secure password hashing with bcrypt
  *     tags: [Authentication]
  *     requestBody:
  *       required: true
  *       content:
  *         application/json:
  *           schema:
  *             $ref: '#/components/schemas/RegisterRequest'
  *           example:
  *             email: "john.doe@example.com"
  *             password: "SecurePass123!"
  *             firstName: "John"
  *             lastName: "Doe"
  *             phone: "+1234567890"
  *     responses:
  *       201:
  *         description: User registered successfully
  *         content:
  *           application/json:
  *             schema:
  *               type: object
  *               properties:
  *                 user:
  *                   type: object
  *                   properties:
  *                     id:
  *                       type: string
  *                       format: uuid
  *                     email:
  *                       type: string
  *                       format: email
  *                     firstName:
  *                       type: string
  *                     lastName:
  *                       type: string
  *                     isVerified:
  *                       type: boolean
  *                       example: false
  *                 message:
  *                   type: string
  *                   example: "Registration successful. Please check your email for verification."
  *                 meta:
  *                   $ref: '#/components/schemas/PerformanceMetrics'
  *       400:
  *         description: Invalid input data
  *         content:
  *           application/json:
  *             schema:
  *               type: object
  *               properties:
  *                 error:
  *                   type: string
  *                   example: "Invalid email format"
  *                 errors:
  *                   type: array
  *                   items:
  *                     type: object
  *                     properties:
  *                       field:
  *                         type: string
  *                       message:
  *                         type: string
  *       409:
  *         description: Email already exists
  *       429:
  *         description: Too many registration attempts
  *       500:
  *         description: Server error
  */
 router.post('/register', AuthController.register);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get the authenticated user's profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current authenticated user info
 *       401:
 *         description: Unauthorized
 */
router.get('/me', authenticateToken, AuthController.me);
 
 /**
  * @swagger
  * /auth/login:
  *   post:
  *     summary: Login user
  *     description: |
  *       Authenticate user and return access tokens.
  *       **Security Features:**
  *       - Secure password verification
  *       - JWT token generation
  *       - Rate limiting protection
  *       - Failed login attempt tracking
  *       - Account lockout protection
  *     tags: [Authentication]
  *     requestBody:
  *       required: true
  *       content:
  *         application/json:
  *           schema:
  *             $ref: '#/components/schemas/LoginRequest'
  *           example:
  *             email: "john.doe@example.com"
  *             password: "SecurePass123!"
  *             rememberMe: false
  *     responses:
  *       200:
  *         description: Login successful
  *         content:
  *           application/json:
  *             schema:
  *               type: object
  *               properties:
  *                 data:
  *                   $ref: '#/components/schemas/AuthResponse'
  *                 meta:
  *                   $ref: '#/components/schemas/PerformanceMetrics'
  *       400:
  *         description: Invalid credentials
  *         content:
  *           application/json:
  *             schema:
  *               type: object
  *               properties:
  *                 error:
  *                   type: string
  *                   example: "Invalid email or password"
  *       401:
  *         description: Authentication failed
  *       423:
  *         description: Account locked due to too many failed attempts
  *       429:
  *         description: Too many login attempts
  *       500:
  *         description: Server error
  */
 router.post('/login', AuthController.login);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     description: |
 *       Generate new access token using valid refresh token.
 *       **Security Features:**
 *       - Refresh token validation
 *       - Token rotation for enhanced security
 *       - Automatic token expiration handling
 *       - Session management
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshRequest'
 *           example:
 *             refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tokens:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                       description: New JWT access token
 *                     refreshToken:
 *                       type: string
 *                       description: New JWT refresh token
 *                     expiresIn:
 *                       type: integer
 *                       description: Token expiration time in seconds
 *                 meta:
 *                   $ref: '#/components/schemas/PerformanceMetrics'
 *       400:
 *         description: Invalid refresh token
 *       401:
 *         description: Refresh token expired or revoked
 *       500:
 *         description: Server error
 */
router.post('/refresh', AuthController.refresh);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout user
 *     description: |
 *       Safely logout user and invalidate tokens.
 *       **Security Features:**
 *       - Token blacklisting
 *       - Session cleanup
 *       - Secure logout across all devices option
 *       - Audit logging
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               allDevices:
 *                 type: boolean
 *                 default: false
 *                 description: Logout from all devices
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Logout successful"
 *                 meta:
 *                   $ref: '#/components/schemas/PerformanceMetrics'
 *       401:
 *         description: Invalid or expired token
 *       500:
 *         description: Server error
 */
router.post('/logout', AuthController.logout);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     description: |
 *       Initiate password reset process by sending reset email.
 *       **Security Features:**
 *       - Secure token generation
 *       - Rate limiting protection
 *       - Email verification
 *       - Token expiration (15 minutes)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForgotPasswordRequest'
 *           example:
 *             email: "john.doe@example.com"
 *     responses:
 *       200:
 *         description: Password reset email sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Password reset instructions sent to your email"
 *                 meta:
 *                   $ref: '#/components/schemas/PerformanceMetrics'
 *       400:
 *         description: Invalid email format
 *       404:
 *         description: Email not found (but returns 200 for security)
 *       429:
 *         description: Too many password reset attempts
 *       500:
 *         description: Server error
 */
router.post('/forgot-password', AuthController.forgotPassword);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password with token
 *     description: |
 *       Complete password reset using valid reset token.
 *       **Security Features:**
 *       - Token validation and expiration checking
 *       - Strong password requirements
 *       - Secure password hashing
 *       - Automatic login after reset
 *       - Token invalidation after use
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPasswordRequest'
 *           example:
 *             token: "abc123def456ghi789"
 *             newPassword: "NewSecurePass123!"
 *     responses:
 *       200:
 *         description: Password reset successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Password reset successful"
 *                 data:
 *                   $ref: '#/components/schemas/AuthResponse'
 *                 meta:
 *                   $ref: '#/components/schemas/PerformanceMetrics'
 *       400:
 *         description: Invalid or expired token, or weak password
 *       404:
 *         description: Reset token not found
 *       500:
 *         description: Server error
 */
router.post('/reset-password', AuthController.resetPassword);

/**
 * @swagger
 * /auth/validate-reset-token/{token}:
 *   get:
 *     summary: Validate password reset token
 *     description: |
 *       Check if a password reset token is valid and not expired.
 *       **Security Features:**
 *       - Token validation
 *       - Expiration checking
 *       - Usage status verification
 *     tags: [Authentication]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Password reset token to validate
 *     responses:
 *       200:
 *         description: Token is valid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Valid token"
 *       400:
 *         description: Token is invalid or expired
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Invalid or expired token"
 *       500:
 *         description: Server error
 */
router.get('/validate-reset-token/:token', AuthController.validateResetToken);

/**
 * @swagger
 * /auth/email-otp/request:
 *   post:
 *     summary: Request email verification OTP (6 digits)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: OTP sent if email exists
 */
router.post('/email-otp/request', AuthController.requestEmailOtp);

/**
 * @swagger
 * /auth/email-otp/verify:
 *   post:
 *     summary: Verify email with OTP
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               otp:
 *                 type: string
 *                 pattern: "^[0-9]{6}$"
 *     responses:
 *       200:
 *         description: Email verified
 *       400:
 *         description: Invalid or expired OTP
 */
router.post('/email-otp/verify', AuthController.verifyEmailOtp);

export default router;
