const { getPool, sql } = require('../db/connection');

const obtenerVentas = async (req, res) => {
    try {
        const pool = getPool();

        const result = await pool.request().query(`
            SELECT 
                v.IdVenta,
                v.IdUsuario,
                u.Username,
                v.FechaVenta,
                v.Total
            FROM dbo.Ventas v
            INNER JOIN dbo.Usuarios u ON v.IdUsuario = u.IdUsuario
            ORDER BY v.IdVenta DESC
        `);

        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({
            message: 'Error obteniendo ventas',
            error: err.message
        });
    }
};

const obtenerVentaPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = getPool();

        const ventaResult = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT 
                    v.IdVenta,
                    v.IdUsuario,
                    u.Username,
                    v.FechaVenta,
                    v.Total
                FROM dbo.Ventas v
                INNER JOIN dbo.Usuarios u ON v.IdUsuario = u.IdUsuario
                WHERE v.IdVenta = @id
            `);

        if (ventaResult.recordset.length === 0) {
            return res.status(404).json({
                message: 'Venta no encontrada'
            });
        }

        const detallesResult = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT 
                    dv.IdDetalle,
                    dv.IdVenta,
                    dv.IdProducto,
                    p.Nombre,
                    dv.Cantidad,
                    dv.PrecioUnidad,
                    dv.TotalParcial
                FROM dbo.DetallesVentas dv
                INNER JOIN dbo.Productos p ON dv.IdProducto = p.IdProducto
                WHERE dv.IdVenta = @id
            `);

        res.json({
            venta: ventaResult.recordset[0],
            detalles: detallesResult.recordset
        });
    } catch (err) {
        res.status(500).json({
            message: 'Error obteniendo venta',
            error: err.message
        });
    }
};

const crearVenta = async (req, res) => {
    const pool = getPool();
    const transaction = new sql.Transaction(pool);

    try {
        const { IdUsuario, productos } = req.body;

        if (!IdUsuario || !Array.isArray(productos) || productos.length === 0) {
            return res.status(400).json({
                message: 'IdUsuario y productos son obligatorios'
            });
        }

        for (const item of productos) {
            if (!item.IdProducto || !item.Cantidad || item.Cantidad <= 0) {
                return res.status(400).json({
                    message: 'Cada producto debe tener IdProducto y Cantidad mayor a 0'
                });
            }
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

        let totalVenta = 0;
        const productosVenta = [];

        for (const item of productos) {
            const productoResult = await pool.request()
                .input('IdProducto', sql.Int, item.IdProducto)
                .query(`
                    SELECT IdProducto, Nombre, Precio, Stock
                    FROM dbo.Productos
                    WHERE IdProducto = @IdProducto
                `);

            if (productoResult.recordset.length === 0) {
                return res.status(404).json({
                    message: `Producto con ID ${item.IdProducto} no encontrado`
                });
            }

            const producto = productoResult.recordset[0];

            if (producto.Stock < item.Cantidad) {
                return res.status(400).json({
                    message: `Stock insuficiente para el producto ${producto.Nombre}`,
                    stockDisponible: producto.Stock,
                    cantidadSolicitada: item.Cantidad
                });
            }

            const subtotal = Number(producto.Precio) * Number(item.Cantidad);
            totalVenta += subtotal;

            productosVenta.push({
                IdProducto: producto.IdProducto,
                Nombre: producto.Nombre,
                Cantidad: item.Cantidad,
                PrecioUnidad: producto.Precio,
                Subtotal: subtotal
            });
        }

        await transaction.begin();

        const ventaRequest = new sql.Request(transaction);

        const ventaResult = await ventaRequest
            .input('IdUsuario', sql.Int, IdUsuario)
            .input('Total', sql.Decimal(10, 2), totalVenta)
            .query(`
                INSERT INTO dbo.Ventas (IdUsuario, Total)
                VALUES (@IdUsuario, @Total);

                SELECT SCOPE_IDENTITY() AS IdVenta;
            `);

        const IdVenta = ventaResult.recordset[0].IdVenta;

        for (const item of productosVenta) {
            const detalleRequest = new sql.Request(transaction);

            await detalleRequest
                .input('IdVenta', sql.Int, IdVenta)
                .input('IdProducto', sql.Int, item.IdProducto)
                .input('Cantidad', sql.Int, item.Cantidad)
                .input('PrecioUnidad', sql.Decimal(10, 2), item.PrecioUnidad)
                .query(`
                    INSERT INTO dbo.DetallesVentas (IdVenta, IdProducto, Cantidad, PrecioUnidad)
                    VALUES (@IdVenta, @IdProducto, @Cantidad, @PrecioUnidad);
                `);
        }

        await transaction.commit();

        res.status(201).json({
            message: 'Venta creada correctamente',
            venta: {
                IdVenta,
                IdUsuario,
                Total: totalVenta,
                productos: productosVenta
            }
        });
    } catch (err) {
        try {
            await transaction.rollback();
        } catch (rollbackError) {
            console.error('Error haciendo rollback:', rollbackError.message);
        }

        res.status(500).json({
            message: 'Error creando venta',
            error: err.message
        });
    }
};

module.exports = {
    obtenerVentas,
    obtenerVentaPorId,
    crearVenta
};