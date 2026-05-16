import { useEffect, useState } from 'react';
import api from '../api/api';

type Producto = {
  IdProducto: number;
  Nombre: string;
  Categoria: string;
  Precio: number;
  Stock: number;
};

type Usuario = {
  IdUsuario: number;
  Username: string;
  Role: 'Admin' | 'Cliente';
};

type ClientePageProps = {
  usuario: Usuario;
  onLogout: () => void;
};

function ClientePage({ usuario, onLogout }: ClientePageProps) {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [idProducto, setIdProducto] = useState('');
  const [cantidad, setCantidad] = useState('1');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const cargarProductos = async () => {
    try {
      const response = await api.get('/productos');
      setProductos(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error cargando productos');
    }
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  const crearVenta = async (event: React.FormEvent) => {
    event.preventDefault();
    setMensaje('');
    setError('');

    if (!idProducto) {
      setError('Selecciona un producto');
      return;
    }

    try {
      const response = await api.post('/ventas', {
        IdUsuario: usuario.IdUsuario,
        productos: [
          {
            IdProducto: Number(idProducto),
            Cantidad: Number(cantidad),
          },
        ],
      });

      setMensaje(`Venta realizada correctamente. Total: $${Number(response.data.venta.TotalVenta).toFixed(2)}`);
      setCantidad('1');
      cargarProductos();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error creando venta');
    }
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1>TecMart - Cliente</h1>
          <p>Bienvenido, {usuario.Username}</p>
        </div>

        <button onClick={onLogout}>Cerrar sesión</button>
      </header>

      <section className="panel">
        <h2>Comprar producto</h2>

        <form onSubmit={crearVenta} className="product-form">
          <select
            value={idProducto}
            onChange={(event) => setIdProducto(event.target.value)}
          >
            <option value="">Selecciona un producto</option>
            {productos.map((producto) => (
              <option key={producto.IdProducto} value={producto.IdProducto}>
                {producto.Nombre} - ${Number(producto.Precio).toFixed(2)} - Stock: {producto.Stock}
              </option>
            ))}
          </select>

          <input
            type="number"
            min="1"
            placeholder="Cantidad"
            value={cantidad}
            onChange={(event) => setCantidad(event.target.value)}
          />

          <button type="submit">Comprar</button>
        </form>

        {mensaje && <p className="success">{mensaje}</p>}
        {error && <p className="error">{error}</p>}
      </section>

      <section className="panel">
        <h2>Productos disponibles</h2>

        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Categoría</th>
              <th>Precio</th>
              <th>Stock</th>
            </tr>
          </thead>

          <tbody>
            {productos.map((producto) => (
              <tr key={producto.IdProducto}>
                <td>{producto.Nombre}</td>
                <td>{producto.Categoria}</td>
                <td>${Number(producto.Precio).toFixed(2)}</td>
                <td>{producto.Stock}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

export default ClientePage;