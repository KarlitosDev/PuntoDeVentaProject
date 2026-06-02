const express = require('express');
const router = express.Router();

const {
    obtenerAuditoriaProductos,
    obtenerAuditoriaVentas,
    obtenerAuditoriaUsuarios
} = require('../controllers/auditoria.controller');

router.get('/productos', obtenerAuditoriaProductos);
router.get('/ventas', obtenerAuditoriaVentas);
router.get('/usuarios', obtenerAuditoriaUsuarios);

module.exports = router;