import { useState } from 'react';
import api from './api/api';
import AdminDashboard from './pages/AdminDashboard';
import ClientePage from './pages/ClientePage';
import './App.css';

type Usuario = {
  IdUsuario: number;
  Username: string;
  Role: 'Admin' | 'Cliente';
};

type AuthMode = 'login' | 'register';

function App() {
  const [authMode, setAuthMode] = useState<AuthMode>('login');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  const [nuevoUsername, setNuevoUsername] = useState('');
  const [nuevoPassword, setNuevoPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');

  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  const limpiarMensajes = () => {
    setError('');
    setMensaje('');
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    limpiarMensajes();

    if (!username.trim() || !password.trim()) {
      setError('Ingresa usuario y contraseña');
      return;
    }

    try {
      const response = await api.post('/auth/login', {
        Username: username,
        Password: password,
      });

      setUsuario(response.data.usuario);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error iniciando sesión');
    }
  };

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    limpiarMensajes();

    if (!nuevoUsername.trim() || !nuevoPassword.trim()) {
      setError('Ingresa un usuario y contraseña');
      return;
    }

    if (nuevoPassword !== confirmarPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    try {
      await api.post('/auth/register', {
        Username: nuevoUsername,
        Password: nuevoPassword,
        Role: 'Cliente',
      });

      setMensaje('Cuenta creada correctamente. Ahora puedes iniciar sesión.');
      setAuthMode('login');
      setUsername(nuevoUsername);
      setPassword('');

      setNuevoUsername('');
      setNuevoPassword('');
      setConfirmarPassword('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error creando cuenta');
    }
  };

  const handleLogout = () => {
    setUsuario(null);
    setUsername('');
    setPassword('');
    setError('');
    setMensaje('');
    setAuthMode('login');
  };

  if (usuario?.Role === 'Admin') {
    return <AdminDashboard username={usuario.Username} onLogout={handleLogout} />;
  }

  if (usuario?.Role === 'Cliente') {
    return <ClientePage usuario={usuario} onLogout={handleLogout} />;
  }

  return (
    <div className="auth-page">
      <section className="auth-hero-panel">
        <div className="auth-brand-row">
          <div className="auth-logo">TM</div>
          <div>
            <h1>TecMart</h1>
            <p>Plataforma de Punto de Venta</p>
          </div>
        </div>

        <div className="auth-hero-content">
          <span className="auth-label">Sistema corporativo</span>

          <h2>Administra ventas, productos, billeteras y recibos desde una sola plataforma.</h2>

          <p>
            TecMart integra una experiencia de compra para clientes con una consola
            administrativa profesional para controlar inventario, auditoría y movimientos.
          </p>

          <div className="auth-feature-grid">
            <div>
              <strong>PDV</strong>
              <span>Compras y recibos</span>
            </div>

            <div>
              <strong>Wallet</strong>
              <span>Saldo digital</span>
            </div>

            <div>
              <strong>Admin</strong>
              <span>Control y auditoría</span>
            </div>
          </div>
        </div>
      </section>

      <section className="auth-form-panel">
        <div className="auth-card">
          <div className="auth-tabs">
            <button
              className={authMode === 'login' ? 'active' : ''}
              onClick={() => {
                setAuthMode('login');
                limpiarMensajes();
              }}
            >
              Iniciar sesión
            </button>

            <button
              className={authMode === 'register' ? 'active' : ''}
              onClick={() => {
                setAuthMode('register');
                limpiarMensajes();
              }}
            >
              Crear cuenta
            </button>
          </div>

          {authMode === 'login' && (
            <>
              <div className="auth-card-header">
                <h2>Bienvenido de nuevo</h2>
                <p>Accede como cliente o administrador.</p>
              </div>

              <form onSubmit={handleLogin} className="auth-form">
                <label>Usuario</label>
                <input
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Ejemplo: cliente1"
                />

                <label>Contraseña</label>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Ingresa tu contraseña"
                />

                {mensaje && <p className="auth-success">{mensaje}</p>}
                {error && <p className="auth-error">{error}</p>}

                <button type="submit" className="auth-primary-button">
                  Entrar a TecMart
                </button>
              </form>

              <div className="auth-help-box">
                <strong>Acceso seguro</strong>
                <p>Ingresa con tu cuenta asignada o crea una cuenta de cliente para comenzar.</p>
              </div>
            </>
          )}

          {authMode === 'register' && (
            <>
              <div className="auth-card-header">
                <h2>Crear cuenta de cliente</h2>
                <p>Regístrate para comprar, recargar saldo y consultar tus pedidos.</p>
              </div>

              <form onSubmit={handleRegister} className="auth-form">
                <label>Nuevo usuario</label>
                <input
                  type="text"
                  value={nuevoUsername}
                  onChange={(event) => setNuevoUsername(event.target.value)}
                  placeholder="Ejemplo: karlitos"
                />

                <label>Contraseña</label>
                <input
                  type="password"
                  value={nuevoPassword}
                  onChange={(event) => setNuevoPassword(event.target.value)}
                  placeholder="Crea una contraseña"
                />

                <label>Confirmar contraseña</label>
                <input
                  type="password"
                  value={confirmarPassword}
                  onChange={(event) => setConfirmarPassword(event.target.value)}
                  placeholder="Repite la contraseña"
                />

                {mensaje && <p className="auth-success">{mensaje}</p>}
                {error && <p className="auth-error">{error}</p>}

                <button type="submit" className="auth-primary-button">
                  Crear cuenta
                </button>
              </form>

              <div className="auth-help-box">
                <strong>Tipo de cuenta</strong>
                <p>Las cuentas creadas desde esta pantalla se registran como Cliente.</p>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

export default App;