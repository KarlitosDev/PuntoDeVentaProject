const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { connectDB } = require('./db/connection');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get('/', (req, res) => {
    res.json({ message: 'PuntoDeVenta API corriendo correctamente' });
});

// Start server
const start = async () => {
    await connectDB();
    app.listen(PORT, () => {
        console.log(`Servidor corriendo en puerto ${PORT}`);
    });
};

start();