const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const { User } = require('./User');

const FinalExam = sequelize.define('FinalExam', {
    id: { 
        type: DataTypes.INTEGER, 
        autoIncrement: true, 
        primaryKey: true 
    },
    userId: { 
        type: DataTypes.INTEGER, 
        allowNull: false,
        references: { model: User, key: 'id' }
    },
    // 50 ta tasodifiy tanlangan savollar ID lari
    questionIds: { 
        type: DataTypes.JSONB, // [1, 5, 12, 23, ...]
        allowNull: false 
    },
    // Foydalanuvchi javoblari: { questionId: selectedOption }
    answers: { 
        type: DataTypes.JSONB, // { "1": 2, "5": 0, "12": 3, ... }
        defaultValue: {} 
    },
    // To'g'ri javoblar soni
    correctCount: { 
        type: DataTypes.INTEGER, 
        defaultValue: 0 
    },
    // Noto'g'ri javoblar soni
    wrongCount: { 
        type: DataTypes.INTEGER, 
        defaultValue: 0 
    },
    // Umumiy savollar soni (50)
    totalQuestions: { 
        type: DataTypes.INTEGER, 
        defaultValue: 50 
    },
    // Imtihon holati: pending (davom etmoqda), completed (yakunlangan)
    status: { 
        type: DataTypes.ENUM('pending', 'completed'), 
        defaultValue: 'pending' 
    },
    // O'tdi yoki yo'q (86% dan yuqori bo'lsa o'tadi - 43/50)
    passed: { 
        type: DataTypes.BOOLEAN, 
        defaultValue: false 
    },
    // Imtihon boshlanish vaqti
    startedAt: { 
        type: DataTypes.DATE, 
        defaultValue: DataTypes.NOW 
    },
    // Imtihon tugash vaqti (1 soat)
    expiresAt: { 
        type: DataTypes.DATE, 
        allowNull: false 
    },
    // Imtihon tugash vaqti
    completedAt: { 
        type: DataTypes.DATE, 
        allowNull: true 
    },
    // Qolgan vaqt (sekundlarda) - har safar yangilanadi
    timeSpent: { 
        type: DataTypes.INTEGER, 
        defaultValue: 0 
    }
}, {
    timestamps: true
});

// Bog'liqliklar
User.hasMany(FinalExam, { foreignKey: 'userId', as: 'finalExams', onDelete: 'CASCADE' });
FinalExam.belongsTo(User, { foreignKey: 'userId', as: 'user' });

const initFinalExamTable = async () => {
    try {
        await FinalExam.sync({ alter: true });
        console.log('✅ FinalExam jadvali ishchi holatda tayyor.');
    } catch (error) {
        console.error('❌ FinalExam modelida xato:', error);
    }
};

module.exports = { FinalExam, initFinalExamTable };
