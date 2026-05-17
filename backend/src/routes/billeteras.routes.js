const express = require('express');
const router = express.Router();

const {
    obtenerBilleteras,
    obtenerMovimientos,
    obtenerBilleteraPorUsuario,
    recargarBilletera
} = require('../controllers/billeteras.controller');

router.get('/', obtenerBilleteras);
router.get('/movimientos', obtenerMovimientos);
router.get('/usuario/:idUsuario', obtenerBilleteraPorUsuario);
router.post('/recargar', recargarBilletera);

module.exports = router;