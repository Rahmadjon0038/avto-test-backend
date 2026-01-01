const express = require('express');
const router = express.Router();
const { activateSubscription } = require('../controllers/subscriptionController');
const { protect } = require('../middlewares/authMiddleware');

/**
 * @swagger
 * tags:
 *   - name: Subscription
 *     description: To'lovlar va obunalarni boshqarish
 */

/**
 * @swagger
 * /api/subscription/activate:
 *   post:
 *     summary: Obunani summa orqali faollashtirish (Simulyatsiya)
 *     description: Foydalanuvchi tanlagan to'lov usuli va summasini yuboradi. Hozircha 50,000 so'mdan yuqori summa uchun 30 kunlik obuna beriladi.
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - paymentMethod
 *             properties:
 *               amount:
 *                 type: integer
 *                 example: 50000
 *                 description: To'lov summasi (Minimal 50000)
 *               paymentMethod:
 *                 type: string
 *                 enum: [Click, Payme]
 *                 example: Click
 *                 description: To'lov tizimi nomi
 *     responses:
 *       200:
 *         description: Obuna muvaffaqiyatli faollashtirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 subscriptionEnd:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Summa yetarli emas yoki noto'g'ri ma'lumot
 *       401:
 *         description: Token xato yoki mavjud emas
 */
router.post('/activate', protect, activateSubscription);

module.exports = router;
