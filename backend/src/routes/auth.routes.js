const express = require('express');
const router = express.Router();

const {
    login,
    obtenerUsuarios,
    registrarUsuario
} = require('../controllers/auth.controller');

router.post('/login', login);
router.get('/usuarios', obtenerUsuarios);
router.post('/register', registrarUsuario);

module.exports = router;