const BASE_URL = import.meta.env.VITE_API_URL || '/api';
const TOKEN_STORAGE_KEY = 'agenda_admin_token';
const TRAINER_TOKEN_KEY = 'agenda_trainer_token';
const TRAINER_CODE_KEY = 'agenda_trainer_codigo';

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

export const trainerAuthStorage = {
  // El token del capacitador se persiste en localStorage con expiración de 30 días para conveniencia móvil PWA
  getToken: () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(TRAINER_TOKEN_KEY);
    }
    return null;
  },
  setToken: (token, codigo) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TRAINER_TOKEN_KEY, token);
      if (codigo) localStorage.setItem(TRAINER_CODE_KEY, String(codigo).toUpperCase());
    }
  },
  getCodigo: () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(TRAINER_CODE_KEY);
    }
    return null;
  },
  clearToken: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TRAINER_TOKEN_KEY);
      localStorage.removeItem(TRAINER_CODE_KEY);
    }
  }
};

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const adminToken = authStorage.getToken();
  const trainerToken = trainerAuthStorage.getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  // Inyectar automáticamente credencial de administrador o token firmado de capacitador
  if (adminToken) {
    headers['x-admin-key'] = adminToken;
    headers['Authorization'] = `Bearer ${adminToken}`;
  } else if (trainerToken) {
    headers['Authorization'] = `Bearer ${trainerToken}`;
  }

  const config = {
    headers,
    cache: 'no-store', // Garantiza que los navegadores nunca sirvan respuestas cacheadas de la API
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
  importarLoteCitas: (payload) => request('/citas/importar-lote', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  // Reportes y Analítica
  getResumenMensual: (year, month) => {
    return request(`/reportes/resumen-mensual?year=${year}&month=${month}`);
  },
  getHistorico: () => request('/reportes/historico'),

  // Portal Móvil del Capacitador
  loginTrainer: (codigo, pin) => {
    return request('/portal/login', {
      method: 'POST',
      body: JSON.stringify({ codigo, pin })
    });
  },
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
