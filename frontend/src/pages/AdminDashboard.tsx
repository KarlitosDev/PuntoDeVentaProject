import { useEffect, useState } from 'react';
import api from '../api/api';

type Producto = {
  IdProducto: number;
  Nombre: string;
  Categoria: string;
  Precio: number;
  Stock: number;
  Creado: string;
};

type AdminDashboardProps = {
  username: string;
  onLogout: () => void;
};

function AdminDashboard({ username, onLogout }: AdminDashboardProps) {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState('');
  const [precio, setPrecio] = useState('');
  const [stock, setStock] = useState('');
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

  const crearProducto = async (event: React.FormEvent) => {
    event.preventDefault();
    setMensaje('');
    setError('');

    try {
      await api.post('/productos', {
        Nombre: nombre,
        Categoria: categoria,
        Precio: Number(precio),
        Stock: Number(stock),
      });

      setMensaje('Producto creado correctamente');
      setNombre('');
      setCategoria('');
      setPrecio('');
      setStock('');
      cargarProductos();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error creando producto');
    }
  };

  const eliminarProducto = async (id: number) => {
    const confirmar = window.confirm('¿Seguro que deseas eliminar este producto?');

    if (!confirmar) return;

    try {
      await api.delete(`/productos/${id}`);
      setMensaje('Producto eliminado correctamente');
      cargarProductos();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error eliminando producto');
    }
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1>TecMart - Panel Admin</h1>
          <p>Bienvenido, {username}</p>
        </div>

        <button onClick={onLogout}>Cerrar sesión</button>
      </header>

      <section className="panel">
        <h2>Registrar producto</h2>

        <form onSubmit={crearProducto} className="product-form">
          <input
            type="text"
            placeholder="Nombre"
            value={nombre}
            onChange={(event) => setNombre(event.target.value)}
          />

          <input
            type="text"
            placeholder="Categoría"
            value={categoria}
            onChange={(event) => setCategoria(event.target.value)}
          />

          <input
            type="number"
            step="0.01"
            placeholder="Precio"
            value={precio}
            onChange={(event) => setPrecio(event.target.value)}
          />

          <input
            type="number"
            placeholder="Stock"
            value={stock}
            onChange={(event) => setStock(event.target.value)}
          />

          <button type="submit">Agregar producto</button>
        </form>

        {mensaje && <p className="success">{mensaje}</p>}
        {error && <p className="error">{error}</p>}
      </section>

      <section className="panel">
        <h2>Productos registrados</h2>

        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Categoría</th>
              <th>Precio</th>
              <th>Stock</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {productos.map((producto) => (
              <tr key={producto.IdProducto}>
                <td>{producto.IdProducto}</td>
                <td>{producto.Nombre}</td>
                <td>{producto.Categoria}</td>
                <td>${Number(producto.Precio).toFixed(2)}</td>
                <td>{producto.Stock}</td>
                <td>
                  <button
                    className="danger"
                    onClick={() => eliminarProducto(producto.IdProducto)}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}

            {productos.length === 0 && (
              <tr>
                <td colSpan={6}>No hay productos registrados.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}

export default AdminDashboard;