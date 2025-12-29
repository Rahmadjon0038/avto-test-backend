const express = require('express');
const router = express.Router();
const { 
    getAllTickets, 
    createTicket, 
    updateTicket, 
    deleteTicket 
} = require('../controllers/ticketController');
const { protect } = require('../middlewares/authMiddleware');
const { authorizeAdmin } = require('../middlewares/roleMiddleware');

/**
 * @swagger
 * tags:
 *   - name: Tickets
 *     description: Imtihon biletlarini boshqarish (Admin va Userlar uchun)
 */

/**
 * @swagger
 * /api/tickets:
 *   get:
 *     summary: Barcha biletlarni ro'yxatini olish
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Biletlar muvaffaqiyatli olindi
 */
router.get('/', protect, getAllTickets);

/**
 * @swagger
 * /api/tickets:
 *   post:
 *     summary: Yangi bilet yaratish (Faqat Admin)
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ticket_number
 *               - name
 *             properties:
 *               ticket_number:
 *                 type: integer
 *                 example: 1
 *                 description: Biletning tartib raqami
 *               name:
 *                 type: string
 *                 example: "1-bilet"
 *                 description: Bilet nomi
 *               description:
 *                 type: string
 *                 example: "Ushbu biletda chorrahalardan o'tish qoidalari haqida savollar mavjud."
 *                 description: Bilet haqida qisqacha ma'lumot
 *               is_demo:
 *                 type: boolean
 *                 example: false
 *                 description: Bilet bepul yoki pullik ekanligi (true bo'lsa hamma ko'radi)
 *     responses:
 *       201:
 *         description: Bilet yaratildi
 *       403:
 *         description: Sizda bunday huquq yo'q (Admin emassiz)
 */
router.post('/', protect,  createTicket);

/**
 * @swagger
 * /api/tickets/{id}:
 *   put:
 *     summary: Biletni tahrirlash (Faqat Admin)
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Biletning bazadagi ID raqami
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ticket_number:
 *                 type: integer
 *                 example: 1
 *               name:
 *                 type: string
 *                 example: "Yangilangan 1-bilet"
 *               description:
 *                 type: string
 *                 example: "Yangi tavsif matni"
 *               is_demo:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Bilet muvaffaqiyatli yangilandi
 *       404:
 *         description: Bilet topilmadi
 */
router.put('/:id', protect,  updateTicket);

/**
 * @swagger
 * /api/tickets/{id}:
 *   delete:
 *     summary: Biletni o'chirish (Faqat Admin)
 *     tags: [Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Biletning bazadagi ID raqami
 *     responses:
 *       200:
 *         description: Bilet o'chirib tashlandi
 *       404:
 *         description: Bilet topilmadi
 */
router.delete('/:id', protect,  deleteTicket);

module.exports = router;
