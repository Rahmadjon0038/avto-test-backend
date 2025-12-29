const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Ticket = sequelize.define('Ticket', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    ticket_number: { type: DataTypes.INTEGER, unique: true, allowNull: false },
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true }, // Yangi maydon
    is_demo: { type: DataTypes.BOOLEAN, defaultValue: false }
});

const initTicketTable = async () => {
    try {
        await Ticket.sync({ alter: true });
        console.log('✅ Ticket modeli muvaffaqiyatli tayyorlandi.');
    } catch (error) {
        console.error('❌ Ticket modelida xato:', error);
    }
};

module.exports = { Ticket, initTicketTable };