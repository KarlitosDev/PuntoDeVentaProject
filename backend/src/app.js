const express = require('express');
const cors = require('cors');

const { getPool } = require('./db/connection');
const authRoutes = require('./routes/auth.routes');
const productosRoutes = require('./routes/productos.routes');
const ventasRoutes = require('./routes/ventas.routes');
const auditoriaRoutes = require('./routes/auditoria.routes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/ventas', ventasRoutes);
app.use('/api/auditoria', auditoriaRoutes);

// Test route
// app.get('/', (req, res) => {
//     res.json({ message: 'PuntoDeVenta API corriendo correctamente' });
// });

// // Test database route
// app.get('/api/test-db', async (req, res) => {
//     try {
//         const pool = getPool();

//         const result = await pool.request().query(`
//             SELECT 
//                 DB_NAME() AS BaseDeDatosActual,
//                 SYSTEM_USER AS UsuarioSQL
//         `);

//         res.json(result.recordset[0]);
//     } catch (err) {
//         res.status(500).json({
//             message: 'Error probando la base de datos',
//             error: err.message
//         });
//     }
// });

module.exports = app;