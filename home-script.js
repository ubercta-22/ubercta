(() => {
  'use strict';
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const dialog = $('#action-dialog');
  const dialogTitle = $('#dialog-title');
  const dialogBody = $('#dialog-body');
  const toast = $('#toast');
  let toastTimer;
  let selectedService = '';
  const savedPlaces = { home: '', work: '' };
  const initialScreen = $('#main-content');
  const tripScreen = $('#trip-screen');

  const icons = () => { if (window.lucide) window.lucide.createIcons({ attrs: { 'aria-hidden': 'true' } }); };
  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2500);
  }
  function openDialog(title, content, eyebrow = 'UBER COROATÁ') {
    dialogTitle.textContent = title;
    dialogBody.innerHTML = content;
    $('#dialog-eyebrow').textContent = eyebrow;
    if (!dialog.open) dialog.showModal();
    icons();
    const firstInput = $('input, select, button:not(.icon-close)', dialog);
    if (firstInput) setTimeout(() => firstInput.focus(), 50);
  }
  function emptyState(icon, title, text) {
    return `<div class="empty-state"><i data-lucide="${icon}"></i><strong>${title}</strong><p>${text}</p></div>`;
  }
  function openSearch() {
    openDialog('Para onde vamos?', `<form class="dialog-form" id="search-form"><label class="sr-only" for="destination-input">Digite seu destino</label><input id="destination-input" name="destination" type="search" placeholder="Digite um endereço ou local" autocomplete="street-address" required><p class="dialog-hint">Esta demonstração não consulta endereços nem solicita sua localização.</p><button class="primary-action" type="submit">Continuar</button></form>`);
  }
  function openSchedule() {
    openDialog('Quando você quer sair?', `<form class="dialog-form" id="schedule-form"><label for="schedule-date" class="dialog-hint">Escolha uma data e horário para a sua solicitação.</label><input id="schedule-date" name="schedule" type="datetime-local" required><button class="primary-action" type="submit">Salvar horário</button><button class="secondary-row" type="button" data-reset-schedule><i data-lucide="zap"></i><span>Solicitar para agora</span></button></form>`);
    const dateInput = $('#schedule-date');
    if (dateInput) dateInput.min = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  }
  function openPlaceEditor(kind) {
    const isHome = kind === 'home';
    const title = isHome ? 'Definir Casa' : 'Definir Trabalho';
    const label = isHome ? 'Casa' : 'Trabalho';
    const value = savedPlaces[kind];
    openDialog(title, `<form class="dialog-form" id="place-form" data-place="${kind}"><label for="place-address" class="dialog-hint">${value ? `Endereço atual: ${escapeHtml(value)}` : `Adicione um endereço para ${label.toLowerCase()}. Ele ficará salvo apenas nesta demonstração.`}</label><input id="place-address" name="address" type="text" placeholder="Rua, número, bairro" value="${escapeAttr(value)}" autocomplete="street-address" required><button class="primary-action" type="submit">${value ? 'Atualizar endereço' : 'Salvar neste dispositivo'}</button></form>`);
  }
  function openSaved() {
    const saved = Object.entries(savedPlaces).filter(([, value]) => value);
    const rows = saved.map(([key, value]) => `<button class="saved-row" type="button" data-use-place="${key}"><i data-lucide="${key === 'home' ? 'house' : 'briefcase-business'}"></i><span><strong>${key === 'home' ? 'Casa' : 'Trabalho'}</strong><br>${escapeHtml(value)}</span></button>`).join('');
    openDialog('Locais salvos', saved.length ? `${rows}<p class="dialog-hint">Os endereços são guardados somente nesta sessão de demonstração.</p>` : emptyState('map-pin-house', 'Nenhum local salvo', 'Defina Casa ou Trabalho para vê-los nesta lista.'));
  }
  function openHistory() {
    openDialog('Atividade', emptyState('clock-3', 'Seu histórico aparecerá aqui', 'Ainda não há corridas nesta demonstração. Nenhuma viagem foi solicitada.'));
  }
  function openAccount() {
    openDialog('Sua conta', `${emptyState('user-round', 'Acesso de demonstração', 'A autenticação ainda não está conectada. Nenhum dado de conta foi criado.')}<button class="secondary-row" type="button" data-toast="A autenticação será conectada em uma etapa futura."><i data-lucide="shield-check"></i><span>Privacidade e segurança</span></button>`);
  }
  function openOptions() {
    openDialog('Opções', `<button class="secondary-row" type="button" data-modal="saved"><i data-lucide="bookmark"></i><span>Locais salvos</span></button><button class="secondary-row" type="button" data-modal="history"><i data-lucide="clock-3"></i><span>Histórico de atividade</span></button><button class="secondary-row" type="button" data-toast="Preferências demonstrativas; nada foi alterado no dispositivo."><i data-lucide="settings-2"></i><span>Preferências do aplicativo</span></button><p class="dialog-hint">Opções demonstrativas, sem conta ou backend conectado.</p>`);
  }
  function escapeHtml(value) { return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char])); }
  function escapeAttr(value) { return escapeHtml(value); }

  const modalActions = {
    search: openSearch,
    location: () => openDialog('Localização inicial', `${emptyState('map-pin', 'Praça José Sarney', 'Este é um endereço de demonstração em Coroatá - MA. O aplicativo ainda não acessa o GPS do dispositivo.')}`),
    schedule: openSchedule,
    home: () => openPlaceEditor('home'),
    work: () => openPlaceEditor('work'),
    saved: openSaved,
    history: openHistory,
    services: () => openDialog('Serviços', `<p class="dialog-hint">Escolha um dos quatro serviços na tela inicial: Viagem, Moto, Entrega ou Delivery.</p>`)
  };
  function handleAction(action) {
    if (modalActions[action]) modalActions[action]();
  }

  document.addEventListener('click', event => {
    const modalTrigger = event.target.closest('[data-modal]');
    if (modalTrigger) { event.preventDefault(); handleAction(modalTrigger.dataset.modal); return; }
    const pageTrigger = event.target.closest('[data-page]');
    if (pageTrigger) {
      const page = pageTrigger.dataset.page;
      $$('.nav-item').forEach((item, index) => {
        const active = item.dataset.page === page;
        item.classList.toggle('is-active', active);
        if (active) item.setAttribute('aria-current', 'page'); else item.removeAttribute('aria-current');
        if (active) $('.active-marker').style.transform = `translateX(${index * 100 + 4}%)`;
      });
      if (page === 'Viagem') { if (typeof window.openTripScreen === 'function') window.openTripScreen(); else showToast('A tela de viagem ainda está carregando. Tente novamente.'); return; }
      if (tripScreen) tripScreen.hidden = true;
      if (initialScreen) initialScreen.hidden = false;
      if (page === 'Atividade') openHistory();
      else if (page === 'Conta') openAccount();
      else if (page === 'Início') showToast('Você está no início.');
      return;
    }
    const service = event.target.closest('[data-service]');
    if (service) {
      if (service.dataset.service === 'Reserve') { if (typeof window.openReserveFlow === 'function') window.openReserveFlow(); else showToast('A tela Reserve ainda está carregando. Tente novamente.'); return; }
      if (service.dataset.service === 'Viagem') { if (typeof window.openTripScreen === 'function') window.openTripScreen(); else showToast('A tela de viagem ainda está carregando. Tente novamente.'); return; }
      selectedService = service.dataset.service;
      $$('.service-card').forEach(card => {
        const active = card.dataset.service === selectedService;
        card.classList.toggle('is-selected', active);
        card.setAttribute('aria-pressed', String(active));
      });
      const destinations = {
        Viagem: 'Destino escolhido para uma viagem de carro. Ainda não há motoristas conectados nem solicitação enviada.',
        Moto: 'Destino escolhido para uma viagem de moto. Ainda não há motoristas conectados nem solicitação enviada.',
        Entrega: 'Serviço de envio selecionado. Nenhum pacote foi solicitado.',
        Delivery: 'Delivery selecionado. Nenhum restaurante ou pedido foi consultado.'
      };
      openDialog(selectedService, `<p class="dialog-hint">${destinations[selectedService]}</p><div class="dialog-form" style="margin-top:14px"><button class="primary-action" type="button" data-modal="search">Escolher destino</button></div>`);
      return;
    }
    const toastTrigger = event.target.closest('[data-toast]');
    if (toastTrigger) showToast(toastTrigger.dataset.toast);
    const usePlace = event.target.closest('[data-use-place]');
    if (usePlace) showToast(`Endereço de ${usePlace.dataset.usePlace === 'home' ? 'Casa' : 'Trabalho'} selecionado nesta demonstração.`);
    if (event.target.matches('[data-reset-schedule]')) {
      $('#schedule-label').textContent = 'Agora';
      dialog.close();
      showToast('Horário definido como Agora.');
    }
  });
  document.addEventListener('submit', event => {
    if (event.target.id === 'search-form') {
      event.preventDefault();
      const destination = new FormData(event.target).get('destination').trim();
      if (!destination) return;
      dialog.close();
      showToast(`Destino anotado: ${destination}. Nenhuma solicitação foi enviada.`);
    }
    if (event.target.id === 'schedule-form') {
      event.preventDefault();
      const value = new FormData(event.target).get('schedule');
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return;
      $('#schedule-label').textContent = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' · ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      dialog.close();
      showToast('Horário salvo apenas nesta demonstração.');
    }
    if (event.target.id === 'place-form') {
      event.preventDefault();
      const kind = event.target.dataset.place;
      const address = new FormData(event.target).get('address').trim();
      if (!address) return;
      savedPlaces[kind] = address;
      dialog.close();
      showToast(`${kind === 'home' ? 'Casa' : 'Trabalho'} salvo nesta sessão de demonstração.`);
    }
  });
  $$('.service-image').forEach(image => {
    image.addEventListener('error', () => image.classList.add('is-broken'), { once: true });
  });
  dialog.addEventListener('click', event => {
    if (event.target === dialog) dialog.close();
  });
  icons();
})();


