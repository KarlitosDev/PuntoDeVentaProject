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
                v.TotalVenta,
                v.FolioRecibo,
                v.EstadoPago,
                v.MetodoPago
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
                    v.TotalVenta,
                    v.FolioRecibo,
                    v.EstadoPago,
                    v.MetodoPago
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

        const usuario = usuarioResult.recordset[0];

        if (usuario.Role !== 'Cliente') {
            return res.status(400).json({
                message: 'Solo los usuarios Cliente pueden realizar compras'
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
                PrecioUnidad: Number(producto.Precio),
                Subtotal: subtotal
            });
        }

        const billeteraResult = await pool.request()
            .input('IdUsuario', sql.Int, IdUsuario)
            .query(`
                SELECT IdBilletera, IdUsuario, Saldo
                FROM dbo.Billeteras
                WHERE IdUsuario = @IdUsuario
            `);

        if (billeteraResult.recordset.length === 0) {
            return res.status(404).json({
                message: 'El cliente no tiene billetera registrada'
            });
        }

        const billetera = billeteraResult.recordset[0];
        const saldoAnterior = Number(billetera.Saldo);

        if (saldoAnterior < totalVenta) {
            return res.status(400).json({
                message: 'Saldo insuficiente en la billetera',
                saldoDisponible: saldoAnterior,
                totalVenta
            });
        }

        const saldoNuevo = saldoAnterior - totalVenta;

        await transaction.begin();

        const ventaRequest = new sql.Request(transaction);

        const ventaResult = await ventaRequest
            .input('IdUsuario', sql.Int, IdUsuario)
            .input('TotalVenta', sql.Decimal(10, 2), totalVenta)
            .input('EstadoPago', sql.VarChar(20), 'PAGADO')
            .input('MetodoPago', sql.VarChar(20), 'BILLETERA')
            .query(`
                INSERT INTO dbo.Ventas (IdUsuario, TotalVenta, EstadoPago, MetodoPago)
                VALUES (@IdUsuario, @TotalVenta, @EstadoPago, @MetodoPago);

                SELECT SCOPE_IDENTITY() AS IdVenta;
            `);

        const IdVenta = Number(ventaResult.recordset[0].IdVenta);
        const FolioRecibo = `TEC-${String(IdVenta).padStart(6, '0')}`;

        const folioRequest = new sql.Request(transaction);

        await folioRequest
            .input('IdVenta', sql.Int, IdVenta)
            .input('FolioRecibo', sql.VarChar(50), FolioRecibo)
            .query(`
                UPDATE dbo.Ventas
                SET FolioRecibo = @FolioRecibo
                WHERE IdVenta = @IdVenta
            `);
        
        const auditoriaFolioRequest = new sql.Request(transaction);

        await auditoriaFolioRequest
            .input('IdVenta', sql.Int, IdVenta)
            .input('FolioRecibo', sql.VarChar(50), FolioRecibo)
            .query(`
                UPDATE dbo.Auditoria_Ventas
                SET FolioRecibo = @FolioRecibo
                WHERE IdVenta = @IdVenta
            `);

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

        const actualizarBilleteraRequest = new sql.Request(transaction);

        await actualizarBilleteraRequest
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
            .input('Monto', sql.Decimal(10, 2), totalVenta)
            .input('SaldoAnterior', sql.Decimal(10, 2), saldoAnterior)
            .input('SaldoNuevo', sql.Decimal(10, 2), saldoNuevo)
            .input('IdVenta', sql.Int, IdVenta)
            .input('CambiadoPor', sql.VarChar(100), usuario.Username)
            .input('Description', sql.VarChar(255), `Compra realizada. Recibo: ${FolioRecibo}`)
            .query(`
                INSERT INTO dbo.Movimientos_Billetera (
                    IdBilletera,
                    TipoMovimiento,
                    Monto,
                    SaldoAnterior,
                    SaldoNuevo,
                    IdVenta,
                    CambiadoPor,
                    Description
                )
                VALUES (
                    @IdBilletera,
                    'COMPRA',
                    @Monto,
                    @SaldoAnterior,
                    @SaldoNuevo,
                    @IdVenta,
                    @CambiadoPor,
                    @Description
                );
            `);

        await transaction.commit();

        res.status(201).json({
            message: 'Venta creada correctamente',
            recibo: {
                FolioRecibo,
                IdVenta,
                Cliente: usuario.Username,
                IdUsuario,
                MetodoPago: 'BILLETERA',
                EstadoPago: 'PAGADO',
                TotalVenta: totalVenta,
                SaldoAnterior: saldoAnterior,
                SaldoNuevo: saldoNuevo,
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