const { getPool } = require('../db/connection');

const obtenerAuditoriaProductos = async (req, res) => {
    try {
        const pool = getPool();

        const result = await pool.request().query(`
            SELECT 
                IdAuditoria,
                Operacion,
                IdProducto,
                NombreProducto,
                PrecioViejo,
                PrecioNuevo,
                StockViejo,
                StockNuevo,
                CambiadoPor,
                Cambiado,
                Description
            FROM dbo.Auditoria_Productos
            ORDER BY IdAuditoria DESC
        `);

        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({
            message: 'Error obteniendo auditoría de productos',
            error: err.message
        });
    }
};

const obtenerAuditoriaVentas = async (req, res) => {
    try {
        const pool = getPool();

        const result = await pool.request().query(`
            SELECT 
                IdAuditoria,
                Operacion,
                IdVenta,
                IdUsuario,
                TotalVenta,
                CambiadoPor,
                Cambiado,
                Description
            FROM dbo.Auditoria_Ventas
            ORDER BY IdAuditoria DESC
        `);

        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({
            message: 'Error obteniendo auditoría de ventas',
            error: err.message
        });
    }
};

const obtenerAuditoriaUsuarios = async (req, res) => {
    try {
        const pool = getPool();

        const result = await pool.request().query(`
            SELECT 
                IdAuditoria,
                Operacion,
                IdUsuario,
                UsernameViejo,
                UsernameNuevo,
                RoleViejo,
                RoleNuevo,
                PasswordCambiado,
                CambiadoPor,
                Cambiado,
                Description
            FROM dbo.Auditoria_Usuarios
            ORDER BY IdAuditoria DESC
        `);

        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({
            message: 'Error obteniendo auditoría de usuarios',
            error: err.message
        });
    }
};

module.exports = {
    obtenerAuditoriaProductos,
    obtenerAuditoriaVentas,
    obtenerAuditoriaUsuarios
};