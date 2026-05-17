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

type Usuario = {
  IdUsuario: number;
  Username: string;
  Role: 'Admin' | 'Cliente';
  Creado: string;
};

type Billetera = {
  IdBilletera: number;
  IdUsuario: number;
  Username: string;
  Role: string;
  Saldo: number;
  Creado: string;
};

type MovimientoBilletera = {
  IdMovimiento: number;
  IdBilletera: number;
  IdUsuario: number;
  Username: string;
  TipoMovimiento: string;
  Monto: number;
  SaldoAnterior: number;
  SaldoNuevo: number;
  IdVenta: number | null;
  FolioRecibo: string | null;
  CambiadoPor: string;
  FechaMovimiento: string;
  Description: string;
};

type Venta = {
  IdVenta: number;
  IdUsuario: number;
  Username: string;
  FechaVenta: string;
  TotalVenta: number;
  FolioRecibo: string;
  EstadoPago: string;
  MetodoPago: string;
};

type AuditoriaProducto = {
  IdAuditoria: number;
  Operacion: string;
  IdProducto: number;
  NombreProducto: string;
  PrecioViejo: number | null;
  PrecioNuevo: number | null;
  StockViejo: number | null;
  StockNuevo: number | null;
  CambiadoPor: string;
  Cambiado: string;
  Description: string;
};

type AuditoriaVenta = {
  IdAuditoria: number;
  Operacion: string;
  IdVenta: number;
  IdUsuario: number;
  TotalVenta: number;
  FolioRecibo: string | null;
  MetodoPago: string | null;
  CambiadoPor: string;
  Cambiado: string;
  Description: string;
};

type AuditoriaUsuario = {
  IdAuditoria: number;
  Operacion: string;
  IdUsuario: number;
  UsernameViejo: string | null;
  UsernameNuevo: string | null;
  RoleViejo: string | null;
  RoleNuevo: string | null;
  PasswordCambiado: boolean;
  CambiadoPor: string;
  Cambiado: string;
  Description: string;
};

type AdminDashboardProps = {
  username: string;
  onLogout: () => void;
};

type Tab = 'dashboard' | 'productos' | 'usuarios' | 'billeteras' | 'ventas' | 'auditoria';

