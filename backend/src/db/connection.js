const sql = require('mssql');
require('dotenv').config();

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT),
    options: {
        trustServerCertificate: true,
        encrypt: false
    }
};

const connectDB = async () => {
    try {
        await sql.connect(config);
        console.log('Conectado a SQL Server correctamente');
    } catch (err) {
        console.error('Error conectando a SQL Server:', err.message);
        process.exit(1);
    }
};

module.exports = { connectDB, sql };