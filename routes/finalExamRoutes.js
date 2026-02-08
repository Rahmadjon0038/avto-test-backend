const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const {
    startFinalExam,
    submitFinalExam,
    getExamHistory,
    getExamResult,
    cancelExam
} = require('../controllers/finalExamController');

/**
 * @swagger
 * tags:
 *   name: FinalExam
 *   description: Final imtihon API - 50 ta tasodifiy savol
 */

/**
 * @swagger
 * /api/final-exam/start:
 *   post:
 *     summary: Yangi final imtihon boshlash
 *     tags: [FinalExam]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Imtihon boshlandi
 *       400:
 *         description: Bazada yetarli savol yoq
 */
router.post('/start', protect, startFinalExam);

/**
 * @swagger
 * /api/final-exam/submit:
 *   post:
 *     summary: Imtihonni yakunlash va natijani olish
 *     description: Barcha savollarga javob berish shart emas. Javob berilmaganlar notogri hisoblanadi.
 *     tags: [FinalExam]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - examId
 *             properties:
 *               examId:
 *                 type: integer
 *               answers:
 *                 type: object
 *                 example: { "1": 2, "5": 0, "12": 3 }
 *     responses:
 *       200:
 *         description: Imtihon yakunlandi
 *       404:
 *         description: Faol imtihon topilmadi
 */
router.post('/submit', protect, submitFinalExam);

/**
 * @swagger
 * /api/final-exam/history:
 *   get:
 *     summary: Imtihon tarixini olish
 *     tags: [FinalExam]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Imtihon tarixi
 */
router.get('/history', protect, getExamHistory);

/**
 * @swagger
 * /api/final-exam/{examId}:
 *   get:
 *     summary: Imtihon natijasini korish
 *     tags: [FinalExam]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Imtihon natijasi
 *       404:
 *         description: Imtihon topilmadi
 */
router.get('/:examId', protect, getExamResult);

/**
 * @swagger
 * /api/final-exam/{examId}/cancel:
 *   delete:
 *     summary: Imtihonni bekor qilish
 *     tags: [FinalExam]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: examId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Imtihon bekor qilindi
 *       404:
 *         description: Faol imtihon topilmadi
 */
router.delete('/:examId/cancel', protect, cancelExam);

module.exports = router;
