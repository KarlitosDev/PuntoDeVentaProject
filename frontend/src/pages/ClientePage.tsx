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

type Billetera = {
  IdBilletera: number;
  IdUsuario: number;
  Username: string;
  Role: string;
  Saldo: number;
  Creado: string;
};

type CartItem = {
  IdProducto: number;
  Nombre: string;
  Precio: number;
  Cantidad: number;
  Stock: number;
};

type Recibo = {
  FolioRecibo: string;
  IdVenta: number;
  Cliente: string;
  IdUsuario: number;
  MetodoPago: string;
  EstadoPago: string;
  TotalVenta: number;
  SaldoAnterior: number;
  SaldoNuevo: number;
  productos: {
    IdProducto: number;
    Nombre: string;
    Cantidad: number;
    PrecioUnidad: number;
    Subtotal: number;
  }[];
};

type ClientePageProps = {
  usuario: Usuario;
  onLogout: () => void;
};

function ClientePage({ usuario, onLogout }: ClientePageProps) {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [billetera, setBilletera] = useState<Billetera | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [recibo, setRecibo] = useState<Recibo | null>(null);
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

  const cargarBilletera = async () => {
    try {
      const response = await api.get(`/billeteras/usuario/${usuario.IdUsuario}`);
      setBilletera(response.data);
    } catch (err: any) {
      setBilletera(null);
    }
  };

  useEffect(() => {
    cargarProductos();
    cargarBilletera();
  }, []);

  const agregarAlCarrito = (producto: Producto) => {
    setMensaje('');
    setError('');
    setRecibo(null);

    if (producto.Stock <= 0) {
      setError('Este producto no tiene stock disponible');
      return;
    }

    const existe = cart.find((item) => item.IdProducto === producto.IdProducto);

    if (existe) {
      if (existe.Cantidad + 1 > producto.Stock) {
        setError('No hay suficiente stock para agregar más unidades');
        return;
      }

      setCart(
        cart.map((item) =>
          item.IdProducto === producto.IdProducto
            ? { ...item, Cantidad: item.Cantidad + 1 }
            : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          IdProducto: producto.IdProducto,
          Nombre: producto.Nombre,
          Precio: Number(producto.Precio),
          Cantidad: 1,
          Stock: producto.Stock,
        },
      ]);
    }
  };

  const aumentarCantidad = (idProducto: number) => {
    setCart(
      cart.map((item) => {
        if (item.IdProducto === idProducto) {
          if (item.Cantidad + 1 > item.Stock) {
            setError('No hay suficiente stock disponible');
            return item;
          }

          return { ...item, Cantidad: item.Cantidad + 1 };
        }

        return item;
      })
    );
  };

  const disminuirCantidad = (idProducto: number) => {
    setCart(
      cart
        .map((item) =>
          item.IdProducto === idProducto
            ? { ...item, Cantidad: item.Cantidad - 1 }
            : item
        )
        .filter((item) => item.Cantidad > 0)
    );
  };

  const eliminarDelCarrito = (idProducto: number) => {
    setCart(cart.filter((item) => item.IdProducto !== idProducto));
  };

  const totalCarrito = cart.reduce(
    (total, item) => total + item.Precio * item.Cantidad,
    0
  );

  const confirmarCompra = async () => {
    setMensaje('');
    setError('');
    setRecibo(null);

    if (cart.length === 0) {
      setError('El carrito está vacío');
      return;
    }

    if (billetera && Number(billetera.Saldo) < totalCarrito) {
      setError('Saldo insuficiente en la billetera');
      return;
    }

    try {
      const response = await api.post('/ventas', {
        IdUsuario: usuario.IdUsuario,
        productos: cart.map((item) => ({
          IdProducto: item.IdProducto,
          Cantidad: item.Cantidad,
        })),
      });

      setRecibo(response.data.recibo);
      setMensaje('Compra realizada correctamente');
      setCart([]);

      await cargarProductos();
      await cargarBilletera();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error realizando compra');
    }
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1>TecMart - Cliente</h1>
          <p>Bienvenido, {usuario.Username}</p>
        </div>

        <div className="header-actions">
          <div className="wallet-pill">
            Saldo: ${Number(billetera?.Saldo || 0).toFixed(2)}
          </div>
          <button onClick={onLogout}>Cerrar sesión</button>
        </div>
      </header>

      <div className="client-layout">
        <section className="panel">
          <h2>Menú de productos</h2>

          <div className="product-grid">
            {productos.map((producto) => (
              <div className="product-card" key={producto.IdProducto}>
                <div className="product-icon">
                  {producto.Categoria?.charAt(0)?.toUpperCase() || 'P'}
                </div>

                <h3>{producto.Nombre}</h3>
                <p>{producto.Categoria}</p>
                <strong>${Number(producto.Precio).toFixed(2)}</strong>
                <span>Stock: {producto.Stock}</span>

                <button onClick={() => agregarAlCarrito(producto)}>
                  Agregar
                </button>
              </div>
            ))}
          </div>
        </section>

        <aside className="panel cart-panel">
          <h2>Carrito</h2>

          {cart.length === 0 ? (
            <p>No hay productos en el carrito.</p>
          ) : (
            <>
              {cart.map((item) => (
                <div className="cart-item" key={item.IdProducto}>
                  <div>
                    <strong>{item.Nombre}</strong>
                    <p>${item.Precio.toFixed(2)} c/u</p>
                  </div>

                  <div className="cart-controls">
                    <button onClick={() => disminuirCantidad(item.IdProducto)}>
                      -
                    </button>
                    <span>{item.Cantidad}</span>
                    <button onClick={() => aumentarCantidad(item.IdProducto)}>
                      +
                    </button>
                  </div>

                  <button
                    className="danger small"
                    onClick={() => eliminarDelCarrito(item.IdProducto)}
                  >
                    X
                  </button>
                </div>
              ))}

              <div className="cart-total">
                <span>Total</span>
                <strong>${totalCarrito.toFixed(2)}</strong>
              </div>

              <button onClick={confirmarCompra}>Confirmar compra</button>
            </>
          )}

          {mensaje && <p className="success">{mensaje}</p>}
          {error && <p className="error">{error}</p>}

          {recibo && (
            <div className="receipt">
              <h3>Recibo generado</h3>
              <p><strong>Folio:</strong> {recibo.FolioRecibo}</p>
              <p><strong>Total:</strong> ${Number(recibo.TotalVenta).toFixed(2)}</p>
              <p><strong>Saldo anterior:</strong> ${Number(recibo.SaldoAnterior).toFixed(2)}</p>
              <p><strong>Saldo nuevo:</strong> ${Number(recibo.SaldoNuevo).toFixed(2)}</p>
              <p><strong>Método:</strong> {recibo.MetodoPago}</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

export default ClientePage;