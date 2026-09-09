const BASE_URL = import.meta.env.VITE_API_URL || '/api';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => ({}));
    
    if (!response.ok) {
      throw new Error(data.message || `Error del servidor (${response.status})`);
    }
    
    return data;
  } catch (error) {
    console.error(`[API Error] ${endpoint}:`, error);
    throw error;
  }
}

export const api = {
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
  createCita: (data) => request('/citas', { method: 'POST', body: JSON.stringify(data) }),
  updateCita: (id, data) => request(`/citas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCita: (id) => request(`/citas/${id}`, { method: 'DELETE' }),

  // Reportes y Analítica
  getResumenMensual: (year, month) => {
    return request(`/reportes/resumen-mensual?year=${year}&month=${month}`);
  },
  getHistorico: () => request('/reportes/historico'),
};
