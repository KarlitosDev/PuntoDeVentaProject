const express = require('express');
const router = express.Router();

const billeterasController = require('../controllers/billeteras.controller');

router.get('/', billeterasController.obtenerBilleteras);
router.get('/movimientos', billeterasController.obtenerMovimientos);
router.get('/usuario/:idUsuario/movimientos', billeterasController.obtenerMovimientosPorUsuario);
router.get('/usuario/:idUsuario', billeterasController.obtenerBilleteraPorUsuario);
router.post('/recargar', billeterasController.recargarBilletera);

module.exports = router;