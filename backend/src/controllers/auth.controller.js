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
    const { Username, Password, Role } = req.body;

    if (!Username || !Password || !Role) {
        return res.status(400).json({
            message: 'Username, Password y Role son obligatorios'
        });
    }

    if (Role !== 'Admin' && Role !== 'Cliente') {
        return res.status(400).json({
            message: 'Role debe ser Admin o Cliente'
        });
    }

    const pool = getPool();
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        const existeRequest = new sql.Request(transaction);

        const existeResult = await existeRequest
            .input('Username', sql.NVarChar(50), Username)
            .query(`
                SELECT IdUsuario
                FROM dbo.Usuarios
                WHERE Username = @Username
            `);

        if (existeResult.recordset.length > 0) {
            await transaction.rollback();

            return res.status(409).json({
                message: 'El nombre de usuario ya existe'
            });
        }

        const usuarioRequest = new sql.Request(transaction);

        await usuarioRequest
            .input('Username', sql.NVarChar(50), Username)
            .input('Password', sql.NVarChar(100), Password)
            .input('Role', sql.NVarChar(20), Role)
            .query(`
                INSERT INTO dbo.Usuarios (Username, Password, Role)
                VALUES (@Username, @Password, @Role)
            `);

        const usuarioCreadoRequest = new sql.Request(transaction);

        const usuarioCreadoResult = await usuarioCreadoRequest
            .input('Username', sql.NVarChar(50), Username)
            .query(`
                SELECT IdUsuario, Username, Role, Creado
                FROM dbo.Usuarios
                WHERE Username = @Username
            `);

        const usuarioCreado = usuarioCreadoResult.recordset[0];

        if (Role === 'Cliente') {
            const billeteraRequest = new sql.Request(transaction);

            await billeteraRequest
                .input('IdUsuario', sql.Int, usuarioCreado.IdUsuario)
                .input('Saldo', sql.Decimal(10, 2), 0)
                .query(`
                    INSERT INTO dbo.Billeteras (IdUsuario, Saldo)
                    VALUES (@IdUsuario, @Saldo)
                `);
        }

        await transaction.commit();

        res.status(201).json({
            message:
                Role === 'Cliente'
                    ? 'Usuario cliente registrado correctamente con billetera creada'
                    : 'Usuario administrador registrado correctamente',
            usuario: usuarioCreado
        });
    } catch (err) {
        try {
            await transaction.rollback();
        } catch (rollbackErr) {
            console.error('Error haciendo rollback:', rollbackErr.message);
        }

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