const express = require('express');
const router = express.Router();
const { 
    createQuestion, 
    getQuestionsByTicket, 
    deleteQuestion, 
    updateQuestion,
    importQuestionsFromJson,
    importQuestionsFromFile 
} = require('../controllers/questionController');
const { protect } = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');

// Multer config (simple, stores in uploads/)
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, 'uploads/');
	},
	filename: function (req, file, cb) {
		cb(null, Date.now() + '-' + file.originalname);
	}
});
const upload = multer({ storage });

// JSON fayl uchun alohida multer config
const jsonStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, 'import-' + Date.now() + '.json');
    }
});
const jsonUpload = multer({ 
    storage: jsonStorage,
    fileFilter: function (req, file, cb) {
        if (file.mimetype === 'application/json' || path.extname(file.originalname).toLowerCase() === '.json') {
            cb(null, true);
        } else {
            cb(new Error('Faqat JSON fayl yuklash mumkin'), false);
        }
    }
});

/**
 * @swagger
 * /api/questions/{id}:
 *   put:
 *     summary: Savolni yangilash (Admin)
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Savol ID raqami
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               questionText:
 *                 type: string
 *               options:
 *                 type: string
 *                 description: JSON array string, e.g. '["A","B"]'
 *               correctOption:
 *                 type: integer
 *               explanation:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Savol yangilandi
 *       404:
 *         description: Savol topilmadi
 */
router.put('/:id', protect, upload.single('image'), updateQuestion);
/**
 * @swagger
 * /api/questions/{id}:
 *   delete:
 *     summary: Savolni o'chirish (Admin)
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Savol ID raqami
 *     responses:
 *       200:
 *         description: Savol o'chirildi
 *       404:
 *         description: Savol topilmadi
 */
router.delete('/:id', protect, deleteQuestion);



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
 *         multipart/form-data:
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
 *                 example: Ushbu yo'l belgisi nimani anglatadi?
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Savolga tegishli rasm fayli
 *               options:
 *                 type: string
 *                 description: Javob variantlari massivi (JSON string sifatida yuboriladi)
 *                 example: "[\"To'xtash taqiqlangan\", \"Asosiy yo'l\", \"To'xtamasdan harakatlanish taqiqlangan\"]"
 *               correctOption:
 *                 type: integer
 *                 description: To'g'ri javobning massivdagi indeksi (0 dan boshlanadi)
 *                 example: 2
 *               explanation:
 *                 type: string
 *                 description: User noto'g'ri javob berganda chiqadigan tushuntirish
 *                 example: Ushbu belgi 2.5 belgisi hisoblanib, barcha haydovchilardan to'xtashni talab qiladi.
 *     responses:
 *       201:
 *         description: Savol muvaffaqiyatli yaratildi
 *       403:
 *         description: Kirish taqiqlangan (Faqat admin uchun)
 *       404:
 *         description: Bilet topilmadi
 */
router.post('/', protect, upload.single('image'), createQuestion);

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

/**
 * @swagger
 * /api/questions/import:
 *   post:
 *     summary: JSON orqali ko'plab savollarni import qilish (Admin)
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
 *               - questions
 *             properties:
 *               ticketId:
 *                 type: integer
 *                 description: Savollar qaysi biletga tegishli
 *                 example: 1
 *               questions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - questionText
 *                     - options
 *                     - correctOption
 *                   properties:
 *                     questionText:
 *                       type: string
 *                       example: "Yo'l belgisi nimani anglatadi?"
 *                     options:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["To'xtash", "Davom etish", "Sekinlash", "Chapga burulish"]
 *                     correctOption:
 *                       type: integer
 *                       example: 0
 *                     explanation:
 *                       type: string
 *                       example: "Bu belgi to'xtashni anglatadi"
 *                     image:
 *                       type: string
 *                       example: "/uploads/belgi1.png"
 *     responses:
 *       201:
 *         description: Savollar muvaffaqiyatli import qilindi
 *       400:
 *         description: Noto'g'ri ma'lumotlar
 *       404:
 *         description: Bilet topilmadi
 */
router.post('/import', protect, importQuestionsFromJson);

/**
 * @swagger
 * /api/questions/import-file:
 *   post:
 *     summary: JSON fayl yuklash orqali savollarni import qilish (Admin)
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: "JSON fayl. Format: { ticketId: 1, questions: [...] }"
 *     responses:
 *       201:
 *         description: Savollar muvaffaqiyatli import qilindi
 *       400:
 *         description: Noto'g'ri JSON format yoki fayl yuklanmadi
 *       404:
 *         description: Bilet topilmadi
 */
router.post('/import-file', protect, jsonUpload.single('file'), importQuestionsFromFile);

module.exports = router;
