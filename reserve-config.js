/*
 * Configuração pública do frontend. apiBaseUrl aponta para a raiz /api
 * do backend; não coloque segredos aqui.
 */
window.UBER_COROATA_CONFIG = window.UBER_COROATA_CONFIG || {};
(() => {
  const config = window.UBER_COROATA_CONFIG;
  const localHosts = new Set(['localhost', '127.0.0.1', '0.0.0.0', '[::1]']);
  const { protocol, hostname, port, origin } = window.location;
  const localApi = window.location.protocol === 'file:'
    ? 'http://127.0.0.1:8787/api'
    : (port === '4173' || (localHosts.has(hostname) && port !== '8787'))
      ? `${protocol}//${hostname}:8787/api`
      : `${origin}/api`;
  const productionApi = 'https://uber-coroata-api.onrender.com/api';
  const isLocal = protocol === 'file:' || localHosts.has(hostname) || port === '4173';

  config.apiBaseUrl = String(config.apiBaseUrl || (isLocal ? localApi : productionApi)).trim().replace(/\/+$/, '');
  config.reserveApiUrl = config.reserveApiUrl || `${config.apiBaseUrl}/reservations`;
  config.reserveRules = Object.assign({
    minimumAdvanceMinutes: 60,
    maximumAdvanceDays: 30,
    serviceStart: '06:00',
    serviceEnd: '22:00',
    timeStepMinutes: 5
  }, config.reserveRules || {});
})();
