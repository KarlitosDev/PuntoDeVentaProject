import { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import api from '../api/api';

type Producto = {
  IdProducto: number;
  Nombre: string;
  Categoria: string;
  Precio: number;
  Stock: number;
  Icono?: string;
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
  FolioRecibo: string | null;
  EstadoPago: string;
  MetodoPago: string;
};

type DetalleVenta = {
  IdDetalle: number;
  IdVenta: number;
  IdProducto: number;
  Nombre: string;
  Cantidad: number;
  PrecioUnidad: number;
  TotalParcial: number;
};

type VentaDetalleResponse = {
  venta: Venta;
  detalles: DetalleVenta[];
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
  const [ventaSeleccionada, setVentaSeleccionada] = useState<VentaDetalleResponse | null>(null);
  const [busquedaVentas, setBusquedaVentas] = useState('');
  const [busquedaAuditoria, setBusquedaAuditoria] = useState('');
  const [tipoAuditoria, setTipoAuditoria] = useState<'productos' | 'ventas' | 'usuarios'>('productos');
  const [busquedaBilleteras, setBusquedaBilleteras] = useState('');
  const [busquedaMovimientos, setBusquedaMovimientos] = useState('');
  const [busquedaProductos, setBusquedaProductos] = useState('');
  const [categoriaProductoFiltro, setCategoriaProductoFiltro] = useState('Todas');
  const [auditoriaProductos, setAuditoriaProductos] = useState<AuditoriaProducto[]>([]);
  const [auditoriaVentas, setAuditoriaVentas] = useState<AuditoriaVenta[]>([]);
  const [auditoriaUsuarios, setAuditoriaUsuarios] = useState<AuditoriaUsuario[]>([]);

  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState('');
  const [precio, setPrecio] = useState('');
  const [stock, setStock] = useState('');
  const [icono, setIcono] = useState('default.png');
  const [iconosDisponibles, setIconosDisponibles] = useState<string[]>([]);

  const [productoEditando, setProductoEditando] = useState<Producto | null>(null);
  const [editNombre, setEditNombre] = useState('');
  const [editCategoria, setEditCategoria] = useState('');
  const [editPrecio, setEditPrecio] = useState('');
  const [editStock, setEditStock] = useState('');
  const [editIcono, setEditIcono] = useState('default.png');

  const [usernameNuevo, setUsernameNuevo] = useState('');
  const [passwordNuevo, setPasswordNuevo] = useState('');
  const [roleNuevo, setRoleNuevo] = useState<'Admin' | 'Cliente'>('Cliente');

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
    const cargarDatosAsync = async () => {
      await cargarDatos();
      await cargarIconosDisponibles();
    };

    void cargarDatosAsync();
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
        Icono: icono || 'default.png',
      });

      setMensaje('Producto creado correctamente');
      setNombre('');
      setCategoria('');
      setPrecio('');
      setStock('');
      setIcono('default.png');
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
    setEditIcono(producto.Icono || 'default.png');
  };

  const cancelarEdicionProducto = () => {
    setProductoEditando(null);
    setEditNombre('');
    setEditCategoria('');
    setEditPrecio('');
    setEditStock('');
    setEditIcono('default.png');
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
        Icono: editIcono || 'default.png',
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

  const verDetalleVenta = async (idVenta: number) => {
    limpiarMensajes();

    try {
      const response = await api.get(`/ventas/${idVenta}`);
      setVentaSeleccionada(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error cargando detalle de venta');
    }
  };

  const cerrarDetalleVenta = () => {
    setVentaSeleccionada(null);
  };

  const descargarReciboAdminPDF = () => {
    if (!ventaSeleccionada) return;

    const venta = ventaSeleccionada.venta;
    const detalles = ventaSeleccionada.detalles;

    const doc = new jsPDF();

    let y = 18;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('TECMART', 105, y, { align: 'center' });

    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Sistema de Punto de Venta', 105, y, { align: 'center' });

    y += 10;
    doc.line(20, y, 190, y);

    y += 10;
    doc.setFontSize(11);
    doc.text(`Recibo: ${venta.FolioRecibo || 'N/A'}`, 20, y);
    y += 7;
    doc.text(`Venta: #${venta.IdVenta}`, 20, y);
    y += 7;
    doc.text(`Cliente: ${venta.Username}`, 20, y);
    y += 7;
    doc.text(`Id Usuario: ${venta.IdUsuario}`, 20, y);
    y += 7;
    doc.text(`Fecha: ${new Date(venta.FechaVenta).toLocaleString()}`, 20, y);
    y += 7;
    doc.text(`Metodo: ${venta.MetodoPago}`, 20, y);
    y += 7;
    doc.text(`Estado: ${venta.EstadoPago}`, 20, y);

    y += 10;
    doc.line(20, y, 190, y);

    y += 10;
    doc.setFont('helvetica', 'bold');
    doc.text('Producto', 20, y);
    doc.text('Cant.', 125, y);
    doc.text('Subtotal', 155, y);

    y += 6;
    doc.setFont('helvetica', 'normal');

    detalles.forEach((detalle) => {
      if (y > 260) {
        doc.addPage();
        y = 20;
      }

      const nombre =
        detalle.Nombre.length > 32
          ? `${detalle.Nombre.substring(0, 32)}...`
          : detalle.Nombre;

      doc.setFontSize(11);
      doc.text(nombre, 20, y);
      doc.text(String(detalle.Cantidad), 130, y, { align: 'right' });
      doc.text(`$${Number(detalle.TotalParcial).toFixed(2)}`, 180, y, {
        align: 'right',
      });

      y += 6;
      doc.setFontSize(9);
      doc.text(`$${Number(detalle.PrecioUnidad).toFixed(2)} c/u`, 20, y);

      y += 8;
    });

    y += 4;
    doc.line(20, y, 190, y);

    y += 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('TOTAL', 20, y);
    doc.text(`$${Number(venta.TotalVenta).toFixed(2)}`, 180, y, {
      align: 'right',
    });

    y += 14;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Generado desde TecMart Admin Console', 105, y, {
      align: 'center',
    });
    y += 6;
    doc.text('Comprobante administrativo de venta', 105, y, {
      align: 'center',
    });

    const nombreArchivo = `${venta.FolioRecibo || `venta-${venta.IdVenta}`}-admin.pdf`;
    doc.save(nombreArchivo);
  };

  const cargarIconosDisponibles = async () => {
    try {
      const response = await fetch('/product-icons/icons.json');
      const data = await response.json();
      setIconosDisponibles(data);
    } catch {
      setIconosDisponibles(['default.png']);
    }
  };  

  const totalVentas = ventas.reduce((sum, venta) => sum + Number(venta.TotalVenta), 0);
  const clientes = usuarios.filter((usuario) => usuario.Role === 'Cliente');
  const admins = usuarios.filter((usuario) => usuario.Role === 'Admin');
  const productosBajoStock = productos.filter((producto) => producto.Stock <= 5);

  const categoriasProductosAdmin = [
    'Todas',
    ...Array.from(new Set(productos.map((producto) => producto.Categoria))),
  ];

  const productosFiltradosAdmin = productos.filter((producto) => {
    const textoBusqueda = busquedaProductos.toLowerCase();

    const coincideBusqueda =
      String(producto.IdProducto).includes(textoBusqueda) ||
      producto.Nombre.toLowerCase().includes(textoBusqueda) ||
      producto.Categoria.toLowerCase().includes(textoBusqueda) ||
      String(producto.Precio).includes(textoBusqueda) ||
      String(producto.Stock).includes(textoBusqueda) ||
      String(producto.Icono || '').toLowerCase().includes(textoBusqueda);

    const coincideCategoria =
      categoriaProductoFiltro === 'Todas' ||
      producto.Categoria === categoriaProductoFiltro;

    return coincideBusqueda && coincideCategoria;
  });

  const ventasFiltradas = ventas.filter((venta) => {
    const textoBusqueda = busquedaVentas.toLowerCase();

    return (
      String(venta.IdVenta).includes(textoBusqueda) ||
      String(venta.FolioRecibo || '').toLowerCase().includes(textoBusqueda) ||
      venta.Username.toLowerCase().includes(textoBusqueda) ||
      venta.MetodoPago.toLowerCase().includes(textoBusqueda) ||
      venta.EstadoPago.toLowerCase().includes(textoBusqueda) ||
      new Date(venta.FechaVenta).toLocaleString().toLowerCase().includes(textoBusqueda)
    );
  });

  const billeterasFiltradas = billeteras.filter((billetera) => {
    const textoBusqueda = busquedaBilleteras.toLowerCase();

    return (
      String(billetera.IdBilletera).includes(textoBusqueda) ||
      String(billetera.IdUsuario).includes(textoBusqueda) ||
      billetera.Username.toLowerCase().includes(textoBusqueda) ||
      billetera.Role.toLowerCase().includes(textoBusqueda) ||
      String(billetera.Saldo).includes(textoBusqueda) ||
      new Date(billetera.Creado).toLocaleString().toLowerCase().includes(textoBusqueda)
    );
  });

  const movimientosFiltrados = movimientos.filter((movimiento) => {
    const textoBusqueda = busquedaMovimientos.toLowerCase();

    return (
      String(movimiento.IdMovimiento).includes(textoBusqueda) ||
      String(movimiento.IdBilletera).includes(textoBusqueda) ||
      String(movimiento.IdUsuario).includes(textoBusqueda) ||
      movimiento.Username.toLowerCase().includes(textoBusqueda) ||
      movimiento.TipoMovimiento.toLowerCase().includes(textoBusqueda) ||
      String(movimiento.Monto).includes(textoBusqueda) ||
      String(movimiento.SaldoAnterior).includes(textoBusqueda) ||
      String(movimiento.SaldoNuevo).includes(textoBusqueda) ||
      String(movimiento.FolioRecibo || '').toLowerCase().includes(textoBusqueda) ||
      String(movimiento.CambiadoPor || '').toLowerCase().includes(textoBusqueda) ||
      String(movimiento.Description || '').toLowerCase().includes(textoBusqueda) ||
      new Date(movimiento.FechaMovimiento).toLocaleString().toLowerCase().includes(textoBusqueda)
    );
  });

  const auditoriaProductosFiltrada = auditoriaProductos.filter((audit) => {
    const textoBusqueda = busquedaAuditoria.toLowerCase();

    return (
      String(audit.IdAuditoria).includes(textoBusqueda) ||
      String(audit.IdProducto).includes(textoBusqueda) ||
      audit.Operacion.toLowerCase().includes(textoBusqueda) ||
      String(audit.NombreProducto || '').toLowerCase().includes(textoBusqueda) ||
      String(audit.CambiadoPor || '').toLowerCase().includes(textoBusqueda) ||
      String(audit.Description || '').toLowerCase().includes(textoBusqueda)
    );
  });

  const auditoriaVentasFiltrada = auditoriaVentas.filter((audit) => {
    const textoBusqueda = busquedaAuditoria.toLowerCase();

    return (
      String(audit.IdAuditoria).includes(textoBusqueda) ||
      String(audit.IdVenta).includes(textoBusqueda) ||
      String(audit.IdUsuario).includes(textoBusqueda) ||
      String(audit.FolioRecibo || '').toLowerCase().includes(textoBusqueda) ||
      String(audit.MetodoPago || '').toLowerCase().includes(textoBusqueda) ||
      audit.Operacion.toLowerCase().includes(textoBusqueda) ||
      String(audit.CambiadoPor || '').toLowerCase().includes(textoBusqueda) ||
      String(audit.Description || '').toLowerCase().includes(textoBusqueda)
    );
  });

  const auditoriaUsuariosFiltrada = auditoriaUsuarios.filter((audit) => {
    const textoBusqueda = busquedaAuditoria.toLowerCase();

    return (
      String(audit.IdAuditoria).includes(textoBusqueda) ||
      String(audit.IdUsuario).includes(textoBusqueda) ||
      audit.Operacion.toLowerCase().includes(textoBusqueda) ||
      String(audit.UsernameViejo || '').toLowerCase().includes(textoBusqueda) ||
      String(audit.UsernameNuevo || '').toLowerCase().includes(textoBusqueda) ||
      String(audit.RoleViejo || '').toLowerCase().includes(textoBusqueda) ||
      String(audit.RoleNuevo || '').toLowerCase().includes(textoBusqueda) ||
      String(audit.CambiadoPor || '').toLowerCase().includes(textoBusqueda) ||
      String(audit.Description || '').toLowerCase().includes(textoBusqueda)
    );
  });

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

                <select
                  value={icono}
                  onChange={(event) => setIcono(event.target.value)}
                >
                  {iconosDisponibles.map((nombreIcono) => (
                    <option key={nombreIcono} value={nombreIcono}>
                      {nombreIcono}
                    </option>
                  ))}
                </select>                

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

                  <select
                    value={editIcono}
                    onChange={(event) => setEditIcono(event.target.value)}
                  >
                    {iconosDisponibles.map((nombreIcono) => (
                      <option key={nombreIcono} value={nombreIcono}>
                        {nombreIcono}
                      </option>
                    ))}
                  </select>                  

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
              <div className="section-header">
                <div>
                  <h2>Productos registrados</h2>
                  <p>
                    Mostrando {productosFiltradosAdmin.length} de {productos.length} productos.
                  </p>
                </div>

                <div className="admin-product-controls">
                  <select
                    value={categoriaProductoFiltro}
                    onChange={(event) => setCategoriaProductoFiltro(event.target.value)}
                  >
                    {categoriasProductosAdmin.map((categoria) => (
                      <option key={categoria} value={categoria}>
                        {categoria}
                      </option>
                    ))}
                  </select>

                  <input
                    className="search-input"
                    type="text"
                    placeholder="Buscar producto, categoría, precio, stock o icono..."
                    value={busquedaProductos}
                    onChange={(event) => setBusquedaProductos(event.target.value)}
                  />
                </div>
              </div>

              <div className="table-scroll admin-products-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Nombre</th>
                      <th>Categoría</th>
                      <th>Precio</th>
                      <th>Stock</th>
                      <th>Icono</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>

                  <tbody>
                    {productosFiltradosAdmin.map((producto) => (
                      <tr key={producto.IdProducto}>
                        <td>{producto.IdProducto}</td>
                        <td>{producto.Nombre}</td>
                        <td>{producto.Categoria}</td>
                        <td>${Number(producto.Precio).toFixed(2)}</td>
                        <td>{producto.Stock}</td>

                        <td>
                          <div className="admin-icon-preview-cell">
                            <img
                              src={`/product-icons/${producto.Icono || 'default.png'}`}
                              alt={producto.Icono || 'default.png'}
                              onError={(event) => {
                                event.currentTarget.src = '/product-icons/default.png';
                              }}
                            />
                            <span>{producto.Icono || 'default.png'}</span>
                          </div>
                        </td>

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

                    {productosFiltradosAdmin.length === 0 && (
                      <tr>
                        <td colSpan={7}>No se encontraron productos con esa búsqueda.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
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
              <h2>Control de billeteras</h2>
              <p>
                Esta sección permite supervisar saldos y movimientos de billetera.
                Las recargas son realizadas por cada cliente desde su cuenta.
              </p>
            </section>
            
            <section className="panel">
              <div className="section-header">
                <div>
                  <h2>Saldos de clientes</h2>
                  <p>
                    Mostrando {billeterasFiltradas.length} de {billeteras.length} billeteras.
                  </p>
                </div>

                <input
                  className="search-input"
                  type="text"
                  placeholder="Buscar cliente, ID, rol, saldo..."
                  value={busquedaBilleteras}
                  onChange={(event) => setBusquedaBilleteras(event.target.value)}
                />
              </div>

              <div className="table-scroll wallet-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>ID Billetera</th>
                      <th>ID Usuario</th>
                      <th>Cliente</th>
                      <th>Rol</th>
                      <th>Saldo</th>
                      <th>Creado</th>
                    </tr>
                  </thead>

                  <tbody>
                    {billeterasFiltradas.map((billetera) => (
                      <tr key={billetera.IdBilletera}>
                        <td>{billetera.IdBilletera}</td>
                        <td>{billetera.IdUsuario}</td>
                        <td>{billetera.Username}</td>
                        <td>{billetera.Role}</td>
                        <td>${Number(billetera.Saldo).toFixed(2)}</td>
                        <td>{new Date(billetera.Creado).toLocaleString()}</td>
                      </tr>
                    ))}

                    {billeterasFiltradas.length === 0 && (
                      <tr>
                        <td colSpan={6}>No se encontraron billeteras con esa búsqueda.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="panel">
              <div className="section-header">
                <div>
                  <h2>Movimientos de billetera</h2>
                  <p>
                    Mostrando {movimientosFiltrados.length} de {movimientos.length} movimientos.
                  </p>
                </div>

                <input
                  className="search-input"
                  type="text"
                  placeholder="Buscar movimiento, cliente, tipo, recibo..."
                  value={busquedaMovimientos}
                  onChange={(event) => setBusquedaMovimientos(event.target.value)}
                />
              </div>

              <div className="table-scroll wallet-movement-scroll">
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
                      <th>Cambiado por</th>
                      <th>Fecha</th>
                      <th>Descripción</th>
                    </tr>
                  </thead>

                  <tbody>
                    {movimientosFiltrados.map((movimiento) => (
                      <tr key={movimiento.IdMovimiento}>
                        <td>{movimiento.IdMovimiento}</td>
                        <td>{movimiento.Username}</td>
                        <td>{movimiento.TipoMovimiento}</td>
                        <td>${Number(movimiento.Monto).toFixed(2)}</td>
                        <td>${Number(movimiento.SaldoAnterior).toFixed(2)}</td>
                        <td>${Number(movimiento.SaldoNuevo).toFixed(2)}</td>
                        <td>{movimiento.FolioRecibo || 'N/A'}</td>
                        <td>{movimiento.CambiadoPor || 'N/A'}</td>
                        <td>{new Date(movimiento.FechaMovimiento).toLocaleString()}</td>
                        <td>{movimiento.Description || 'N/A'}</td>
                      </tr>
                    ))}

                    {movimientosFiltrados.length === 0 && (
                      <tr>
                        <td colSpan={10}>No se encontraron movimientos con esa búsqueda.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
        
        {activeTab === 'ventas' && (
          <>
            {ventaSeleccionada && (
              <section className="panel receipt-detail-panel">
                <div className="section-header">
                  <div>
                    <h2>Detalle de recibo</h2>
                    <p>
                      Recibo:{' '}
                      <strong>{ventaSeleccionada.venta.FolioRecibo || 'N/A'}</strong>
                    </p>
                  </div>

                  <div className="receipt-actions">
                    <button className="secondary" onClick={descargarReciboAdminPDF}>
                      Descargar PDF
                    </button>

                    <button className="secondary" onClick={cerrarDetalleVenta}>
                      Cerrar detalle
                    </button>
                  </div>
                </div>

                <div className="receipt-summary">
                  <p>
                    <strong>ID Venta:</strong> {ventaSeleccionada.venta.IdVenta}
                  </p>
                  <p>
                    <strong>Cliente:</strong> {ventaSeleccionada.venta.Username}
                  </p>
                  <p>
                    <strong>Método:</strong> {ventaSeleccionada.venta.MetodoPago}
                  </p>
                  <p>
                    <strong>Estado:</strong> {ventaSeleccionada.venta.EstadoPago}
                  </p>
                  <p>
                    <strong>Fecha:</strong>{' '}
                    {new Date(ventaSeleccionada.venta.FechaVenta).toLocaleString()}
                  </p>
                  <p>
                    <strong>Total:</strong> $
                    {Number(ventaSeleccionada.venta.TotalVenta).toFixed(2)}
                  </p>
                </div>

                <div className="table-scroll">
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
                      {ventaSeleccionada.detalles.map((detalle) => (
                        <tr key={detalle.IdDetalle}>
                          <td>{detalle.Nombre}</td>
                          <td>{detalle.Cantidad}</td>
                          <td>${Number(detalle.PrecioUnidad).toFixed(2)}</td>
                          <td>${Number(detalle.TotalParcial).toFixed(2)}</td>
                        </tr>
                      ))}

                      {ventaSeleccionada.detalles.length === 0 && (
                        <tr>
                          <td colSpan={4}>Esta venta no tiene detalles registrados.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            <section className="panel">
              <div className="section-header">
                <div>
                  <h2>Ventas registradas</h2>
                  <p>
                    Mostrando {ventasFiltradas.length} de {ventas.length} ventas.
                  </p>
                </div>

                <input
                  className="search-input"
                  type="text"
                  placeholder="Buscar por cliente, recibo, estado, método o ID..."
                  value={busquedaVentas}
                  onChange={(event) => setBusquedaVentas(event.target.value)}
                />
              </div>

              <div className="table-scroll ventas-scroll">
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
                      <th>Acciones</th>
                    </tr>
                  </thead>

                  <tbody>
                    {ventasFiltradas.map((venta) => (
                      <tr key={venta.IdVenta}>
                        <td>{venta.IdVenta}</td>
                        <td>{venta.FolioRecibo || 'N/A'}</td>
                        <td>{venta.Username}</td>
                        <td>${Number(venta.TotalVenta).toFixed(2)}</td>
                        <td>{venta.MetodoPago}</td>
                        <td>{venta.EstadoPago}</td>
                        <td>{new Date(venta.FechaVenta).toLocaleString()}</td>
                        <td>
                          <button onClick={() => verDetalleVenta(venta.IdVenta)}>
                            Ver detalle
                          </button>
                        </td>
                      </tr>
                    ))}

                    {ventasFiltradas.length === 0 && (
                      <tr>
                        <td colSpan={8}>No se encontraron ventas con esa búsqueda.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
        
        {activeTab === 'auditoria' && (
          <>
            <section className="panel">
              <div className="section-header">
                <div>
                  <h2>Auditoría del sistema</h2>

                  {tipoAuditoria === 'productos' && (
                    <p>
                      Mostrando {auditoriaProductosFiltrada.length} de {auditoriaProductos.length} registros de productos.
                    </p>
                  )}

                  {tipoAuditoria === 'ventas' && (
                    <p>
                      Mostrando {auditoriaVentasFiltrada.length} de {auditoriaVentas.length} registros de ventas.
                    </p>
                  )}

                  {tipoAuditoria === 'usuarios' && (
                    <p>
                      Mostrando {auditoriaUsuariosFiltrada.length} de {auditoriaUsuarios.length} registros de usuarios.
                    </p>
                  )}
                </div>

                <div className="audit-controls">
                  <select
                    value={tipoAuditoria}
                    onChange={(event) =>
                      setTipoAuditoria(event.target.value as 'productos' | 'ventas' | 'usuarios')
                    }
                  >
                    <option value="productos">Productos</option>
                    <option value="ventas">Ventas</option>
                    <option value="usuarios">Usuarios</option>
                  </select>

                  <input
                    className="search-input"
                    type="text"
                    placeholder="Buscar en auditoría..."
                    value={busquedaAuditoria}
                    onChange={(event) => setBusquedaAuditoria(event.target.value)}
                  />
                </div>
              </div>
            </section>

            {tipoAuditoria === 'productos' && (
              <section className="panel">
                <h2>Auditoría de productos</h2>

                <div className="table-scroll audit-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Operación</th>
                        <th>Producto</th>
                        <th>Precio anterior</th>
                        <th>Precio nuevo</th>
                        <th>Stock anterior</th>
                        <th>Stock nuevo</th>
                        <th>Cambiado por</th>
                        <th>Fecha</th>
                        <th>Descripción</th>
                      </tr>
                    </thead>

                    <tbody>
                      {auditoriaProductosFiltrada.map((audit) => (
                        <tr key={audit.IdAuditoria}>
                          <td>{audit.IdAuditoria}</td>
                          <td>{audit.Operacion}</td>
                          <td>{audit.NombreProducto}</td>
                          <td>{audit.PrecioViejo !== null ? `$${Number(audit.PrecioViejo).toFixed(2)}` : 'N/A'}</td>
                          <td>{audit.PrecioNuevo !== null ? `$${Number(audit.PrecioNuevo).toFixed(2)}` : 'N/A'}</td>
                          <td>{audit.StockViejo ?? 'N/A'}</td>
                          <td>{audit.StockNuevo ?? 'N/A'}</td>
                          <td>{audit.CambiadoPor}</td>
                          <td>{new Date(audit.Cambiado).toLocaleString()}</td>
                          <td>{audit.Description}</td>
                        </tr>
                      ))}

                      {auditoriaProductosFiltrada.length === 0 && (
                        <tr>
                          <td colSpan={10}>No se encontraron registros de auditoría de productos.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {tipoAuditoria === 'ventas' && (
              <section className="panel">
                <h2>Auditoría de ventas</h2>

                <div className="table-scroll audit-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Operación</th>
                        <th>Venta</th>
                        <th>Usuario</th>
                        <th>Recibo</th>
                        <th>Total</th>
                        <th>Método</th>
                        <th>Cambiado por</th>
                        <th>Fecha</th>
                        <th>Descripción</th>
                      </tr>
                    </thead>

                    <tbody>
                      {auditoriaVentasFiltrada.map((audit) => (
                        <tr key={audit.IdAuditoria}>
                          <td>{audit.IdAuditoria}</td>
                          <td>{audit.Operacion}</td>
                          <td>{audit.IdVenta}</td>
                          <td>{audit.IdUsuario}</td>
                          <td>{audit.FolioRecibo || 'N/A'}</td>
                          <td>${Number(audit.TotalVenta || 0).toFixed(2)}</td>
                          <td>{audit.MetodoPago || 'N/A'}</td>
                          <td>{audit.CambiadoPor}</td>
                          <td>{new Date(audit.Cambiado).toLocaleString()}</td>
                          <td>{audit.Description}</td>
                        </tr>
                      ))}

                      {auditoriaVentasFiltrada.length === 0 && (
                        <tr>
                          <td colSpan={10}>No se encontraron registros de auditoría de ventas.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {tipoAuditoria === 'usuarios' && (
              <section className="panel">
                <h2>Auditoría de usuarios</h2>

                <div className="table-scroll audit-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Operación</th>
                        <th>ID Usuario</th>
                        <th>Usuario anterior</th>
                        <th>Usuario nuevo</th>
                        <th>Rol anterior</th>
                        <th>Rol nuevo</th>
                        <th>Password cambiado</th>
                        <th>Cambiado por</th>
                        <th>Fecha</th>
                        <th>Descripción</th>
                      </tr>
                    </thead>

                    <tbody>
                      {auditoriaUsuariosFiltrada.map((audit) => (
                        <tr key={audit.IdAuditoria}>
                          <td>{audit.IdAuditoria}</td>
                          <td>{audit.Operacion}</td>
                          <td>{audit.IdUsuario}</td>
                          <td>{audit.UsernameViejo || 'N/A'}</td>
                          <td>{audit.UsernameNuevo || 'N/A'}</td>
                          <td>{audit.RoleViejo || 'N/A'}</td>
                          <td>{audit.RoleNuevo || 'N/A'}</td>
                          <td>{audit.PasswordCambiado ? 'Sí' : 'No'}</td>
                          <td>{audit.CambiadoPor}</td>
                          <td>{new Date(audit.Cambiado).toLocaleString()}</td>
                          <td>{audit.Description}</td>
                        </tr>
                      ))}

                      {auditoriaUsuariosFiltrada.length === 0 && (
                        <tr>
                          <td colSpan={11}>No se encontraron registros de auditoría de usuarios.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </>
        )}

      </main>
    </div>
  );
}

export default AdminDashboard;