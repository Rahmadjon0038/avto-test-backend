const express = require('express');
const router = express.Router();
const { createQuestion, getQuestionsByTicket } = require('../controllers/questionController');
const { protect } = require('../middlewares/authMiddleware');

/**
 * @swagger
 * tags:
 *   - name: Questions
 *     description: Biletlar ichidagi savollar (testlar) bilan ishlash
 */

/**
 * @swagger
 * /api/questions:
 *   post:
 *     summary: Admin ma'lum bir biletga savol qo'shishi (Faqat Admin)
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ticketId
 *               - questionText
 *               - options
 *               - correctOption
 *             properties:
 *               ticketId:
 *                 type: integer
 *                 description: Savol qaysi biletga tegishliligi (Biletning ID raqami)
 *                 example: 1
 *               questionText:
 *                 type: string
 *                 description: Savolning matni
 *                 example: "Ushbu yo'l belgisi nimani anglatadi?"
 *               image:
 *                 type: string
 *                 description: Savolga tegishli rasm URL manzili
 *                 example: "https://example.com/images/stop-sign.jpg"
 *               options:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Javob variantlari massivi
 *                 example: ["To'xtash taqiqlangan", "Asosiy yo'l", "To'xtamasdan harakatlanish taqiqlangan"]
 *               correctOption:
 *                 type: integer
 *                 description: To'g'ri javobning massivdagi indeksi (0 dan boshlanadi)
 *                 example: 2
 *               explanation:
 *                 type: string
 *                 description: User noto'g'ri javob berganda chiqadigan tushuntirish
 *                 example: "Ushbu belgi 2.5 belgisi hisoblanib, barcha haydovchilardan to'xtashni talab qiladi."
 *     responses:
 *       201:
 *         description: Savol muvaffaqiyatli yaratildi
 *       403:
 *         description: Kirish taqiqlangan (Faqat admin uchun)
 *       404:
 *         description: Bilet topilmadi
 */
router.post('/', protect, createQuestion);

/**
 * @swagger
 * /api/questions/ticket/{ticketId}:
 *   get:
 *     summary: Biletga tegishli barcha savollarni olish
 *     description: Agar bilet demo bo'lmasa, foydalanuvchida obuna bo'lishi shart.
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ticketId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Biletning ID raqami
 *     responses:
 *       200:
 *         description: Savollar ro'yxati muvaffaqiyatli qaytarildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ticket_name:
 *                   type: string
 *                 total_questions:
 *                   type: integer
 *                 questions:
 *                   type: array
 *                   items:
 *                     type: object
 *       403:
 *         description: Ushbu bilet pullik. Savollarni ko'rish uchun obuna bo'ling!
 *       404:
 *         description: Bilet topilmadi
 */
router.get('/ticket/:ticketId', protect, getQuestionsByTicket);

module.exports = router;
