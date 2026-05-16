const { getPool, sql } = require('../db/connection');

const obtenerProductos = async (req, res) => {
    try {
        const pool = getPool();

        const result = await pool.request().query(`
            SELECT IdProducto, Nombre, Categoria, Precio, Stock, Creado
            FROM dbo.Productos
            ORDER BY IdProducto DESC
        `);

        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({
            message: 'Error obteniendo productos',
            error: err.message
        });
    }
};

const obtenerProductoPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = getPool();

        const result = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT IdProducto, Nombre, Categoria, Precio, Stock, Creado
                FROM dbo.Productos
                WHERE IdProducto = @id
            `);

        if (result.recordset.length === 0) {
            return res.status(404).json({
                message: 'Producto no encontrado'
            });
        }

        res.json(result.recordset[0]);
    } catch (err) {
        res.status(500).json({
            message: 'Error obteniendo producto',
            error: err.message
        });
    }
};

const crearProducto = async (req, res) => {
    try {
        const { Nombre, Categoria, Precio, Stock } = req.body;

        if (!Nombre || Precio == null || Stock == null) {
            return res.status(400).json({
                message: 'Nombre, Precio y Stock son obligatorios'
            });
        }

        if (Precio < 0 || Stock < 0) {
            return res.status(400).json({
                message: 'Precio y Stock no pueden ser negativos'
            });
        }

        const pool = getPool();

        const result = await pool.request()
            .input('Nombre', sql.VarChar(100), Nombre)
            .input('Categoria', sql.VarChar(50), Categoria || null)
            .input('Precio', sql.Decimal(10, 2), Precio)
            .input('Stock', sql.Int, Stock)
            .query(`
                INSERT INTO dbo.Productos (Nombre, Categoria, Precio, Stock)
                VALUES (@Nombre, @Categoria, @Precio, @Stock);

                SELECT IdProducto, Nombre, Categoria, Precio, Stock, Creado
                FROM dbo.Productos
                WHERE IdProducto = SCOPE_IDENTITY();
            `);

        res.status(201).json({
            message: 'Producto creado correctamente',
            producto: result.recordset[0]
        });
    } catch (err) {
        res.status(500).json({
            message: 'Error creando producto',
            error: err.message
        });
    }
};

const actualizarProducto = async (req, res) => {
    try {
        const { id } = req.params;
        const { Nombre, Categoria, Precio, Stock } = req.body;

        if (!Nombre || Precio == null || Stock == null) {
            return res.status(400).json({
                message: 'Nombre, Precio y Stock son obligatorios'
            });
        }

        if (Precio < 0 || Stock < 0) {
            return res.status(400).json({
                message: 'Precio y Stock no pueden ser negativos'
            });
        }

        const pool = getPool();

        const existe = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT IdProducto
                FROM dbo.Productos
                WHERE IdProducto = @id
            `);

        if (existe.recordset.length === 0) {
            return res.status(404).json({
                message: 'Producto no encontrado'
            });
        }

        await pool.request()
            .input('id', sql.Int, id)
            .input('Nombre', sql.VarChar(100), Nombre)
            .input('Categoria', sql.VarChar(50), Categoria || null)
            .input('Precio', sql.Decimal(10, 2), Precio)
            .input('Stock', sql.Int, Stock)
            .query(`
                UPDATE dbo.Productos
                SET Nombre = @Nombre,
                    Categoria = @Categoria,
                    Precio = @Precio,
                    Stock = @Stock
                WHERE IdProducto = @id
            `);

        const productoActualizado = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT IdProducto, Nombre, Categoria, Precio, Stock, Creado
                FROM dbo.Productos
                WHERE IdProducto = @id
            `);

        res.json({
            message: 'Producto actualizado correctamente',
            producto: productoActualizado.recordset[0]
        });
    } catch (err) {
        res.status(500).json({
            message: 'Error actualizando producto',
            error: err.message
        });
    }
};

const eliminarProducto = async (req, res) => {
    try {
        const { id } = req.params;
        const pool = getPool();

        const producto = await pool.request()
            .input('id', sql.Int, id)
            .query(`
                SELECT IdProducto, Nombre, Categoria, Precio, Stock
                FROM dbo.Productos
                WHERE IdProducto = @id
            `);

        if (producto.recordset.length === 0) {
            return res.status(404).json({
                message: 'Producto no encontrado'
            });
        }

        await pool.request()
            .input('id', sql.Int, id)
            .query(`
                DELETE FROM dbo.Productos
                WHERE IdProducto = @id
            `);

        res.json({
            message: 'Producto eliminado correctamente',
            producto: producto.recordset[0]
        });
    } catch (err) {
        res.status(500).json({
            message: 'Error eliminando producto',
            error: err.message
        });
    }
};

module.exports = {
    obtenerProductos,
    obtenerProductoPorId,
    crearProducto,
    actualizarProducto,
    eliminarProducto
};