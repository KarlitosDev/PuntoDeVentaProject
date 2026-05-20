const sql = require('mssql');
require('dotenv').config();

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT, 10),
    options: {
        trustServerCertificate: true,
        encrypt: false
    }
};

let pool;

const connectDB = async () => {
    try {
        pool = await sql.connect(config);
        console.log('Conectado a SQL Server correctamente');
        return pool;
    } catch (err) {
        console.error('Error conectando a SQL Server:', err.message);
        process.exit(1);
    }
};

const getPool = () => {
    if (!pool) {
        throw new Error('La base de datos no está conectada todavía');
    }
    return pool;
};

module.exports = { connectDB, getPool, sql };