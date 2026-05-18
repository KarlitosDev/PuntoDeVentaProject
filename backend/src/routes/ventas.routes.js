const express = require('express');
const router = express.Router();
const ventasController = require('../controllers/ventas.controller');

router.get('/', ventasController.obtenerVentas);
router.get('/usuario/:idUsuario', ventasController.obtenerVentasPorUsuario);
router.get('/:id', ventasController.obtenerVentaPorId);
router.post('/', ventasController.crearVenta);

module.exports = router;