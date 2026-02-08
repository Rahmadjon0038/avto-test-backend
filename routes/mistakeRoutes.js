const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const {
    submitTicketAnswers,
    getMyMistakes,
    submitMistakePractice
} = require('../controllers/mistakeController');

/**
 * @swagger
 * tags:
 *   - name: Mistakes
 *     description: Xatolar ustida ishlash API
 */

/**
 * @swagger
 * /api/mistakes/ticket/submit:
 *   post:
 *     summary: Oddiy bilet yechim natijasini tekshirish va xatolarni saqlash
 *     tags: [Mistakes]
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
 *               - answers
 *             properties:
 *               ticketId:
 *                 type: integer
 *                 example: 1
 *               answers:
 *                 type: object
 *                 description: questionId -> selectedOption ko'rinishida
 *                 additionalProperties:
 *                   type: integer
 *                 example: { "12": 2, "14": 0, "15": 1 }
 *     responses:
 *       200:
 *         description: Natija hisoblandi va xatolar saqlandi
 *       400:
 *         description: Noto'g'ri body yoki bilet savollari yo'q
 *       403:
 *         description: Obunasiz user pullik biletni ishlay olmaydi
 *       404:
 *         description: Bilet topilmadi
 */
router.post('/ticket/submit', protect, submitTicketAnswers);

/**
 * @swagger
 * /api/mistakes:
 *   get:
 *     summary: Userning xatolar bo'limidagi savollarini olish
 *     tags: [Mistakes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Xato savollar ro'yxati
 */
router.get('/', protect, getMyMistakes);

/**
 * @swagger
 * /api/mistakes/practice/submit:
 *   post:
 *     summary: Xatolar bo'limidagi testlarni qayta yechish
 *     tags: [Mistakes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - answers
 *             properties:
 *               answers:
 *                 type: object
 *                 description: Xatolar bo'limidagi questionId -> selectedOption
 *                 additionalProperties:
 *                   type: integer
 *                 example: { "12": 1, "14": 3 }
 *     responses:
 *       200:
 *         description: Qayta yechish natijasi qaytdi (to'g'ri yechilganlar xatolardan chiqadi)
 *       400:
 *         description: answers yuborilmagan yoki format noto'g'ri
 *       404:
 *         description: Berilgan savollar xatolar bo'limida topilmadi
 */
router.post('/practice/submit', protect, submitMistakePractice);

module.exports = router;
