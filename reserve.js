(() => {
  'use strict';
  const flow = document.querySelector('#reserve-flow');
  if (!flow) return;

  const config = window.UBER_COROATA_CONFIG || {};
  const rules = config.reserveRules || {};
  const minAdvanceMinutes = Math.max(0, Number(rules.minimumAdvanceMinutes ?? 60));
  const maxAdvanceDays = Math.max(1, Number(rules.maximumAdvanceDays ?? 30));
  const serviceStart = rules.serviceStart || '06:00';
  const serviceEnd = rules.serviceEnd || '22:00';
  const timeStepMinutes = Math.max(1, Number(rules.timeStepMinutes ?? 5));
  const stages = [...flow.querySelectorAll('[data-reserve-step]')];
  const progress = [...flow.querySelectorAll('[data-reserve-indicator]')];
  const state = {
    step: 1,
    origin: null,
    destination: null,
    date: '',
    time: '',
    vehicle: null,
    paymentMethod: 'Pix',
    idempotencyKey: '',
    submitting: false,
    serverReservation: null
  };
  const vehicleNames = {
    economico: 'Carro Econômico', comfort: 'Carro Comfort', black: 'Carro Black',
    xl: 'Carro XL', moto: 'Moto'
  };
  const pointAt = { origin: null, destination: null };
  const searchTimers = { origin: 0, destination: 0 };
  const searchControllers = { origin: null, destination: null };
  const resultSets = { origin: [], destination: [] };
  const inputs = {
    origin: flow.querySelector('[data-reserve-input="origin"]'),
    destination: flow.querySelector('[data-reserve-input="destination"]')
  };
  const dateInput = flow.querySelector('[data-reserve-date]');
  const timeInput = flow.querySelector('[data-reserve-time]');
  const routeButton = flow.querySelector('[data-reserve-next="route"]');
  const vehicleButton = flow.querySelector('[data-reserve-next="vehicle"]');
  const confirmButton = flow.querySelector('[data-reserve-confirm]');
  const paymentInput = flow.querySelector('[data-reserve-payment]');
  const cityCenter = [-4.1347, -44.1244];
  let map;
  let mapPicking = '';

  const safeIcons = () => { if (window.lucide) window.lucide.createIcons({ attrs: { 'aria-hidden': 'true' } }); };
  const message = (key, text = '', isError = false) => {
    const el = flow.querySelector(`[data-reserve-message="${key}"]`);
    if (!el) return;
    el.textContent = text;
    el.classList.toggle('is-error', Boolean(text && isError));
    el.classList.toggle('is-success', Boolean(text && !isError));
  };
  const localDate = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const addDays = (date, days) => { const next = new Date(date); next.setDate(next.getDate() + days); return next; };
  const dateLabel = value => value ? new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';
  const placeLabel = item => item?.name || item?.display_name?.split(',')[0] || item?.address?.road || item?.address?.pedestrian || item?.address?.neighbourhood || item?.address?.suburb || item?.address?.town || item?.address?.city || 'Local selecionado';
  const fullPlaceLabel = item => item?.display_name || placeLabel(item);
  const uuid = () => window.crypto?.randomUUID ? window.crypto.randomUUID() : `reserve-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const escapeText = value => String(value ?? '');

  function setStage(step) {
    state.step = step;
    stages.forEach(stage => { stage.hidden = Number(stage.dataset.reserveStep) !== step; });
    progress.forEach(item => {
      const number = Number(item.dataset.reserveIndicator);
      item.classList.toggle('is-active', number === step);
      item.classList.toggle('is-done', number < step);
    });
    message('route'); message('schedule'); message('vehicle'); message('confirm');
    if (step === 2) refreshDateLimits();
    if (step === 3) renderTripSummary();
    if (step === 4) renderReview();
    flow.scrollTo({ top: 0, behavior: 'smooth' });
    safeIcons();
  }

  function openFlow() {
    state.step = 1;
    flow.hidden = false;
    document.querySelector('.app-home')?.classList.add('is-reserving');
    setStage(1);
    initMap();
    window.setTimeout(() => map?.resize(), 120);
    inputs.origin.focus({ preventScroll: true });
  }
  function closeFlow() {
    flow.hidden = true;
    document.querySelector('.app-home')?.classList.remove('is-reserving');
    mapPicking = '';
  }
  window.openReserveFlow = openFlow;
  window.closeReserveFlow = closeFlow;

  function initMap() {
    const hint = flow.querySelector('[data-reserve-map-hint]');
    if (map) { window.setTimeout(() => map.resize(), 80); return; }
    if (!window.maplibregl) {
      hint.textContent = 'O mapa não carregou. A pesquisa de endereços ainda pode ser usada.';
      return;
    }
    try {
      map = new window.maplibregl.Map({ container: 'reserve-map', style: 'https://tiles.openfreemap.org/styles/positron', center: [cityCenter[1], cityCenter[0]], zoom: 13, attributionControl: true });
      map.addControl(new window.maplibregl.NavigationControl({ showCompass: false }), 'top-right');
      map.on('click', event => {
        if (!mapPicking) return;
        const kind = mapPicking;
        mapPicking = '';
        flow.querySelectorAll('[data-reserve-map-pick]').forEach(button => button.classList.remove('is-active'));
        flow.querySelector('[data-reserve-map-hint]').textContent = 'Localização selecionada no mapa; consultando o endereço…';
        reverseGeocode(kind, [event.lngLat.lat, event.lngLat.lng]);
      });
      map.on('load', () => { hint.textContent = 'Toque em Origem ou Destino acima e depois marque o ponto exato no mapa.'; });
      map.on('error', event => { if (event.error && !map.isStyleLoaded()) hint.textContent = 'Não foi possível carregar o mapa agora. A busca de endereços continua disponível.'; });
      hint.textContent = 'Carregando mapa…';
    } catch (error) {
      hint.textContent = 'Não foi possível abrir o mapa. Pesquise os endereços nos campos acima.';
    }
  }

  function drawMarker(kind, coords) {
    if (!map || !window.maplibregl) return;
    if (pointAt[kind]) pointAt[kind].remove();
    const color = kind === 'origin' ? '#08a957' : '#ed711c';
    const icon = document.createElement('span'); icon.className = 'reserve-marker';
    const pin = document.createElement('span'); pin.style.setProperty('--marker-color', color); icon.append(pin);
    pointAt[kind] = new window.maplibregl.Marker({ element: icon, anchor: 'center' }).setLngLat([coords[1], coords[0]]).addTo(map);
    if (state.origin && state.destination) {
      const bounds = new window.maplibregl.LngLatBounds();
      bounds.extend([state.origin.coords[1], state.origin.coords[0]]);
      bounds.extend([state.destination.coords[1], state.destination.coords[0]]);
      map.fitBounds(bounds, { padding: { top: 32, right: 32, bottom: 32, left: 32 }, maxZoom: 14 });
    } else map.easeTo({ center: [coords[1], coords[0]], zoom: 15 });
  }

  function choosePlace(kind, item, coords) {
    const [lat, lon] = coords.map(Number);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
    const label = fullPlaceLabel(item);
    state[kind] = { label, coords: [lat, lon] };
    inputs[kind].value = label;
    flow.querySelector(`[data-reserve-suggestions="${kind}"]`).replaceChildren();
    drawMarker(kind, [lat, lon]);
    routeButton.disabled = !(state.origin && state.destination);
    flow.querySelector('[data-reserve-map-hint]').textContent = `${kind === 'origin' ? 'Origem' : 'Destino'} selecionado: ${placeLabel(item)}.`;
    message('route');
  }

  async function searchAddress(kind, query) {
    const box = flow.querySelector(`[data-reserve-suggestions="${kind}"]`);
    if (searchControllers[kind]) searchControllers[kind].abort();
    const controller = new AbortController();
    searchControllers[kind] = controller;
    box.textContent = 'Buscando endereços reais em Coroatá…';
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5&countrycodes=br&q=${encodeURIComponent(`${query}, Coroatá, Maranhão, Brasil}`)}`;
      const response = await fetch(url, { signal: controller.signal, headers: { 'Accept-Language': 'pt-BR' } });
      if (!response.ok) throw new Error('Busca indisponível');
      const results = await response.json();
      resultSets[kind] = Array.isArray(results) ? results : [];
      box.replaceChildren();
      if (!resultSets[kind].length) { box.textContent = 'Nenhum endereço encontrado. Tente outro nome ou endereço.'; return; }
      resultSets[kind].forEach((item, index) => {
        const button = document.createElement('button');
        button.type = 'button'; button.className = 'reserve-suggestion'; button.setAttribute('role', 'option');
        const strong = document.createElement('strong'); strong.textContent = placeLabel(item);
        const small = document.createElement('small'); small.textContent = fullPlaceLabel(item);
        button.append(strong, small);
        button.addEventListener('click', () => choosePlace(kind, item, [item.lat, item.lon]));
        box.append(button);
      });
    } catch (error) {
      if (error.name === 'AbortError') return;
      box.textContent = 'Não foi possível consultar endereços agora. Verifique a conexão e tente novamente.';
    }
  }

  async function reverseGeocode(kind, coords) {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords[0]}&lon=${coords[1]}&zoom=18&addressdetails=1`;
      const response = await fetch(url, { headers: { 'Accept-Language': 'pt-BR' } });
      if (!response.ok) throw new Error('Consulta indisponível');
      const item = await response.json();
      if (!item?.display_name) throw new Error('Endereço indisponível');
      choosePlace(kind, item, coords);
    } catch (error) {
      flow.querySelector('[data-reserve-map-hint]').textContent = 'Não foi possível identificar o endereço desse ponto. Escolha outro local ou pesquise pelo nome.';
    }
  }

  for (const kind of ['origin', 'destination']) {
    inputs[kind].addEventListener('input', () => {
      const value = inputs[kind].value.trim();
      if (state[kind]?.label !== value) {
        state[kind] = null;
        if (pointAt[kind]) { pointAt[kind].remove(); pointAt[kind] = null; }
      }
      routeButton.disabled = !(state.origin && state.destination);
      if (searchTimers[kind]) window.clearTimeout(searchTimers[kind]);
      if (value.length < 3) { flow.querySelector(`[data-reserve-suggestions="${kind}"]`).replaceChildren(); return; }
      searchTimers[kind] = window.setTimeout(() => searchAddress(kind, value), 900);
    });
  }

  flow.querySelector('[data-reserve-current]').addEventListener('click', () => {
    const hint = flow.querySelector('[data-reserve-map-hint]');
    if (!navigator.geolocation) { message('route', 'Este navegador não permite acessar o GPS. Pesquise a origem pelo endereço.', true); return; }
    message('route', 'Solicitando permissão para acessar a localização…');
    navigator.geolocation.getCurrentPosition(async position => {
      message('route');
      hint.textContent = 'Localização recebida; consultando o endereço real…';
      await reverseGeocode('origin', [position.coords.latitude, position.coords.longitude]);
    }, () => message('route', 'Não foi possível acessar sua localização. Permita o GPS ou pesquise a origem.', true), { enableHighAccuracy: true, timeout: 12000, maximumAge: 30000 });
  });

  flow.querySelectorAll('[data-reserve-map-pick]').forEach(button => button.addEventListener('click', () => {
    if (!map) { initMap(); if (!map) { message('route', 'O mapa está indisponível agora. Pesquise o endereço nos campos.', true); return; } }
    mapPicking = button.dataset.reserveMapPick;
    flow.querySelectorAll('[data-reserve-map-pick]').forEach(item => item.classList.toggle('is-active', item === button));
    flow.querySelector('[data-reserve-map-hint]').textContent = `Toque no mapa para escolher a ${mapPicking === 'origin' ? 'origem' : 'destino'}.`;
    map.resize();
  }));

  function refreshDateLimits() {
    const now = new Date();
    dateInput.min = localDate(now);
    dateInput.max = localDate(addDays(now, maxAdvanceDays));
    const selected = dateInput.value;
    const earliest = new Date(Date.now() + minAdvanceMinutes * 60000);
    earliest.setMinutes(Math.ceil(earliest.getMinutes() / timeStepMinutes) * timeStepMinutes, 0, 0);
    const earliestTime = `${String(earliest.getHours()).padStart(2, '0')}:${String(earliest.getMinutes()).padStart(2, '0')}`;
    timeInput.min = selected === localDate(now) && earliestTime > serviceStart ? earliestTime : serviceStart;
    timeInput.max = serviceEnd;
    timeInput.step = String(timeStepMinutes * 60);
    flow.querySelector('[data-reserve-date-hint]').textContent = `Regras de demonstração configuráveis: mínimo de ${minAdvanceMinutes} min de antecedência, até ${maxAdvanceDays} dias e horário entre ${serviceStart} e ${serviceEnd}. A operação real ainda precisa validar disponibilidade.`;
  }

  function validSchedule() {
    const value = `${dateInput.value}T${timeInput.value}`;
    if (!dateInput.value || !timeInput.value) return 'Selecione a data e o horário da reserva.';
    const selected = new Date(value);
    const now = new Date();
    const latest = addDays(now, maxAdvanceDays);
    if (Number.isNaN(selected.getTime()) || selected <= now) return 'A data e o horário precisam estar no futuro.';
    if (selected.getTime() < now.getTime() + minAdvanceMinutes * 60000) return `Escolha um horário com pelo menos ${minAdvanceMinutes} minutos de antecedência.`;
    if (selected > latest) return `A reserva deve ocorrer dentro dos próximos ${maxAdvanceDays} dias.`;
    if (timeInput.value < serviceStart || timeInput.value > serviceEnd) return `Selecione um horário entre ${serviceStart} e ${serviceEnd}.`;
    return '';
  }
  dateInput.addEventListener('change', refreshDateLimits);
  timeInput.addEventListener('change', refreshDateLimits);
  flow.querySelector('[data-reserve-next="route"]').addEventListener('click', () => {
    if (!state.origin || !state.destination) { message('route', 'Escolha uma origem e um destino confirmados pela busca ou pelo mapa.', true); return; }
    const [latA, lonA] = state.origin.coords;
    const [latB, lonB] = state.destination.coords;
    if (Math.abs(latA - latB) < 0.00005 && Math.abs(lonA - lonB) < 0.00005) { message('route', 'Origem e destino precisam ser locais diferentes.', true); return; }
    setStage(2);
  });
  flow.querySelector('[data-reserve-next="schedule"]').addEventListener('click', () => {
    const problem = validSchedule();
    if (problem) { message('schedule', problem, true); return; }
    state.date = dateInput.value; state.time = timeInput.value; setStage(3);
  });

  function renderTripSummary() {
    const target = flow.querySelector('[data-reserve-trip-summary]');
    target.replaceChildren();
    const p = document.createElement('p'); p.textContent = `${placeLabel({ display_name: state.origin?.label })} → ${placeLabel({ display_name: state.destination?.label })}`;
    const small = document.createElement('small'); small.textContent = `${dateLabel(state.date)} · ${state.time || ''}`;
    target.append(p, small);
  }
  flow.querySelectorAll('[data-reserve-vehicle]').forEach(button => button.addEventListener('click', () => {
    state.vehicle = button.dataset.reserveVehicle;
    flow.querySelectorAll('[data-reserve-vehicle]').forEach(item => {
      const selected = item === button;
      item.classList.toggle('is-selected', selected); item.setAttribute('aria-checked', String(selected));
    });
    vehicleButton.disabled = false;
  }));
  flow.querySelector('[data-reserve-next="vehicle"]').addEventListener('click', () => {
    if (!state.vehicle) { message('vehicle', 'Selecione uma categoria de veículo para continuar.', true); return; }
    setStage(4);
  });

  function addReviewRow(container, label, value) {
    const row = document.createElement('div'); row.className = 'reserve-review-row';
    const key = document.createElement('span'); key.textContent = label;
    const val = document.createElement('strong'); val.textContent = escapeText(value);
    row.append(key, val); container.append(row);
  }
  function renderReview() {
    const target = flow.querySelector('[data-reserve-review]'); target.replaceChildren();
    addReviewRow(target, 'Origem', state.origin?.label || '—');
    addReviewRow(target, 'Destino', state.destination?.label || '—');
    addReviewRow(target, 'Data', dateLabel(state.date));
    addReviewRow(target, 'Horário', state.time || '—');
    addReviewRow(target, 'Veículo', vehicleNames[state.vehicle] || '—');
    addReviewRow(target, 'Pagamento', state.paymentMethod);
    addReviewRow(target, 'Tarifa', 'A consultar pelo sistema; ainda indisponível');
  }

  flow.querySelectorAll('[data-reserve-back]').forEach(button => button.addEventListener('click', () => {
    if (state.step > 1 && state.step <= 4) setStage(state.step - 1);
    else closeFlow();
  }));
  flow.querySelectorAll('[data-reserve-close]').forEach(button => button.addEventListener('click', closeFlow));
  paymentInput?.addEventListener('change', () => { state.paymentMethod = paymentInput.value; if (state.step === 4) renderReview(); });

  function renderConfirmation(reservationId, status) {
    state.serverReservation = { reservationId, status };
    const target = flow.querySelector('[data-reserve-confirmation]'); target.replaceChildren();
    addReviewRow(target, 'Código da reserva', reservationId);
    addReviewRow(target, 'Situação informada pelo serviço', status);
    addReviewRow(target, 'Origem', state.origin.label);
    addReviewRow(target, 'Destino', state.destination.label);
    addReviewRow(target, 'Data e horário', `${dateLabel(state.date)} · ${state.time}`);
    addReviewRow(target, 'Categoria', vehicleNames[state.vehicle]);
    setStage(5);
  }

  confirmButton.addEventListener('click', async () => {
    if (state.submitting) return;
    const endpoint = String(config.reserveApiUrl || '').trim();
    if (!endpoint) {
      message('confirm', 'Backend de reservas não configurado. Nenhuma reserva foi registrada. Configure reserveApiUrl no arquivo reserve-config.js; seus dados ficaram preservados.', true);
      return;
    }
    if (!state.idempotencyKey) state.idempotencyKey = uuid();
    state.submitting = true; confirmButton.disabled = true; confirmButton.textContent = 'Enviando para validação…';
    message('confirm', 'Enviando a solicitação ao serviço de reservas…');
    const payload = {
      origin: { address: state.origin.label, latitude: state.origin.coords[0], longitude: state.origin.coords[1] },
      destination: { address: state.destination.label, latitude: state.destination.coords[0], longitude: state.destination.coords[1] },
      scheduledAt: new Date(`${state.date}T${state.time}:00`).toISOString(), vehicleCategory: state.vehicle,
      paymentMethod: state.paymentMethod,
      idempotencyKey: state.idempotencyKey
    };
    try {
      const token = window.uberApi?.token || '';
      const response = await fetch(endpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': state.idempotencyKey, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(payload)
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || `O serviço respondeu com erro ${response.status}.`);
      const id = data.reservationId || data.id || data.reservation?.id;
      const status = data.status || data.reservation?.status;
      if (!id || !status) throw new Error('O serviço não confirmou um identificador e um estado da reserva; nenhum sucesso foi exibido.');
      renderConfirmation(String(id), String(status));
    } catch (error) {
      message('confirm', `${error.message || 'Falha de conexão.'} Nenhuma confirmação foi exibida; seus dados estão preservados para tentar novamente.`, true);
    } finally {
      state.submitting = false; confirmButton.disabled = false; confirmButton.textContent = 'Confirmar reserva';
    }
  });
  flow.querySelector('[data-reserve-details]')?.addEventListener('click', () => flow.querySelector('[data-reserve-confirmation]')?.scrollIntoView({ behavior: 'smooth', block: 'center' }));

  safeIcons();
})();
