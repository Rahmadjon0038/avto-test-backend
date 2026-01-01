const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const { Ticket } = require('./Ticket');

const Question = sequelize.define('Question', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    ticketId: { 
        type: DataTypes.INTEGER, 
        allowNull: false,
        references: { model: Ticket, key: 'id' }
    },
    questionText: { type: DataTypes.TEXT, allowNull: false },
    image: { type: DataTypes.STRING, allowNull: true },
    options: { 
        type: DataTypes.JSONB, // ["Variant 0", "Variant 1", "Variant 2", "Variant 3"]
        allowNull: false 
    },
    correctOption: { 
        type: DataTypes.INTEGER, // 0, 1, 2 yoki 3
        allowNull: false 
    },
    explanation: { type: DataTypes.TEXT, allowNull: true }
});

// Bog'liqliklar
Ticket.hasMany(Question, { foreignKey: 'ticketId', as: 'questions', onDelete: 'CASCADE' });
Question.belongsTo(Ticket, { foreignKey: 'ticketId', as: 'ticket' });

const initQuestionTable = async () => {
    try {
        // force: true olib tashlandi, endi faqat o'zgarishlarni tekshiradi
        await Question.sync({ alter: true });
        console.log('✅ Question jadvali ishchi holatda tayyor.');
    } catch (error) {
        console.error('❌ Question modelida xato:', error);
    }
};

module.exports = { Question, initQuestionTable };