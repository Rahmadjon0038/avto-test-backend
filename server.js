const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');


require('dotenv').config();

const { connectDB, sequelize } = require('./config/db');
const swaggerSpec = require('./config/swagger');
const { initUserTable } = require('./models/User');
const authRoutes = require('./routes/authRoutes');
const { initTicketTable } = require('./models/Ticket');
const ticketRoutes = require('./routes/ticketRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const questionRoutes = require('./routes/questionRoutes');
const { initQuestionTable } = require('./models/Question');


const path = require('path');
const app = express();

// --------------------- MIDDLEWARES ---------------------
app.use(cors());
app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan('dev'));
app.use(express.json());

// uploads papkasini public qilish
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// --------------------- SWAGGER ROUTE ---------------------
// Swagger UI: http://localhost:5000/api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// --------------------- API ROUTES ---------------------
app.use('/api/auth', authRoutes);

// ... tiket
app.use('/api/tickets', ticketRoutes);
// -------  ubuna -----
app.use('/api/subscription', subscriptionRoutes);

// startServer ichida
// --------- bilet ichiga queston qoshish -------
app.use('/api/questions', questionRoutes);




// --------------------- ROOT ROUTE ---------------------
app.get('/', (req, res) => {
    res.send('🚗 Avto Imtihon API ishlamoqda...');
});

// --------------------- SERVER START ---------------------
const startServer = async () => {
    try {
        // 1️⃣ Bazaga ulanish
        await connectDB();

        // 2️⃣ User jadvalini yaratish (eskilar saqlanadi)
        await initUserTable();

        // 3- tiked tableni yasash
        await initTicketTable();

        // 4 ticket ichidaga queston yasash
        await initQuestionTable();

        // 3️⃣ Boshqa jadvallarni sinxronizatsiya qilish
        // force: false → jadval mavjud bo‘lsa saqlanadi, yangi ustun qo‘shadi
        await sequelize.sync({ force: false });
        console.log('✅ Ma\'lumotlar bazasi jadvallari tayyor.');


        // 4️⃣ Serverni ishga tushurish
        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => {
            console.log(`🚀 Server http://localhost:${PORT} ishga tushdi`);
            console.log(`📖 Swagger UI: http://localhost:${PORT}/api-docs`);
        });
    } catch (error) {
        console.error('❌ Serverni ishga tushirishda xato:', error);
    }
};

startServer();
