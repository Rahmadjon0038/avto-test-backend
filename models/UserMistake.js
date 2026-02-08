const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const { User } = require('./User');
const { Question } = require('./Question');

const UserMistake = sequelize.define('UserMistake', {
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
    questionId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: Question, key: 'id' }
    },
    ticketId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    wrongCount: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    },
    lastWrongAnswer: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    lastWrongAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    indexes: [
        {
            unique: true,
            fields: ['userId', 'questionId']
        }
    ]
});

User.hasMany(UserMistake, { foreignKey: 'userId', as: 'mistakes', onDelete: 'CASCADE' });
UserMistake.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Question.hasMany(UserMistake, { foreignKey: 'questionId', as: 'userMistakes', onDelete: 'CASCADE' });
UserMistake.belongsTo(Question, { foreignKey: 'questionId', as: 'question' });

const initUserMistakeTable = async () => {
    try {
        await UserMistake.sync({ alter: true });
        console.log('✅ UserMistake jadvali ishchi holatda tayyor.');
    } catch (error) {
        console.error('❌ UserMistake modelida xato:', error);
    }
};

module.exports = { UserMistake, initUserMistakeTable };
