(() => {
  'use strict';

  const appConfig = window.UBER_COROATA_CONFIG || (window.UBER_COROATA_CONFIG = {});
  const localHosts = new Set(['localhost', '127.0.0.1', '0.0.0.0', '[::1]']);
  const defaultApiBase = (() => {
    if (window.location.protocol === 'file:') return 'http://127.0.0.1:8787/api';
    const { protocol, hostname, port, origin } = window.location;
    // No desenvolvimento, o frontend é servido em 4173 e o backend em 8787.
    if (port === '4173' || (localHosts.has(hostname) && port !== '8787')) {
      return `${protocol}//${hostname}:8787/api`;
    }
    // Em produção, o padrão é /api no mesmo domínio; para backend separado,
    // configure apiBaseUrl em reserve-config.js com a URL HTTPS pública.
    return `${origin}/api`;
  })();
  const base = String(appConfig.apiBaseUrl || defaultApiBase).trim().replace(/\/+$/, '');
  const tokenKey = 'uber-coroata-auth-token';
  const getToken = () => localStorage.getItem(tokenKey) || '';
  const setToken = token => token ? localStorage.setItem(tokenKey, token) : localStorage.removeItem(tokenKey);

  async function request(path, options = {}) {
    const headers = { ...(options.headers || {}) };
    if (options.body !== undefined && !Object.keys(headers).some(key => key.toLowerCase() === 'content-type')) {
      headers['Content-Type'] = 'application/json';
    }
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    let response;
    try {
      response = await fetch(`${base}${path}`, { ...options, headers });
    } catch (error) {
      throw new Error(`Não foi possível acessar o backend em ${base}. Verifique se o servidor está ativo, se apiBaseUrl está correto e se o CORS permite este site.`);
    }

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 405) {
        throw new Error(`O servidor do site recusou o cadastro (HTTP 405). A API está apontando para o servidor errado. Configure apiBaseUrl para o backend (${base}).`);
      }
      const messages = {
        invalid_registration: 'Confira os dados do cadastro e tente novamente.',
        invalid_login: 'Confira o e-mail/número e a senha.',
        email_or_phone_already_registered: 'Este e-mail ou telefone já está cadastrado.',
        invalid_credentials: 'E-mail/número ou senha incorretos.',
        route_not_found: 'A rota não existe no backend configurado. Confira apiBaseUrl.',
        internal_error: 'O backend encontrou um erro interno. Confira os logs do servidor.'
      };
      throw new Error(messages[data.error] || data.message || data.error || `Erro do servidor (${response.status}).`);
    }
    return data;
  }

  window.uberApi = {
    get token() { return getToken(); },
    setToken,
    get baseUrl() { return base; },
    register: async data => {
      const result = await request('/auth/register', { method: 'POST', body: JSON.stringify(data) });
      setToken(result.token);
      return result;
    },
    login: async data => {
      const result = await request('/auth/login', { method: 'POST', body: JSON.stringify(data) });
      setToken(result.token);
      return result;
    },
    me: () => request('/me'),
    createTrip: data => request('/trips', { method: 'POST', body: JSON.stringify(data) }),
    createReservation: (data, idempotencyKey) => request('/reservations', { method: 'POST', headers: { 'Idempotency-Key': idempotencyKey }, body: JSON.stringify(data) }),
    createPaymentPreference: reservationId => request('/payments/mercadopago/preference', { method: 'POST', body: JSON.stringify({ reservationId }) })
  };
})();