// Carrossel de campanha: autoplay a cada 4 s, loop contínuo e swipe para ambos os lados.
(() => {
  const carousel = document.querySelector('[data-banner-carousel]');
  if (!carousel) return;
  const track = carousel.querySelector('.banner-track');
  const slides = [...track.querySelectorAll('.banner-slide')];
  const indicators = [...carousel.querySelectorAll('.banner-indicator')];
  const count = slides.length;
  if (count < 2 || indicators.length !== count) return;

  const firstClone = slides[0].cloneNode(true);
  const lastClone = slides[count - 1].cloneNode(true);
  firstClone.setAttribute('aria-hidden', 'true');
  lastClone.setAttribute('aria-hidden', 'true');
  firstClone.querySelector('img')?.setAttribute('alt', '');
  lastClone.querySelector('img')?.setAttribute('alt', '');
  track.insertBefore(lastClone, slides[0]);
  track.append(firstClone);

  let position = 1;
  let active = 0;
  let timer;
  let pointerStart = null;
  let pointerId = null;
  const interval = 4000;
  let carouselReady = false;

  function paintIndicators() {
    indicators.forEach((button, index) => {
      const selected = index === active;
      button.classList.toggle('is-active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
  }
  function moveTo(nextPosition, animate = true) {
    position = nextPosition;
    active = (position - 1 + count) % count;
    if (!animate) track.classList.add('is-jumping');
    track.style.transform = `translate3d(-${position * 100}%, 0, 0)`;
    paintIndicators();
    if (!animate) requestAnimationFrame(() => requestAnimationFrame(() => track.classList.remove('is-jumping')));
  }
  function next() { moveTo(position + 1); }
  function previous() { moveTo(position - 1); }
  function resetTimer() {
    clearInterval(timer);
    if (!document.hidden && carouselReady && carousel.clientWidth > 0) timer = setInterval(next, interval);
  }

  track.classList.add('is-jumping');
  track.style.transform = 'translate3d(-100%, 0, 0)';
  paintIndicators();
  function activateCarouselWhenVisible() {
    if (carouselReady || carousel.clientWidth === 0) return;
    carouselReady = true;
    track.style.transform = 'translate3d(-100%, 0, 0)';
    requestAnimationFrame(() => requestAnimationFrame(() => {
      track.classList.remove('is-jumping');
      resetTimer();
    }));
  }
  if (typeof ResizeObserver === 'function') {
    const readyObserver = new ResizeObserver(() => {
      if (carousel.clientWidth > 0) {
        readyObserver.disconnect();
        activateCarouselWhenVisible();
      }
    });
    readyObserver.observe(carousel);
  } else {
    const startupPoll = setInterval(() => {
      if (carousel.clientWidth > 0) {
        clearInterval(startupPoll);
        activateCarouselWhenVisible();
      }
    }, 50);
  }
  activateCarouselWhenVisible();
  track.addEventListener('transitionend', event => {
    if (event.target !== track) return;
    if (position === count + 1) moveTo(1, false);
    else if (position === 0) moveTo(count, false);
  });
  indicators.forEach((button, index) => button.addEventListener('click', () => {
    moveTo(index + 1);
    resetTimer();
  }));
  carousel.querySelectorAll('.banner-slide > img').forEach(image => {
    image.addEventListener('error', () => {
      if (!image.dataset.fallbackTried && image.dataset.localFallback) {
        image.dataset.fallbackTried = 'true';
        image.src = image.dataset.localFallback;
        return;
      }
      image.classList.add('is-broken');
    });
    if (image.complete && !image.naturalWidth) image.dispatchEvent(new Event('error'));
  });
  carousel.addEventListener('pointerdown', event => {
    if (event.target.closest('.banner-indicator')) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    pointerStart = event.clientX;
    pointerId = event.pointerId;
    carousel.setPointerCapture?.(pointerId);
  });
  carousel.addEventListener('pointerup', event => {
    if (pointerStart === null || event.pointerId !== pointerId) return;
    const distance = event.clientX - pointerStart;
    if (Math.abs(distance) >= 42) {
      distance < 0 ? next() : previous();
      resetTimer();
    }
    pointerStart = pointerId = null;
  });
  carousel.addEventListener('pointercancel', () => { pointerStart = pointerId = null; });
  carousel.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight') { event.preventDefault(); next(); resetTimer(); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); previous(); resetTimer(); }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) clearInterval(timer);
    else resetTimer();
  });
  resetTimer();
})();


// Fluxo integrado de solicitação: mapa real OSM, geocodificação e rota demonstrativa.
(() => {
  const screen = document.querySelector('#trip-screen');
  const initialScreen = document.querySelector('#main-content');
  if (!screen) return;
  const state = { vehicle: '', origin: null, destination: null, payment: 'Pix', coupon: '' };
  let map, originMarker, destinationMarker;
  let destinationPicking = false;
  let suggestionTimer;
  const coroata = [-4.1347, -44.1244];
  const $ = (s) => screen.querySelector(s);
  const $$ = (s) => [...screen.querySelectorAll(s)];
  const toast = (message) => { const el = document.querySelector('#toast'); if (!el) return; el.textContent = message; el.classList.add('is-visible'); clearTimeout(window.__tripToast); window.__tripToast=setTimeout(()=>el.classList.remove('is-visible'),2800); };
  function icons(){ if(window.lucide) window.lucide.createIcons({attrs:{'aria-hidden':'true'}}); }
  function ensureMap(){
    if(map || !window.maplibregl) return map;
    try {
      map = new window.maplibregl.Map({container:'trip-map',style:'https://tiles.openfreemap.org/styles/positron',center:[coroata[1],coroata[0]],zoom:13,attributionControl:false});
      map.addControl(new window.maplibregl.AttributionControl({compact:false}), 'top-right');
      map.on('click', e => { if(destinationPicking){ reverseGeocode('destination',[e.lngLat.lat,e.lngLat.lng]); } });
      map.on('error', event => { if(event.error) console.warn('Falha do mapa de viagem:',event.error.message); });
    } catch(error) { map=null; }
    return map;
  }
  function pointIcon(color){ const root=document.createElement('span');root.className='trip-marker';const dot=document.createElement('span');dot.style.setProperty('--marker',color);root.append(dot);return root; }
  function setPoint(kind, coords, label){
    state[kind]={coords,label}; const isOrigin=kind==='origin'; const ref=isOrigin?originMarker:destinationMarker; if(ref) ref.remove();
    if(map && window.maplibregl){const marker=new window.maplibregl.Marker({element:pointIcon(isOrigin?'#08aa59':'#f27b17'),anchor:'center'}).setLngLat([coords[1],coords[0]]).addTo(map);if(isOrigin)originMarker=marker;else destinationMarker=marker;map.easeTo({center:[coords[1],coords[0]],zoom:15});}
    $(`#${kind}-label`).textContent=label;
    if(state.origin && state.destination) calculateRoute();
  }
  async function calculateRoute(){
    if(!state.origin||!state.destination||!map||!window.maplibregl) return;
    const [a,b]=[state.origin.coords,state.destination.coords];
    try {
      const res=await fetch(`https://router.project-osrm.org/route/v1/driving/${a[1]},${a[0]};${b[1]},${b[0]}?overview=full&geometries=geojson`);if(!res.ok)throw new Error('Rota indisponível');const data=await res.json();const geometry=data.routes?.[0]?.geometry;if(!geometry?.coordinates?.length)throw new Error('Rota não encontrada');
      const draw=()=>{if(!map||!map.isStyleLoaded())return;if(map.getLayer('trip-route-line'))map.removeLayer('trip-route-line');if(map.getSource('trip-route-source'))map.removeSource('trip-route-source');map.addSource('trip-route-source',{type:'geojson',data:{type:'Feature',properties:{},geometry}});map.addLayer({id:'trip-route-line',type:'line',source:'trip-route-source',layout:{'line-cap':'round','line-join':'round'},paint:{'line-color':'#08a957','line-width':6,'line-opacity':.86}});const bounds=new window.maplibregl.LngLatBounds();geometry.coordinates.forEach(point=>bounds.extend(point));map.fitBounds(bounds,{padding:{top:120,right:60,bottom:260,left:60},maxZoom:15});};
      if(map.isStyleLoaded())draw();else map.once('load',draw);
    } catch(e){ toast('Não foi possível calcular a rota agora.'); }
  }
  function readablePlace(address, fallback='Local selecionado') {
    return address?.road || address?.pedestrian || address?.neighbourhood || address?.suburb || address?.city_district || address?.town || address?.city || fallback;
  }
  function resultPlace(item){
    return item?.name || item?.address?.road || item?.address?.pedestrian || item?.address?.neighbourhood || item?.address?.suburb || item?.address?.city_district || item?.address?.town || item?.address?.city || 'Local selecionado';
  }
  async function reverseGeocode(kind, coords){
    try {
      const res=await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords[0]}&lon=${coords[1]}&zoom=18&addressdetails=1`,{headers:{'Accept-Language':'pt-BR'}});
      const data=await res.json();
      const label=readablePlace(data.address,data.name);
      setPoint(kind,coords,label);
      destinationPicking=false;
      document.querySelector('#action-dialog')?.close();
      toast(`${kind==='origin'?'Origem':'Destino'} confirmado: ${label}`);
    } catch(e){ setPoint(kind,coords,'Local selecionado'); destinationPicking=false; document.querySelector('#action-dialog')?.close(); }
  }
  function requestCurrentLocation(){
    if(!navigator.geolocation){ toast('Seu navegador não oferece localização. Informe a origem manualmente.'); return; }
    toast('Solicitando sua localização atual…');
    navigator.geolocation.getCurrentPosition(pos=>reverseGeocode('origin',[pos.coords.latitude,pos.coords.longitude]),()=>{toast('Permissão negada. Você pode escolher a origem pelo mapa.');openPlacePicker('origin');},{enableHighAccuracy:true,timeout:12000,maximumAge:0});
  }
  function openPlacePicker(kind){
    const isOrigin=kind==='origin';
    destinationPicking=!isOrigin;
    tripDialog(isOrigin?'Escolha sua origem':'Escolha seu destino',`<div class="place-picker"><p class="picker-hint">${isOrigin?'Permita o acesso à localização ou escolha um ponto no mapa.':'Digite um bairro, rua ou local, ou toque no mapa para escolher o ponto exato.'}</p>${isOrigin?'':'<label for="place-search-input">Pesquisar local</label><input id="place-search-input" type="search" placeholder="Ex.: Centro, Trizidela ou Rua Principal" autocomplete="off"><div id="place-suggestions" class="place-suggestions" role="listbox"></div>'}<button type="button" class="map-picker-action" data-use-map-picker="${kind}"><i data-lucide="map-pin"></i><span>Escolher pelo mapa</span></button></div>`);
    if(!isOrigin){
      const input=document.querySelector('#place-search-input');
      input?.addEventListener('input',()=>{clearTimeout(suggestionTimer);const q=input.value.trim();if(q.length<1){document.querySelector('#place-suggestions').innerHTML='';return;}suggestionTimer=setTimeout(()=>searchSuggestions(q),350);});
    }
  }
  async function searchSuggestions(query){
    const box=document.querySelector('#place-suggestions'); if(!box)return;
    box.innerHTML='<div class="suggestion-loading">Buscando locais…</div>';
    try{
      const res=await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=6&countrycodes=br&q=${encodeURIComponent(query+', Coroatá, Maranhão, Brasil')}`,{headers:{'Accept-Language':'pt-BR'}});
      const data=await res.json();
      box.innerHTML='';
      data.forEach((item,i)=>{const button=document.createElement('button');button.type='button';button.className='place-suggestion';button.dataset.suggestionIndex=String(i);button.innerHTML='<span class="checkpoint-mini" aria-hidden="true"></span>';const copy=document.createElement('span');const strong=document.createElement('strong');strong.textContent=resultPlace(item);const small=document.createElement('small');small.textContent=[item.address?.neighbourhood,item.address?.suburb,item.address?.town||item.address?.city].filter(Boolean).join(' · ')||'Coroatá - MA';copy.append(strong,small);button.append(copy);button.addEventListener('click',()=>{const label=resultPlace(item);setPoint('destination',[Number(item.lat),Number(item.lon)],label);destinationPicking=false;document.querySelector('#action-dialog')?.close();toast(`Destino confirmado: ${label}`);});box.append(button);});
      if(!data.length)box.innerHTML='<div class="suggestion-loading">Nenhum local encontrado.</div>';
    }catch(e){box.innerHTML='<div class="suggestion-loading">Não foi possível buscar agora. Use o mapa.</div>';}
  }

  window.openTripScreen=()=>{ if(initialScreen) initialScreen.hidden=true; screen.hidden=false; const tripNav=document.querySelector('.nav-item[data-page="Viagem"]'); document.querySelectorAll('.nav-item').forEach(x=>{const active=x===tripNav;x.classList.toggle('is-active',active);if(active)x.setAttribute('aria-current','page');else x.removeAttribute('aria-current')}); document.querySelector('.active-marker').style.transform='translateX(104%)'; ensureMap(); setTimeout(()=>map?.resize(),80); setTimeout(()=>map?.resize(),650); icons(); };
  document.querySelector('.nav-item[data-page=\"Viagem\"]')?.addEventListener('click',()=>window.openTripScreen());
  $('[data-trip-back]').addEventListener('click',()=>{ screen.hidden=true; if(initialScreen) initialScreen.hidden=false; const home=document.querySelector('.nav-item[data-page="Início"]'); home?.click(); });
  $$('[data-trip-field]').forEach(btn=>btn.addEventListener('click',()=>{ if(btn.dataset.tripField==='origin') requestCurrentLocation(); else openPlacePicker('destination'); }));
  $$('[data-vehicle]').forEach(btn=>btn.addEventListener('click',()=>{ state.vehicle=btn.dataset.vehicle; $$('[data-vehicle]').forEach(x=>{const active=x===btn;x.classList.toggle('is-selected',active);x.setAttribute('aria-selected',String(active))}); }));
  $('[data-trip-center]').addEventListener('click',()=>{ensureMap();const point=state.origin?.coords||coroata;map?.easeTo({center:[point[1],point[0]],zoom:15});});
  $('[data-trip-locate]').addEventListener('click',requestCurrentLocation);
  document.addEventListener('click',event=>{const picker=event.target.closest('[data-use-map-picker]');if(picker){document.querySelector('#action-dialog')?.close();destinationPicking=picker.dataset.useMapPicker==='destination';toast('Toque no mapa para escolher o ponto exato.');}});
  function tripDialog(title, html){ const d=document.querySelector('#action-dialog'); const t=document.querySelector('#dialog-title'); const b=document.querySelector('#dialog-body'); const e=document.querySelector('#dialog-eyebrow'); if(!d||!t||!b)return; t.textContent=title; e.textContent='UBER COROATÁ'; b.innerHTML=html; if(!d.open)d.showModal(); if(window.lucide)window.lucide.createIcons({attrs:{'aria-hidden':'true'}}); }
  $('[data-trip-payment]').addEventListener('click',()=>tripDialog('Escolha o pagamento',`<div class="payment-choice-list"><button type="button" data-payment-choice="Pix"><span class="choice-logo"><img src="assets/icons/pix-3d.png" alt=""></span><span><strong>Pix</strong><small>Pagamento instantâneo</small></span><i data-lucide="chevron-right"></i></button><button type="button" data-payment-choice="Cartão Black"><span class="choice-logo dark"><img src="assets/icons/card-black-3d.png" alt=""></span><span><strong>Cartão de crédito</strong><small>Cartão Black</small></span><i data-lucide="chevron-right"></i></button><button type="button" data-payment-choice="Espécie"><span class="choice-logo"><img src="assets/icons/cash-3d.png" alt=""></span><span><strong>Espécie</strong><small>Pagamento em dinheiro</small></span><i data-lucide="chevron-right"></i></button></div><p class="dialog-hint">Somente o método escolhido será usado quando o backend estiver conectado.</p>`));
  $('[data-trip-coupon]').addEventListener('click',()=>tripDialog('Código de cupom',`<div class="coupon-promo"><span class="coupon-sparkle s1"></span><span class="coupon-sparkle s2"></span><span class="coupon-sparkle s3"></span><img src="assets/images/coupon-character.png" alt="Pessoa 3D feliz segurando um cupom"><div><strong>Coloque o código e ganhe desconto!</strong><small>Seu próximo trajeto pode ficar ainda mais especial.</small></div></div><form class="coupon-form" id="coupon-form"><label for="coupon-input">Código de cupom</label><input id="coupon-input" name="coupon" type="text" placeholder="Digite seu código" autocomplete="off" required><button class="primary-action" type="submit">Confirmar cupom</button></form>`));
  document.addEventListener('click',event=>{const choice=event.target.closest('[data-payment-choice]');if(choice){const payment=choice.dataset.paymentChoice;const paymentAssets={'Pix':['assets/icons/pix-3d.png','Pix'],'Cartão Black':['assets/icons/card-black-3d.png','Cartão de crédito'],'Espécie':['assets/icons/cash-3d.png','Espécie']};const [asset,label]=paymentAssets[payment]||paymentAssets.Pix;state.payment=payment;$('#payment-label').textContent=label;const icon=$('#payment-icon');if(icon){icon.src=asset;icon.alt=label;}document.querySelector('#action-dialog')?.close();toast(`${label} selecionado.`);}});
  document.addEventListener('submit',event=>{if(event.target.id==='coupon-form'){event.preventDefault();const value=new FormData(event.target).get('coupon').trim();if(!value)return;state.coupon=value;$('#coupon-label').textContent=value;document.querySelector('#action-dialog')?.close();toast('Cupom registrado para validação no backend.');}});
  $('[data-confirm-trip]').addEventListener('click', async()=>{if(!state.origin){toast('Defina a origem antes de continuar.');return;}if(!state.destination){toast('Escolha um destino antes de continuar.');return;}if(!state.vehicle){toast('Escolha um veículo antes de continuar.');return;}if(!window.uberApi?.token){toast('Entre na sua conta para solicitar uma viagem.');return;}const button=$('[data-confirm-trip]');button.disabled=true;try{const result=await window.uberApi.createTrip({origin:{address:state.origin.label,latitude:state.origin.coords[0],longitude:state.origin.coords[1]},destination:{address:state.destination.label,latitude:state.destination.coords[0],longitude:state.destination.coords[1]},vehicleCategory:state.vehicle,paymentMethod:state.payment});toast(`Viagem registrada: ${result.trip?.id||'solicitação criada'}.`);}catch(error){toast(error.message||'Não foi possível registrar a viagem.');}finally{button.disabled=false;}});
  icons();
})();
