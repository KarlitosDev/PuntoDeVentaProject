const express = require('express');
const router = express.Router();

const {
    obtenerVentas,
    obtenerVentaPorId,
    crearVenta
} = require('../controllers/ventas.controller');

router.get('/', obtenerVentas);
router.get('/:id', obtenerVentaPorId);
router.post('/', crearVenta);

module.exports = router;