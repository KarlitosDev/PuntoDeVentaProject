const { getPool, sql } = require('../db/connection');

const login = async (req, res) => {
    try {
        const { Username, Password } = req.body;

        if (!Username || !Password) {
            return res.status(400).json({
                message: 'Username y Password son obligatorios'
            });
        }

        const pool = getPool();

        const result = await pool.request()
            .input('Username', sql.VarChar(50), Username)
            .input('Password', sql.VarChar(255), Password)
            .query(`
                SELECT IdUsuario, Username, Role
                FROM dbo.Usuarios
                WHERE Username = @Username
                AND Password = @Password
            `);

        if (result.recordset.length === 0) {
            return res.status(401).json({
                message: 'Usuario o contraseña incorrectos'
            });
        }

        res.json({
            message: 'Login correcto',
            usuario: result.recordset[0]
        });
    } catch (err) {
        res.status(500).json({
            message: 'Error iniciando sesión',
            error: err.message
        });
    }
};

const obtenerUsuarios = async (req, res) => {
    try {
        const pool = getPool();

        const result = await pool.request().query(`
            SELECT IdUsuario, Username, Role, Creado
            FROM dbo.Usuarios
            ORDER BY IdUsuario DESC
        `);

        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({
            message: 'Error obteniendo usuarios',
            error: err.message
        });
    }
};

const registrarUsuario = async (req, res) => {
    try {
        const { Username, Password, Role } = req.body;

        if (!Username || !Password || !Role) {
            return res.status(400).json({
                message: 'Username, Password y Role son obligatorios'
            });
        }

        if (Role !== 'Admin' && Role !== 'Cliente') {
            return res.status(400).json({
                message: "Role debe ser 'Admin' o 'Cliente'"
            });
        }

        const pool = getPool();

        const existe = await pool.request()
            .input('Username', sql.VarChar(50), Username)
            .query(`
                SELECT IdUsuario
                FROM dbo.Usuarios
                WHERE Username = @Username
            `);

        if (existe.recordset.length > 0) {
            return res.status(409).json({
                message: 'El username ya existe'
            });
        }

        const result = await pool.request()
            .input('Username', sql.VarChar(50), Username)
            .input('Password', sql.VarChar(255), Password)
            .input('Role', sql.VarChar(10), Role)
            .query(`
                INSERT INTO dbo.Usuarios (Username, Password, Role)
                VALUES (@Username, @Password, @Role);

                SELECT IdUsuario, Username, Role, Creado
                FROM dbo.Usuarios
                WHERE IdUsuario = SCOPE_IDENTITY();
            `);

        res.status(201).json({
            message: 'Usuario registrado correctamente',
            usuario: result.recordset[0]
        });
    } catch (err) {
        res.status(500).json({
            message: 'Error registrando usuario',
            error: err.message
        });
    }
};

module.exports = {
    login,
    obtenerUsuarios,
    registrarUsuario
};