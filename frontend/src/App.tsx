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

function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [error, setError] = useState('');

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

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

  const handleLogout = () => {
    setUsuario(null);
    setUsername('');
    setPassword('');
    setError('');
  };

  if (usuario?.Role === 'Admin') {
    return <AdminDashboard username={usuario.Username} onLogout={handleLogout} />;
  }

  if (usuario?.Role === 'Cliente') {
    return <ClientePage usuario={usuario} onLogout={handleLogout} />;
  }

  return (
    <div className="page">
      <div className="card">
        <h1>TecMart</h1>
        <p>Sistema de Punto de Venta</p>

        <form onSubmit={handleLogin}>
          <label>Usuario</label>
          <input
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Ejemplo: admin1"
          />

          <label>Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Ejemplo: 1234"
          />

          {error && <p className="error">{error}</p>}

          <button type="submit">Iniciar sesión</button>
        </form>
      </div>
    </div>
  );
}

export default App;