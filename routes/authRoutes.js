const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  refreshToken
} = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

/**
 * @swagger
 * tags:
 *   - name: Auth
 *     description: Foydalanuvchi autentifikatsiyasi va profil boshqaruvi
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Yangi foydalanuvchini ro'yxatdan o'tkazish
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - phone
 *               - password
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: Ali
 *               lastName:
 *                 type: string
 *                 example: Valiyev
 *               phone:
 *                 type: string
 *                 example: "998901234567"
 *               password:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       201:
 *         description: Muvaffaqiyatli ro'yxatdan o'tdi
 *       400:
 *         description: Telefon raqami band yoki ma'lumotlar xato
 */
router.post('/register', register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Tizimga kirish va tokenlarni olish
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - password
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "998901234567"
 *               password:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: Muvaffaqiyatli kirish
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 role:
 *                   type: string
 *                   example: user
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *       401:
 *         description: Telefon yoki parol xato
 */
router.post('/login', login);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh token orqali yangi Access Token olish
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: Foydalanuvchining refreshTokeni
 *     responses:
 *       200:
 *         description: Yangi accessToken taqdim etildi
 *       403:
 *         description: Token yaroqsiz yoki muddati o'tgan
 */
router.post('/refresh', refreshToken);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Joriy foydalanuvchi profil ma'lumotlarini olish
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Foydalanuvchi ma'lumotlari
 *       401:
 *         description: Avtorizatsiyadan o'tilmagan
 */
router.get('/me', protect, getMe);

module.exports = router;
