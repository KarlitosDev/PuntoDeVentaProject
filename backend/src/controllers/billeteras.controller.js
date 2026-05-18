const { getPool, sql } = require('../db/connection');

const obtenerBilleteras = async (req, res) => {
    try {
        const pool = getPool();

        const result = await pool.request().query(`
            SELECT 
                b.IdBilletera,
                b.IdUsuario,
                u.Username,
                u.Role,
                b.Saldo,
                b.Creado
            FROM dbo.Billeteras b
            INNER JOIN dbo.Usuarios u ON b.IdUsuario = u.IdUsuario
            WHERE u.Role = 'Cliente'
            ORDER BY u.Username
        `);

        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({
            message: 'Error obteniendo billeteras',
            error: err.message
        });
    }
};

const obtenerMovimientos = async (req, res) => {
    try {
        const pool = getPool();

        const result = await pool.request().query(`
            SELECT 
                mb.IdMovimiento,
                mb.IdBilletera,
                b.IdUsuario,
                u.Username,
                mb.TipoMovimiento,
                mb.Monto,
                mb.SaldoAnterior,
                mb.SaldoNuevo,
                mb.IdVenta,
                v.FolioRecibo,
                mb.CambiadoPor,
                mb.FechaMovimiento,
                mb.Description
            FROM dbo.Movimientos_Billetera mb
            INNER JOIN dbo.Billeteras b ON mb.IdBilletera = b.IdBilletera
            INNER JOIN dbo.Usuarios u ON b.IdUsuario = u.IdUsuario
            LEFT JOIN dbo.Ventas v ON mb.IdVenta = v.IdVenta
            ORDER BY mb.IdMovimiento DESC
        `);

        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({
            message: 'Error obteniendo movimientos de billetera',
            error: err.message
        });
    }
};

