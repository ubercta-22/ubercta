/*
 * Configuração pública do frontend. apiBaseUrl precisa apontar para a raiz /api
 * do backend; não coloque segredos aqui. Se o backend estiver em outro domínio,
 * use a URL HTTPS pública, por exemplo: https://api.seudominio.com/api
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

  config.apiBaseUrl = String(config.apiBaseUrl || localApi).trim().replace(/\/+$/, '');
  config.reserveApiUrl = config.reserveApiUrl || `${config.apiBaseUrl}/reservations`;
  config.reserveRules = Object.assign({
    minimumAdvanceMinutes: 60,
    maximumAdvanceDays: 30,
    serviceStart: '06:00',
    serviceEnd: '22:00',
    timeStepMinutes: 5
  }, config.reserveRules || {});
})();
