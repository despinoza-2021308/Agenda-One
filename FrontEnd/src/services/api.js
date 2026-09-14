const BASE_URL = import.meta.env.VITE_API_URL || '/api';
const TOKEN_STORAGE_KEY = 'agenda_admin_token';

export const authStorage = {
  // El token de administrador NUNCA se persiste en localStorage.
  // Solo se mantiene en sessionStorage durante la pestaña activa y se destruye automáticamente al salir o cerrar la agenda.
  getToken: () => {
    if (typeof window !== 'undefined') {
      if (localStorage.getItem(TOKEN_STORAGE_KEY)) {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      }
      return sessionStorage.getItem(TOKEN_STORAGE_KEY);
    }
    return null;
  },
  setToken: (token) => {
    if (typeof window !== 'undefined') {
      // Eliminar cualquier persistencia en localStorage
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      // Guardar únicamente en sessionStorage (volátil, expira al cerrar la pestaña o el navegador)
      sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
    }
  },
  clearToken: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  }
};

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const token = authStorage.getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  // Inyectar automáticamente credencial de administrador si existe sesión activa
  if (token) {
    headers['x-admin-key'] = token;
  }

  const config = {
    headers,
    ...options
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => ({}));
    
    if (!response.ok) {
      const err = new Error(data.message || `Error del servidor (${response.status})`);
      err.status = response.status;
      err.unauthorized = data.unauthorized || response.status === 401;
      throw err;
    }
    
    return data;
  } catch (error) {
    console.error(`[API Error] ${endpoint}:`, error);
    throw error;
  }
}

export const api = {
  // Autenticación de Administrador
  loginAdmin: (pin) => request('/auth/login', { method: 'POST', body: JSON.stringify({ pin }) }),
  verifyAdmin: () => request('/auth/check'),

  // Capacitadores
  getCapacitadores: () => request('/capacitadores'),
  createCapacitador: (data) => request('/capacitadores', { method: 'POST', body: JSON.stringify(data) }),
  updateCapacitador: (id, data) => request(`/capacitadores/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCapacitador: (id) => request(`/capacitadores/${id}`, { method: 'DELETE' }),

  // Clientes
  getClientes: () => request('/clientes'),
  createCliente: (data) => request('/clientes', { method: 'POST', body: JSON.stringify(data) }),
  updateCliente: (id, data) => request(`/clientes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCliente: (id) => request(`/clientes/${id}`, { method: 'DELETE' }),

  // Citas
  getCitas: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, value);
      }
    });
    const qs = query.toString();
    return request(`/citas${qs ? `?${qs}` : ''}`);
  },
  getCitaById: (id) => request(`/citas/${id}`),
  getCitaAuditoria: (id) => request(`/citas/${id}/auditoria`),
  createCita: (data) => request('/citas', { method: 'POST', body: JSON.stringify(data) }),
  updateCita: (id, data) => request(`/citas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCita: (id) => request(`/citas/${id}`, { method: 'DELETE' }),

  // Reportes y Analítica
  getResumenMensual: (year, month) => {
    return request(`/reportes/resumen-mensual?year=${year}&month=${month}`);
  },
  getHistorico: () => request('/reportes/historico'),

  // Portal Móvil del Capacitador
  getTrainerPortal: (codigo, params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, value);
      }
    });
    const qs = query.toString();
    return request(`/portal/${encodeURIComponent(codigo)}${qs ? `?${qs}` : ''}`);
  },
  updateTrainerCita: (codigo, id, data) => {
    return request(`/portal/${encodeURIComponent(codigo)}/citas/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }
};
