import { useEffect, useState } from 'react';
import api from '../api/api';

type Producto = {
  IdProducto: number;
  Nombre: string;
  Categoria: string;
  Precio: number;
  Stock: number;
  Icono?: string;
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

type PedidoAnterior = {
  IdVenta: number;
  IdUsuario: number;
  Username: string;
  FechaVenta: string;
  TotalVenta: number;
  FolioRecibo: string | null;
  EstadoPago: string;
  MetodoPago: string;
};

type DetallePedido = {
  IdDetalle: number;
  IdVenta: number;
  IdProducto: number;
  Nombre: string;
  Cantidad: number;
  PrecioUnidad: number;
  TotalParcial: number;
};

type ReciboAnteriorResponse = {
  venta: PedidoAnterior;
  detalles: DetallePedido[];
};

type ClientePageProps = {
  usuario: Usuario;
  onLogout: () => void;
};

type ClienteTab = 'menu' | 'carrito' | 'billetera' | 'pedidos';

function ClientePage({ usuario, onLogout }: ClientePageProps) {
  const [activeTab, setActiveTab] = useState<ClienteTab>('menu');

  const [productos, setProductos] = useState<Producto[]>([]);
  const [billetera, setBilletera] = useState<Billetera | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [recibo, setRecibo] = useState<Recibo | null>(null);
  const [pedidosAnteriores, setPedidosAnteriores] = useState<PedidoAnterior[]>([]);
  const [reciboAnterior, setReciboAnterior] = useState<ReciboAnteriorResponse | null>(null);
  const [busquedaProductos, setBusquedaProductos] = useState('');
  const [montoRecarga, setMontoRecarga] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('Todos');

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

  const cargarPedidosAnteriores = async () => {
    try {
      const response = await api.get(`/ventas/usuario/${usuario.IdUsuario}`);
      setPedidosAnteriores(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error cargando pedidos anteriores');
    }
  };

  useEffect(() => {
    cargarProductos();
    cargarBilletera();
    cargarPedidosAnteriores();
  }, []);

  const limpiarMensajes = () => {
    setMensaje('');
    setError('');
  };

  const agregarAlCarrito = (producto: Producto) => {
    limpiarMensajes();
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

    setMensaje('Producto agregado al carrito');
  };

  const aumentarCantidad = (idProducto: number) => {
    limpiarMensajes();

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
    limpiarMensajes();

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
    limpiarMensajes();
    setCart(cart.filter((item) => item.IdProducto !== idProducto));
  };

  const recargarBilletera = async (event: React.FormEvent) => {
    event.preventDefault();
    limpiarMensajes();

    const monto = Number(montoRecarga);

    if (!monto || monto <= 0) {
      setError('Ingresa un monto válido para recargar');
      return;
    }

    try {
      await api.post('/billeteras/recargar', {
        IdUsuario: usuario.IdUsuario,
        Monto: monto,
      });

      setMensaje('Saldo agregado correctamente');
      setMontoRecarga('');
      await cargarBilletera();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error recargando billetera');
    }
  };

  const verReciboAnterior = async (idVenta: number) => {
    limpiarMensajes();

    try {
      const response = await api.get(`/ventas/${idVenta}`);
      setReciboAnterior(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error cargando recibo');
    }
  };

  const cerrarReciboAnterior = () => {
    setReciboAnterior(null);
  };

  const confirmarCompra = async () => {
    limpiarMensajes();
    setRecibo(null);

    if (cart.length === 0) {
      setError('El carrito está vacío');
      return;
    }

    if (billetera && Number(billetera.Saldo) < totalCarrito) {
      setError('Saldo insuficiente en la billetera');
      setActiveTab('billetera');
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
      setActiveTab('pedidos');

      await cargarProductos();
      await cargarBilletera();
      await cargarPedidosAnteriores();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error realizando compra');
    }
  };

  const totalCarrito = cart.reduce(
    (total, item) => total + item.Precio * item.Cantidad,
    0
  );

  const categorias = [
    'Todos',
    ...Array.from(new Set(productos.map((producto) => producto.Categoria))),
  ];

  const productosFiltrados = productos.filter((producto) => {
    const textoBusqueda = busquedaProductos.toLowerCase();

    const coincideBusqueda =
      producto.Nombre.toLowerCase().includes(textoBusqueda) ||
      producto.Categoria.toLowerCase().includes(textoBusqueda) ||
      String(producto.Precio).includes(textoBusqueda);

    const coincideCategoria =
      categoriaSeleccionada === 'Todos' ||
      producto.Categoria === categoriaSeleccionada;

    return coincideBusqueda && coincideCategoria;
  });

  const cantidadCarrito = cart.reduce((total, item) => total + item.Cantidad, 0);

  return (
    <div className="client-shell">
      <aside className="client-sidebar">
        <div className="client-brand">
          <div className="client-logo">TM</div>
          <div>
            <h2>TecMart</h2>
            <p>Cliente</p>
          </div>
        </div>

        <nav className="client-nav">
          <button
            className={activeTab === 'menu' ? 'active' : ''}
            onClick={() => setActiveTab('menu')}
          >
            Menú
          </button>

          <button
            className={activeTab === 'carrito' ? 'active' : ''}
            onClick={() => setActiveTab('carrito')}
          >
            Carrito ({cantidadCarrito})
          </button>

          <button
            className={activeTab === 'billetera' ? 'active' : ''}
            onClick={() => setActiveTab('billetera')}
          >
            Billetera
          </button>

          <button
            className={activeTab === 'pedidos' ? 'active' : ''}
            onClick={() => {
              setActiveTab('pedidos');
              cargarPedidosAnteriores();
            }}
          >
            Pedidos anteriores
          </button>
        </nav>
      </aside>

      <main className="client-main">
        <header className="client-topbar">
          <div>
            <h1>Bienvenido, {usuario.Username}</h1>
            <p>Compra productos, administra tu carrito y recarga tu billetera.</p>
          </div>

          <div className="client-header-actions">
            <div className="client-wallet-pill">
              Saldo: ${Number(billetera?.Saldo || 0).toFixed(2)}
            </div>

            <button onClick={onLogout}>Cerrar sesión</button>
          </div>
        </header>

        {mensaje && <p className="client-success">{mensaje}</p>}
        {error && <p className="client-error">{error}</p>}

        {activeTab === 'menu' && (
          <section className="client-panel">
            <div className="client-hero">
              <div className="client-hero-content">
                <span className="client-hero-label">TecMart Express</span>

                <h2>Compra rápido, paga con tu billetera y recibe tu comprobante al instante.</h2>

                <p>
                  Explora productos disponibles, agrega artículos al carrito y finaliza tu compra
                  con saldo de tu billetera TecMart.
                </p>

                <div className="client-hero-actions">
                  <button onClick={() => setActiveTab('carrito')}>
                    Ver carrito ({cantidadCarrito})
                  </button>

                  <button className="client-secondary-button" onClick={() => setActiveTab('billetera')}>
                    Recargar billetera
                  </button>
                </div>
              </div>

              <div className="client-hero-card">
                <div className="client-hero-logo">TM</div>
                <span>Saldo disponible</span>
                <strong>${Number(billetera?.Saldo || 0).toFixed(2)}</strong>
                <p>{cantidadCarrito} producto(s) en carrito</p>
              </div>
            </div>
            
            <div className="client-section-header">
              <div>
                <h2>Menú de productos</h2>
                <p>Mostrando {productosFiltrados.length} de {productos.length} productos.</p>
              </div>

              <input
                className="client-search"
                type="text"
                placeholder="Buscar producto o categoría..."
                value={busquedaProductos}
                onChange={(event) => setBusquedaProductos(event.target.value)}
              />
            </div>

            <div className="category-chips">
              {categorias.map((categoria) => (
                <button
                  key={categoria}
                  className={categoriaSeleccionada === categoria ? 'active' : ''}
                  onClick={() => setCategoriaSeleccionada(categoria)}
                >
                  {categoria}
                </button>
              ))}
            </div>

            <div className="client-product-grid">              {productosFiltrados.map((producto) => (
                <div className="client-product-card" key={producto.IdProducto}>
                  <div className="client-product-image-box">
                    <img
                      src={`/product-icons/${producto.Icono || 'default.png'}`}
                      alt={producto.Nombre}
                      className="client-product-image"
                      onError={(event) => {
                        event.currentTarget.src = '/product-icons/default.png';
                      }}
                    />
                  </div>
                  <h3>{producto.Nombre}</h3>
                  <p>{producto.Categoria}</p>

                  <div className="client-product-info">
                    <strong>${Number(producto.Precio).toFixed(2)}</strong>
                    <span>Stock: {producto.Stock}</span>
                  </div>

                  <button onClick={() => agregarAlCarrito(producto)}>
                    Agregar al carrito
                  </button>
                </div>
              ))}

              {productosFiltrados.length === 0 && (
                <p>No se encontraron productos con esa búsqueda.</p>
              )}
            </div>
          </section>
        )}

        {activeTab === 'carrito' && (
          <section className="client-panel">
            <div className="client-section-header">
              <div>
                <h2>Carrito activo</h2>
                <p>Revisa tus productos antes de pagar.</p>
              </div>

              <button onClick={confirmarCompra}>Confirmar compra</button>
            </div>

            {cart.length === 0 ? (
              <div className="empty-client-state">
                <h3>Tu carrito está vacío</h3>
                <p>Agrega productos desde el menú para iniciar una compra.</p>
                <button onClick={() => setActiveTab('menu')}>Ir al menú</button>
              </div>
            ) : (
              <>
                <div className="client-cart-list">
                  {cart.map((item) => (
                    <div className="client-cart-item" key={item.IdProducto}>
                      <div>
                        <strong>{item.Nombre}</strong>
                        <p>${item.Precio.toFixed(2)} c/u</p>
                      </div>

                      <div className="client-cart-controls">
                        <button onClick={() => disminuirCantidad(item.IdProducto)}>
                          -
                        </button>
                        <span>{item.Cantidad}</span>
                        <button onClick={() => aumentarCantidad(item.IdProducto)}>
                          +
                        </button>
                      </div>

                      <div className="client-cart-subtotal">
                        ${(item.Precio * item.Cantidad).toFixed(2)}
                      </div>

                      <button
                        className="client-danger"
                        onClick={() => eliminarDelCarrito(item.IdProducto)}
                      >
                        Quitar
                      </button>
                    </div>
                  ))}
                </div>

                <div className="client-total-box">
                  <span>Total a pagar</span>
                  <strong>${totalCarrito.toFixed(2)}</strong>
                </div>
              </>
            )}
          </section>
        )}

        {activeTab === 'billetera' && (
          <section className="client-panel">
            <div className="wallet-dashboard">
              <div className="wallet-balance-card">
                <span>Saldo disponible</span>
                <strong>${Number(billetera?.Saldo || 0).toFixed(2)}</strong>
                <p>Este saldo se usará para pagar tus compras.</p>
              </div>

              <div className="wallet-recharge-card">
                <h2>Agregar saldo</h2>
                <p>Para este proyecto, la recarga simula agregar efectivo a tu billetera.</p>

                <form onSubmit={recargarBilletera} className="wallet-form">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Monto a recargar"
                    value={montoRecarga}
                    onChange={(event) => setMontoRecarga(event.target.value)}
                  />

                  <button type="submit">Agregar saldo</button>
                </form>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'pedidos' && (
          <section className="client-panel">
            <div className="client-section-header">
              <div>
                <h2>Pedidos anteriores</h2>
                <p>Consulta tus compras anteriores y abre el recibo asociado.</p>
              </div>

              <button onClick={cargarPedidosAnteriores}>
                Actualizar pedidos
              </button>
            </div>

            {recibo && (
              <div className="recent-purchase-banner">
                <div>
                  <strong>Última compra realizada</strong>
                  <p>
                    {recibo.FolioRecibo || 'N/A'} · Total ${Number(recibo.TotalVenta).toFixed(2)}
                  </p>
                </div>

                <button onClick={() => verReciboAnterior(recibo.IdVenta)}>
                  Ver recibo
                </button>
              </div>
            )}

            {reciboAnterior && (
              <div className="client-receipt previous-receipt">
                <div className="client-section-header">
                  <div>
                    <h3>Recibo {reciboAnterior.venta.FolioRecibo || 'N/A'}</h3>
                    <p>
                      Pedido #{reciboAnterior.venta.IdVenta} ·{' '}
                      {new Date(reciboAnterior.venta.FechaVenta).toLocaleString()}
                    </p>
                  </div>

                  <button className="client-secondary-button" onClick={cerrarReciboAnterior}>
                    Cerrar recibo
                  </button>
                </div>

                <div className="previous-receipt-summary">
                  <p>
                    <strong>Cliente:</strong> {reciboAnterior.venta.Username}
                  </p>
                  <p>
                    <strong>Método:</strong> {reciboAnterior.venta.MetodoPago}
                  </p>
                  <p>
                    <strong>Estado:</strong> {reciboAnterior.venta.EstadoPago}
                  </p>
                  <p>
                    <strong>Total:</strong> ${Number(reciboAnterior.venta.TotalVenta).toFixed(2)}
                  </p>
                </div>

                <table>
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Cantidad</th>
                      <th>Precio unidad</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>

                  <tbody>
                    {reciboAnterior.detalles.map((detalle) => (
                      <tr key={detalle.IdDetalle}>
                        <td>{detalle.Nombre}</td>
                        <td>{detalle.Cantidad}</td>
                        <td>${Number(detalle.PrecioUnidad).toFixed(2)}</td>
                        <td>${Number(detalle.TotalParcial).toFixed(2)}</td>
                      </tr>
                    ))}

                    {reciboAnterior.detalles.length === 0 && (
                      <tr>
                        <td colSpan={4}>Este pedido no tiene productos registrados.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            <div className="previous-orders-list">
              {pedidosAnteriores.map((pedido) => (
                <div className="previous-order-card" key={pedido.IdVenta}>
                  <div>
                    <strong>{pedido.FolioRecibo || `Pedido #${pedido.IdVenta}`}</strong>
                    <p>{new Date(pedido.FechaVenta).toLocaleString()}</p>
                  </div>

                  <div>
                    <span>Total</span>
                    <strong>${Number(pedido.TotalVenta).toFixed(2)}</strong>
                  </div>

                  <div>
                    <span>Estado</span>
                    <strong>{pedido.EstadoPago}</strong>
                  </div>

                  <button onClick={() => verReciboAnterior(pedido.IdVenta)}>
                    Ver recibo
                  </button>
                </div>
              ))}

              {pedidosAnteriores.length === 0 && (
                <div className="empty-client-state">
                  <h3>No tienes pedidos anteriores</h3>
                  <p>Cuando realices una compra, aparecerá aquí con su recibo asociado.</p>
                  <button onClick={() => setActiveTab('menu')}>Ir al menú</button>
                </div>
              )}
            </div>
          </section>
        )}        
      </main>
    </div>
  );
}

export default ClientePage;