function AdminDashboard({ username, onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  const [productos, setProductos] = useState<Producto[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [billeteras, setBilleteras] = useState<Billetera[]>([]);
  const [movimientos, setMovimientos] = useState<MovimientoBilletera[]>([]);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [auditoriaProductos, setAuditoriaProductos] = useState<AuditoriaProducto[]>([]);
  const [auditoriaVentas, setAuditoriaVentas] = useState<AuditoriaVenta[]>([]);
  const [auditoriaUsuarios, setAuditoriaUsuarios] = useState<AuditoriaUsuario[]>([]);

  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState('');
  const [precio, setPrecio] = useState('');
  const [stock, setStock] = useState('');

  const [productoEditando, setProductoEditando] = useState<Producto | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editCategoria, setEditCategoria] = useState('');
  const [editPrecio, setEditPrecio] = useState('');
  const [editStock, setEditStock] = useState('');

  const [usernameNuevo, setUsernameNuevo] = useState('');
  const [passwordNuevo, setPasswordNuevo] = useState('');
  const [roleNuevo, setRoleNuevo] = useState<'Admin' | 'Cliente'>('Cliente');

  const [idUsuarioRecarga, setIdUsuarioRecarga] = useState('');
  const [montoRecarga, setMontoRecarga] = useState('');

  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const cargarDatos = async () => {
    try {
      const [
        productosRes,
        usuariosRes,
        billeterasRes,
        movimientosRes,
        ventasRes,
        auditProductosRes,
        auditVentasRes,
        auditUsuariosRes,
      ] = await Promise.all([
        api.get('/productos'),
        api.get('/auth/usuarios'),
        api.get('/billeteras'),
        api.get('/billeteras/movimientos'),
        api.get('/ventas'),
        api.get('/auditoria/productos'),
        api.get('/auditoria/ventas'),
        api.get('/auditoria/usuarios'),
      ]);

      setProductos(productosRes.data);
      setUsuarios(usuariosRes.data);
      setBilleteras(billeterasRes.data);
      setMovimientos(movimientosRes.data);
      setVentas(ventasRes.data);
      setAuditoriaProductos(auditProductosRes.data);
      setAuditoriaVentas(auditVentasRes.data);
      setAuditoriaUsuarios(auditUsuariosRes.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error cargando datos del dashboard');
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const limpiarMensajes = () => {
    setMensaje('');
    setError('');
  };

  const crearProducto = async (event: React.FormEvent) => {
    event.preventDefault();
    limpiarMensajes();

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
      await cargarDatos();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error creando producto');
    }
  };

  const iniciarEdicionProducto = (producto: Producto) => {
    limpiarMensajes();

    setProductoEditando(producto);
    setEditNombre(producto.Nombre);
    setEditCategoria(producto.Categoria);
    setEditPrecio(String(producto.Precio));
    setEditStock(String(producto.Stock));
  };

  const cancelarEdicionProducto = () => {
    setProductoEditando(null);
    setEditNombre('');
    setEditCategoria('');
    setEditPrecio('');
    setEditStock('');
  };

  const actualizarProducto = async (event: React.FormEvent) => {
    event.preventDefault();
    limpiarMensajes();

    if (!productoEditando) return;

    try {
      await api.put(`/productos/${productoEditando.IdProducto}`, {
        Nombre: editNombre,
        Categoria: editCategoria,
        Precio: Number(editPrecio),
        Stock: Number(editStock),
      });

      setMensaje('Producto actualizado correctamente');
      cancelarEdicionProducto();
      await cargarDatos();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error actualizando producto');
    }
  };

  const eliminarProducto = async (id: number) => {
    const confirmar = window.confirm('¿Seguro que deseas eliminar este producto?');
    if (!confirmar) return;

    limpiarMensajes();

    try {
      await api.delete(`/productos/${id}`);
      setMensaje('Producto eliminado correctamente');
      await cargarDatos();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error eliminando producto');
    }
  };

  const registrarUsuario = async (event: React.FormEvent) => {
    event.preventDefault();
    limpiarMensajes();

    try {
      await api.post('/auth/register', {
        Username: usernameNuevo,
        Password: passwordNuevo,
        Role: roleNuevo,
      });

      setMensaje('Usuario registrado correctamente');
      setUsernameNuevo('');
      setPasswordNuevo('');
      setRoleNuevo('Cliente');
      await cargarDatos();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error registrando usuario');
    }
  };

  const recargarBilletera = async (event: React.FormEvent) => {
    event.preventDefault();
    limpiarMensajes();

    try {
      await api.post('/billeteras/recargar', {
        IdUsuario: Number(idUsuarioRecarga),
        Monto: Number(montoRecarga),
      });

      setMensaje('Billetera recargada correctamente');
      setIdUsuarioRecarga('');
      setMontoRecarga('');
      await cargarDatos();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error recargando billetera');
    }
  };

  const totalVentas = ventas.reduce((sum, venta) => sum + Number(venta.TotalVenta), 0);
  const clientes = usuarios.filter((usuario) => usuario.Role === 'Cliente');
  const admins = usuarios.filter((usuario) => usuario.Role === 'Admin');
  const productosBajoStock = productos.filter((producto) => producto.Stock <= 5);

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="brand-block">
          <div className="brand-logo">TM</div>
          <div>
            <h2>TecMart</h2>
            <p>Admin Console</p>
          </div>
        </div>

        <nav className="admin-nav">
          <button
            className={activeTab === 'dashboard' ? 'active' : ''}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>

          <button
            className={activeTab === 'productos' ? 'active' : ''}
            onClick={() => setActiveTab('productos')}
          >
            Productos
          </button>

          <button
            className={activeTab === 'usuarios' ? 'active' : ''}
            onClick={() => setActiveTab('usuarios')}
          >
            Usuarios
          </button>

          <button
            className={activeTab === 'billeteras' ? 'active' : ''}
            onClick={() => setActiveTab('billeteras')}
          >
            Billeteras
          </button>

          <button
            className={activeTab === 'ventas' ? 'active' : ''}
            onClick={() => setActiveTab('ventas')}
          >
            Ventas
          </button>

          <button
            className={activeTab === 'auditoria' ? 'active' : ''}
            onClick={() => setActiveTab('auditoria')}
          >
            Auditoría
          </button>
        </nav>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <h1>Panel Administrativo</h1>
            <p>Bienvenido, {username}</p>
          </div>

          <div className="header-actions">
            <button onClick={cargarDatos}>Actualizar</button>
            <button onClick={onLogout}>Cerrar sesión</button>
          </div>
        </header>

        {mensaje && <p className="success">{mensaje}</p>}
        {error && <p className="error">{error}</p>}

        {activeTab === 'dashboard' && (
          <>
            <section className="metrics-grid">
              <div className="metric-card">
                <span>Ventas Totales</span>
                <strong>${totalVentas.toFixed(2)}</strong>
              </div>

              <div className="metric-card">
                <span>Productos</span>
                <strong>{productos.length}</strong>
              </div>

              <div className="metric-card">
                <span>Clientes</span>
                <strong>{clientes.length}</strong>
              </div>

              <div className="metric-card warning">
                <span>Bajo Stock</span>
                <strong>{productosBajoStock.length}</strong>
              </div>
            </section>

            <section className="panel">
              <h2>Resumen del sistema</h2>

              <div className="summary-grid">
                <p>
                  <strong>Administradores:</strong> {admins.length}
                </p>
                <p>
                  <strong>Ventas registradas:</strong> {ventas.length}
                </p>
                <p>
                  <strong>Billeteras activas:</strong> {billeteras.length}
                </p>
                <p>
                  <strong>Movimientos de billetera:</strong> {movimientos.length}
                </p>
              </div>
            </section>

            <section className="panel">
              <h2>Productos con bajo stock</h2>

              <table>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Categoría</th>
                    <th>Stock</th>
                  </tr>
                </thead>

                <tbody>
                  {productosBajoStock.map((producto) => (
                    <tr key={producto.IdProducto}>
                      <td>{producto.Nombre}</td>
                      <td>{producto.Categoria}</td>
                      <td>{producto.Stock}</td>
                    </tr>
                  ))}

                  {productosBajoStock.length === 0 && (
                    <tr>
                      <td colSpan={3}>No hay productos con bajo stock.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </section>
          </>
        )}

        {activeTab === 'productos' && (
          <>
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
            </section>

            {productoEditando && (
              <section className="panel edit-panel">
                <h2>Editar producto</h2>

                <form onSubmit={actualizarProducto} className="product-form">
                  <input
                    type="text"
                    placeholder="Nombre"
                    value={editNombre}
                    onChange={(event) => setEditNombre(event.target.value)}
                  />

                  <input
                    type="text"
                    placeholder="Categoría"
                    value={editCategoria}
                    onChange={(event) => setEditCategoria(event.target.value)}
                  />

                  <input
                    type="number"
                    step="0.01"
                    placeholder="Precio"
                    value={editPrecio}
                    onChange={(event) => setEditPrecio(event.target.value)}
                  />

                  <input
                    type="number"
                    placeholder="Stock"
                    value={editStock}
                    onChange={(event) => setEditStock(event.target.value)}
                  />

                  <button type="submit">Guardar cambios</button>

                  <button
                    type="button"
                    className="secondary"
                    onClick={cancelarEdicionProducto}
                  >
                    Cancelar
                  </button>
                </form>
              </section>
            )}

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
                        <div className="table-actions">
                          <button onClick={() => iniciarEdicionProducto(producto)}>
                            Editar
                          </button>

                          <button
                            className="danger"
                            onClick={() => eliminarProducto(producto.IdProducto)}
                          >
                            Eliminar
                          </button>
                        </div>
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
          </>
        )}

        {activeTab === 'usuarios' && (
          <>
            <section className="panel">
              <h2>Registrar usuario</h2>

              <form onSubmit={registrarUsuario} className="product-form">
                <input
                  type="text"
                  placeholder="Username"
                  value={usernameNuevo}
                  onChange={(event) => setUsernameNuevo(event.target.value)}
                />

                <input
                  type="password"
                  placeholder="Password"
                  value={passwordNuevo}
                  onChange={(event) => setPasswordNuevo(event.target.value)}
                />

                <select
                  value={roleNuevo}
                  onChange={(event) => setRoleNuevo(event.target.value as 'Admin' | 'Cliente')}
                >
                  <option value="Cliente">Cliente</option>
                  <option value="Admin">Admin</option>
                </select>

                <button type="submit">Crear usuario</button>
              </form>
            </section>

            <section className="panel">
              <h2>Usuarios registrados</h2>

              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Usuario</th>
                    <th>Rol</th>
                    <th>Creado</th>
                  </tr>
                </thead>

                <tbody>
                  {usuarios.map((usuario) => (
                    <tr key={usuario.IdUsuario}>
                      <td>{usuario.IdUsuario}</td>
                      <td>{usuario.Username}</td>
                      <td>{usuario.Role}</td>
                      <td>{new Date(usuario.Creado).toLocaleString()}</td>
                    </tr>
                  ))}

                  {usuarios.length === 0 && (
                    <tr>
                      <td colSpan={4}>No hay usuarios registrados.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </section>
          </>
        )}

        {activeTab === 'billeteras' && (
          <>
            <section className="panel">
              <h2>Recargar billetera</h2>

              <form onSubmit={recargarBilletera} className="product-form">
                <select
                  value={idUsuarioRecarga}
                  onChange={(event) => setIdUsuarioRecarga(event.target.value)}
                >
                  <option value="">Selecciona un cliente</option>
                  {clientes.map((cliente) => (
                    <option key={cliente.IdUsuario} value={cliente.IdUsuario}>
                      {cliente.Username}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  step="0.01"
                  placeholder="Monto"
                  value={montoRecarga}
                  onChange={(event) => setMontoRecarga(event.target.value)}
                />

                <button type="submit">Recargar</button>
              </form>
            </section>

            <section className="panel">
              <h2>Saldos de clientes</h2>

              <table>
                <thead>
                  <tr>
                    <th>ID Billetera</th>
                    <th>Cliente</th>
                    <th>Saldo</th>
                    <th>Creado</th>
                  </tr>
                </thead>

                <tbody>
                  {billeteras.map((billetera) => (
                    <tr key={billetera.IdBilletera}>
                      <td>{billetera.IdBilletera}</td>
                      <td>{billetera.Username}</td>
                      <td>${Number(billetera.Saldo).toFixed(2)}</td>
                      <td>{new Date(billetera.Creado).toLocaleString()}</td>
                    </tr>
                  ))}

                  {billeteras.length === 0 && (
                    <tr>
                      <td colSpan={4}>No hay billeteras registradas.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </section>

            <section className="panel">
              <h2>Movimientos de billetera</h2>

              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Cliente</th>
                    <th>Tipo</th>
                    <th>Monto</th>
                    <th>Saldo anterior</th>
                    <th>Saldo nuevo</th>
                    <th>Recibo</th>
                  </tr>
                </thead>

                <tbody>
                  {movimientos.map((movimiento) => (
                    <tr key={movimiento.IdMovimiento}>
                      <td>{movimiento.IdMovimiento}</td>
                      <td>{movimiento.Username}</td>
                      <td>{movimiento.TipoMovimiento}</td>
                      <td>${Number(movimiento.Monto).toFixed(2)}</td>
                      <td>${Number(movimiento.SaldoAnterior).toFixed(2)}</td>
                      <td>${Number(movimiento.SaldoNuevo).toFixed(2)}</td>
                      <td>{movimiento.FolioRecibo || 'N/A'}</td>
                    </tr>
                  ))}

                  {movimientos.length === 0 && (
                    <tr>
                      <td colSpan={7}>No hay movimientos registrados.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </section>
          </>
        )}

        {activeTab === 'ventas' && (
          <section className="panel">
            <h2>Ventas registradas</h2>

            <table>
              <thead>
                <tr>
                  <th>ID Venta</th>
                  <th>Recibo</th>
                  <th>Cliente</th>
                  <th>Total</th>
                  <th>Método</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                </tr>
              </thead>

              <tbody>
                {ventas.map((venta) => (
                  <tr key={venta.IdVenta}>
                    <td>{venta.IdVenta}</td>
                    <td>{venta.FolioRecibo}</td>
                    <td>{venta.Username}</td>
                    <td>${Number(venta.TotalVenta).toFixed(2)}</td>
                    <td>{venta.MetodoPago}</td>
                    <td>{venta.EstadoPago}</td>
                    <td>{new Date(venta.FechaVenta).toLocaleString()}</td>
                  </tr>
                ))}

                {ventas.length === 0 && (
                  <tr>
                    <td colSpan={7}>No hay ventas registradas.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        )}

        {activeTab === 'auditoria' && (
          <>
            <section className="panel">
              <h2>Auditoría de productos</h2>

              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Operación</th>
                    <th>Producto</th>
                    <th>Stock anterior</th>
                    <th>Stock nuevo</th>
                    <th>Descripción</th>
                  </tr>
                </thead>

                <tbody>
                  {auditoriaProductos.map((audit) => (
                    <tr key={audit.IdAuditoria}>
                      <td>{audit.IdAuditoria}</td>
                      <td>{audit.Operacion}</td>
                      <td>{audit.NombreProducto}</td>
                      <td>{audit.StockViejo ?? 'N/A'}</td>
                      <td>{audit.StockNuevo ?? 'N/A'}</td>
                      <td>{audit.Description}</td>
                    </tr>
                  ))}

                  {auditoriaProductos.length === 0 && (
                    <tr>
                      <td colSpan={6}>No hay auditoría de productos.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </section>

            <section className="panel">
              <h2>Auditoría de ventas</h2>

              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Operación</th>
                    <th>Venta</th>
                    <th>Recibo</th>
                    <th>Total</th>
                    <th>Descripción</th>
                  </tr>
                </thead>

                <tbody>
                  {auditoriaVentas.map((audit) => (
                    <tr key={audit.IdAuditoria}>
                      <td>{audit.IdAuditoria}</td>
                      <td>{audit.Operacion}</td>
                      <td>{audit.IdVenta}</td>
                      <td>{audit.FolioRecibo || 'N/A'}</td>
                      <td>${Number(audit.TotalVenta || 0).toFixed(2)}</td>
                      <td>{audit.Description}</td>
                    </tr>
                  ))}

                  {auditoriaVentas.length === 0 && (
                    <tr>
                      <td colSpan={6}>No hay auditoría de ventas.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </section>

            <section className="panel">
              <h2>Auditoría de usuarios</h2>

              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Operación</th>
                    <th>Usuario anterior</th>
                    <th>Usuario nuevo</th>
                    <th>Rol anterior</th>
                    <th>Rol nuevo</th>
                    <th>Descripción</th>
                  </tr>
                </thead>

                <tbody>
                  {auditoriaUsuarios.map((audit) => (
                    <tr key={audit.IdAuditoria}>
                      <td>{audit.IdAuditoria}</td>
                      <td>{audit.Operacion}</td>
                      <td>{audit.UsernameViejo || 'N/A'}</td>
                      <td>{audit.UsernameNuevo || 'N/A'}</td>
                      <td>{audit.RoleViejo || 'N/A'}</td>
                      <td>{audit.RoleNuevo || 'N/A'}</td>
                      <td>{audit.Description}</td>
                    </tr>
                  ))}

                  {auditoriaUsuarios.length === 0 && (
                    <tr>
                      <td colSpan={7}>No hay auditoría de usuarios.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default AdminDashboard;