const obtenerBilleteraPorUsuario = async (req, res) => {
    try {
        const { idUsuario } = req.params;
        const pool = getPool();

        const result = await pool.request()
            .input('IdUsuario', sql.Int, idUsuario)
            .query(`
                SELECT 
                    b.IdBilletera,
                    b.IdUsuario,
                    u.Username,
                    u.Role,
                    b.Saldo,
                    b.Creado
                FROM dbo.Billeteras b
                INNER JOIN dbo.Usuarios u ON b.IdUsuario = u.IdUsuario
                WHERE b.IdUsuario = @IdUsuario
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                message: 'Billetera no encontrada para este usuario'
            });
        }

        res.json(result.recordset[0]);
    } catch (err) {
        res.status(500).json({
            message: 'Error obteniendo billetera del usuario',
            error: err.message
        });
    }
};

const recargarBilletera = async (req, res) => {
    const pool = getPool();
    const transaction = new sql.Transaction(pool);

    try {
        const { IdUsuario, Monto } = req.body;

        if (!IdUsuario || Monto == null) {
            return res.status(400).json({
                message: 'IdUsuario y Monto son obligatorios'
            });
        }

        if (Number(Monto) <= 0) {
            return res.status(400).json({
                message: 'El monto debe ser mayor a 0'
            });
        }

        const usuarioResult = await pool.request()
            .input('IdUsuario', sql.Int, IdUsuario)
            .query(`
                SELECT IdUsuario, Username, Role
                FROM dbo.Usuarios
                WHERE IdUsuario = @IdUsuario
            `);

        if (usuarioResult.recordset.length === 0) {
            return res.status(404).json({
                message: 'Usuario no encontrado'
            });
        }

        const usuario = usuarioResult.recordset[0];

        if (usuario.Role !== 'Cliente') {
            return res.status(400).json({
                message: 'Solo los usuarios Cliente pueden tener billetera'
            });
        }

        await transaction.begin();

        const billeteraRequest = new sql.Request(transaction);

        let billeteraResult = await billeteraRequest
            .input('IdUsuario', sql.Int, IdUsuario)
            .query(`
                SELECT IdBilletera, IdUsuario, Saldo
                FROM dbo.Billeteras
                WHERE IdUsuario = @IdUsuario
            `);

        if (billeteraResult.recordset.length === 0) {
            const crearBilleteraRequest = new sql.Request(transaction);

            await crearBilleteraRequest
                .input('IdUsuario', sql.Int, IdUsuario)
                .query(`
                    INSERT INTO dbo.Billeteras (IdUsuario, Saldo)
                    VALUES (@IdUsuario, 0);
                `);

            const nuevaBilleteraRequest = new sql.Request(transaction);

            billeteraResult = await nuevaBilleteraRequest
                .input('IdUsuario', sql.Int, IdUsuario)
                .query(`
                    SELECT IdBilletera, IdUsuario, Saldo
                    FROM dbo.Billeteras
                    WHERE IdUsuario = @IdUsuario
                `);
        }

        const billetera = billeteraResult.recordset[0];
        const saldoAnterior = Number(billetera.Saldo);
        const saldoNuevo = saldoAnterior + Number(Monto);

        const actualizarRequest = new sql.Request(transaction);

        await actualizarRequest
            .input('IdBilletera', sql.Int, billetera.IdBilletera)
            .input('SaldoNuevo', sql.Decimal(10, 2), saldoNuevo)
            .query(`
                UPDATE dbo.Billeteras
                SET Saldo = @SaldoNuevo
                WHERE IdBilletera = @IdBilletera
            `);

        const movimientoRequest = new sql.Request(transaction);

        await movimientoRequest
            .input('IdBilletera', sql.Int, billetera.IdBilletera)
            .input('Monto', sql.Decimal(10, 2), Monto)
            .input('SaldoAnterior', sql.Decimal(10, 2), saldoAnterior)
            .input('SaldoNuevo', sql.Decimal(10, 2), saldoNuevo)
            .input('CambiadoPor', sql.VarChar(100), 'Admin/API')
            .input('Description', sql.VarChar(255), `Recarga realizada a usuario: ${usuario.Username}`)
            .query(`
                INSERT INTO dbo.Movimientos_Billetera (
                    IdBilletera,
                    TipoMovimiento,
                    Monto,
                    SaldoAnterior,
                    SaldoNuevo,
                    CambiadoPor,
                    Description
                )
                VALUES (
                    @IdBilletera,
                    'RECARGA',
                    @Monto,
                    @SaldoAnterior,
                    @SaldoNuevo,
                    @CambiadoPor,
                    @Description
                );
            `);

        await transaction.commit();

        res.json({
            message: 'Billetera recargada correctamente',
            billetera: {
                IdBilletera: billetera.IdBilletera,
                IdUsuario: usuario.IdUsuario,
                Username: usuario.Username,
                SaldoAnterior: saldoAnterior,
                MontoRecargado: Number(Monto),
                SaldoNuevo: saldoNuevo
            }
        });
    } catch (err) {
        try {
            await transaction.rollback();
        } catch (rollbackError) {
            console.error('Error haciendo rollback:', rollbackError.message);
        }

        res.status(500).json({
            message: 'Error recargando billetera',
            error: err.message
        });
    }
};

const obtenerMovimientosPorUsuario = async (req, res) => {
    try {
        const { idUsuario } = req.params;
        const pool = getPool();

        const result = await pool.request()
            .input('IdUsuario', sql.Int, idUsuario)
            .query(`
                SELECT 
                    mb.IdMovimiento,
                    mb.IdBilletera,
                    b.IdUsuario,
                    u.Username,
                    mb.TipoMovimiento,
                    mb.Monto,
                    mb.SaldoAnterior,
                    mb.SaldoNuevo,
                    mb.IdVenta,
                    v.FolioRecibo,
                    mb.CambiadoPor,
                    mb.FechaMovimiento,
                    mb.Description
                FROM dbo.Movimientos_Billetera mb
                INNER JOIN dbo.Billeteras b ON mb.IdBilletera = b.IdBilletera
                INNER JOIN dbo.Usuarios u ON b.IdUsuario = u.IdUsuario
                LEFT JOIN dbo.Ventas v ON mb.IdVenta = v.IdVenta
                WHERE b.IdUsuario = @IdUsuario
                ORDER BY mb.FechaMovimiento DESC
            `);

        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({
            message: 'Error obteniendo movimientos de billetera del usuario',
            error: err.message
        });
    }
};

module.exports = {
    obtenerBilleteras,
    obtenerMovimientos,
    obtenerBilleteraPorUsuario,
    recargarBilletera,
    obtenerMovimientosPorUsuario
};