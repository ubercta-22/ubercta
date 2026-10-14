(() => {
  const home = document.querySelector('.screen-content');
  const registration = document.querySelector('.registration-shell');
  const screens = [...document.querySelectorAll('.registration-screen')];
  const driverShell = document.querySelector('.driver-shell');
  const appLoading = document.querySelector('.app-loading');
  const appHome = document.querySelector('.app-home');
  const driverSteps = [...document.querySelectorAll('.driver-step')];
  const state = {
    step: 'home',
    account: null,
    method: 'phone',
    form: {},
    timer: 45,
    timerId: null,
    driverStep: 1,
    driver: { vehicleType: 'car', uploads: {} },
    submitting: false,
  };

  const accountOptions = [...document.querySelectorAll('.account-option')];
  const accountContinue = document.querySelector('[data-next="account"]');
  const loginForm = document.querySelector('form[data-step="login"]');
  const form = document.querySelector('form[data-step="form"]');
  const formError = document.querySelector('.form-error');
  const verifyError = document.querySelector('.verify-error');
  const destination = document.querySelector('[data-destination]');
  const verifyDescription = document.querySelector('.verify-description');
  const codeInputs = [...document.querySelectorAll('.code-inputs input')];
  const resendButton = document.querySelector('.resend-button');
  const resendTimer = resendButton?.querySelector('span');
  const note = document.querySelector('.interaction-note');
  let noteTimer;

  const showNote = (message) => {
    if (!note) return;
    note.textContent = message;
    note.classList.add('is-visible');
    window.clearTimeout(noteTimer);
    noteTimer = window.setTimeout(() => note.classList.remove('is-visible'), 2400);
  };

  const showStep = (step) => {
    state.step = step;
    const isHome = step === 'home';
    home.hidden = !isHome;
    registration.hidden = isHome;
    driverShell.hidden = true;
    appLoading.hidden = true;
    appHome.hidden = true;
    screens.forEach((screen) => { screen.hidden = screen.dataset.step !== step; });
    if (step === 'verify') {
      startTimer();
      updateVerificationCopy();
      window.setTimeout(() => codeInputs[0]?.focus(), 80);
    }
  };

  const showDriverStep = (step) => {
    state.step = 'driver';
    state.driverStep = step;
    home.hidden = true;
    registration.hidden = false;
    appLoading.hidden = true;
    appHome.hidden = true;
    screens.forEach((screen) => { screen.hidden = true; });
    driverShell.hidden = false;
    driverSteps.forEach((screen) => { screen.hidden = Number(screen.dataset.driverStep) !== step; });
    document.querySelectorAll('[data-progress]').forEach((item) => {
      const number = Number(item.dataset.progress);
      item.classList.toggle('is-active', number === step);
      item.classList.toggle('is-done', number < step);
    });
    document.querySelectorAll('.driver-progress i').forEach((item, index) => item.classList.toggle('is-done', index < step - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const showAppHome = () => {
    state.step = 'app-home';
    home.hidden = true;
    registration.hidden = true;
    appLoading.hidden = true;
    appHome.hidden = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  let loadingRun = 0;
  const startAppEntry = (method) => {
    const run = ++loadingRun;
    window.dispatchEvent(new CustomEvent('auth:login', { detail: { method } }));
    home.hidden = true; registration.hidden = true; appHome.hidden = true;
    appLoading.hidden = false; appLoading.classList.remove('is-exiting');
    document.body.classList.add('is-loading');
    const percent = document.querySelector('#loading-percent');
    const fill = document.querySelector('#loading-progress-fill');
    const bar = document.querySelector('.loading-progress');
    const status = document.querySelector('#loading-status');
    const renderLoadingStatus = (message) => {
      status.setAttribute('aria-label', message);
      const base = message.replace(/\.\.\.$/, '');
      const letters = [...base].map((character, index) => `<span class="loading-letter" style="--letter-index:${index}">${character === ' ' ? '&nbsp;' : character}</span>`).join('');
      status.innerHTML = `${letters}<span class="loading-ellipsis" aria-hidden="true"><i></i><i></i><i></i></span>`;
    };
    const paint = (value, message) => {
      if (run !== loadingRun) return;
      percent.textContent = `${value}%`; fill.style.width = `${value}%`;
      bar.setAttribute('aria-valuenow', String(value)); renderLoadingStatus(message);
    };
    const wait = (ms) => new Promise(resolve => window.setTimeout(resolve, ms));
    (async () => {
      paint(0, 'Carregando seus dados...'); await wait(350);
      paint(10, 'Carregando seus dados...'); await wait(450);
      paint(30, 'Analisando suas informações...'); await wait(550);
      paint(50, 'Preparando sua experiência...'); await wait(550);
      paint(70, 'Analisando... espere mais um pouco'); await wait(3000);
      paint(87, 'Quase tudo pronto...'); await wait(2000);
      paint(99, 'Finalizando seus dados...'); await wait(2000);
      paint(100, 'Concluído!'); await wait(450);
      if (run !== loadingRun) return;
      appLoading.classList.add('is-exiting');
      await wait(520);
      if (run !== loadingRun) return;
      appLoading.hidden = true; document.body.classList.remove('is-loading');
      appHome.classList.add('is-entering');
      showAppHome();
      window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
        appHome.classList.remove('is-entering');
      }));
    })();
  };

  const formatPhone = (value) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits.length ? `(${digits}` : '';
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const maskPhone = (value) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length < 10) return '(99) 99999-9999';
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 4)}*****-${digits.slice(-2)}`;
  };

  const updateVerificationCopy = () => {
    const usingEmail = state.method === 'email';
    const methodLabel = usingEmail ? 'e-mail cadastrado' : 'número cadastrado';
    const target = usingEmail ? (state.form.email || 'seu@email.com') : maskPhone(state.form.phone || '');
    document.querySelector('.verify-body h2').textContent = usingEmail ? 'Verifique seu e-mail' : 'Verifique seu telefone';
    verifyDescription.innerHTML = `Enviamos um código de 6 dígitos para o ${methodLabel}.<br /><strong>${target}</strong>.`;
    destination.textContent = target;
  };

  const startTimer = () => {
    window.clearInterval(state.timerId);
    state.timer = 45;
    resendButton.disabled = true;
    resendTimer.textContent = '00:45';
    state.timerId = window.setInterval(() => {
      state.timer -= 1;
      const seconds = String(Math.max(state.timer, 0)).padStart(2, '0');
      resendTimer.textContent = `00:${seconds}`;
      if (state.timer <= 0) {
        window.clearInterval(state.timerId);
        resendButton.disabled = false;
        resendTimer.textContent = '00:00';
      }
    }, 1000);
  };

  const driverValue = (name) => document.querySelector(`[data-driver-field="${name}"]`)?.value.trim() || '';
  const vehicleValue = (name) => document.querySelector(`[data-vehicle-field="${name}"]`)?.value.trim() || '';
  const setDriverError = (step, message = '') => { const target = document.querySelector(`[data-driver-error="${step}"]`); if (target) target.textContent = message; };
  const cpfIsValid = (value) => {
    const cpf = value.replace(/\D/g, '');
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
    let sum = 0;
    for (let i = 0; i < 9; i += 1) sum += Number(cpf[i]) * (10 - i);
    let digit = (sum * 10) % 11; if (digit === 10) digit = 0;
    if (digit !== Number(cpf[9])) return false;
    sum = 0;
    for (let i = 0; i < 10; i += 1) sum += Number(cpf[i]) * (11 - i);
    digit = (sum * 10) % 11; if (digit === 10) digit = 0;
    return digit === Number(cpf[10]);
  };
  const driverHas = (key) => Boolean(state.driver.uploads[key]);

  const validateDriverStep = (step) => {
    if (step === 1) {
      const phone = driverValue('phone').replace(/\D/g, '');
      const missing = [['name', 'nome'], ['phone', 'telefone'], ['email', 'e-mail'], ['password', 'senha']].filter(([key]) => !driverValue(key)).map(([, label]) => label);
      if (missing.length) return `Preencha: ${missing.join(', ')}.`;
      if (phone.length < 10) return 'Digite um telefone com DDD e pelo menos 10 números.';
      if (!/^\S+@\S+\.\S+$/.test(driverValue('email'))) return 'Digite um e-mail válido.';
      if (driverValue('password').length < 8) return 'A senha precisa ter pelo menos 8 caracteres.';
      state.driver.name = driverValue('name'); state.driver.phone = driverValue('phone'); state.driver.email = driverValue('email');
      return '';
    }
    if (step === 2) {
      const missing = [['birth', 'data de nascimento'], ['cpf', 'CPF'], ['gender', 'gênero'], ['address', 'endereço']].filter(([key]) => !driverValue(key)).map(([, label]) => label);
      if (missing.length) return `Preencha: ${missing.join(', ')}.`;
      if (!cpfIsValid(driverValue('cpf'))) return 'Digite um CPF válido com 11 números.';
      return '';
    }
    if (step === 3 && (!driverHas('cnhFront') || !driverHas('cnhBack'))) return 'Anexe a frente e o verso da CNH para continuar.';
    if (step === 4 && !driverHas('profile')) return 'Adicione uma foto de perfil para continuar.';
    if (step === 5) {
      const required = ['brand', 'model', 'year', 'color', 'plate'];
      const labels = { brand: 'marca', model: 'modelo', year: 'ano', color: 'cor', plate: 'placa' };
      const missing = required.filter((key) => !vehicleValue(key)).map((key) => labels[key]);
      if (missing.length) return `Preencha: ${missing.join(', ')}.`;
      if (!/^[A-Z]{3}-?\d[A-Z0-9]\d{2}$/i.test(vehicleValue('plate'))) return 'Informe uma placa válida no padrão brasileiro.';
    }
    if (step === 6 && !driverHas('crlv')) return 'Anexe o CRLV para continuar.';
    return '';
  };

  const loadPreview = (input) => {
    const key = input.dataset.upload;
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setDriverError(state.driverStep, 'Selecione um arquivo de imagem válido.'); return; }
    state.driver.uploads[key] = file;
    const card = input.closest('.upload-card, .profile-upload');
    card.classList.add('has-file');
    const preview = card.querySelector('.upload-preview, .profile-image');
    if (preview) { preview.src = URL.createObjectURL(file); }
  };

  accountOptions.forEach((option) => {
    option.addEventListener('click', () => {
      state.account = option.dataset.account;
      accountOptions.forEach((item) => {
        const selected = item === option;
        item.classList.toggle('is-selected', selected);
        item.setAttribute('aria-checked', String(selected));
      });
      accountContinue.disabled = false;
    });
  });

  document.querySelectorAll('[data-back]').forEach((button) => {
    button.addEventListener('click', () => {
      if (state.step === 'account') showStep('home');
      if (state.step === 'login') showStep('home');
      if (state.step === 'form') showStep('account');
      if (state.step === 'verify') showStep('form');
    });
  });

  document.querySelectorAll('[data-flow]').forEach((button) => {
    button.addEventListener('click', () => {
      if (button.dataset.flow === 'signup') showStep('account');
      else if (button.dataset.flow === 'login') showStep('login');
      else { window.dispatchEvent(new CustomEvent('auth:request', { detail: { flow: 'login' } })); showNote('Fluxo de entrada preparado para integração.'); }
    });
  });

  accountContinue.addEventListener('click', () => {
    if (!state.account) return;
    if (state.account === 'driver') { showDriverStep(1); return; }
    document.querySelector('[data-account-title]').textContent = 'Passageiro';
    showStep('form');
  });

  const phoneInput = form.querySelector('[name="phone"]');
  phoneInput.addEventListener('input', () => { phoneInput.value = formatPhone(phoneInput.value); });
  form.querySelector('.password-toggle').addEventListener('click', (event) => {
    const password = form.querySelector('[name="password"]');
    const visible = password.type === 'text'; password.type = visible ? 'password' : 'text';
    event.currentTarget.setAttribute('aria-label', visible ? 'Mostrar senha' : 'Ocultar senha');
  });

  document.querySelector('[data-login-toggle]').addEventListener('click', (event) => {
    const password = loginForm.querySelector('[name="loginPassword"]');
    const visible = password.type === 'text'; password.type = visible ? 'password' : 'text';
    event.currentTarget.setAttribute('aria-label', visible ? 'Mostrar senha' : 'Ocultar senha');
  });

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const identifier = loginForm.querySelector('[name="loginIdentifier"]').value.trim();
    const password = loginForm.querySelector('[name="loginPassword"]').value;
    const error = loginForm.querySelector('.login-error');
    error.textContent = '';
    if (!identifier || !password) { error.textContent = 'Digite seu e-mail ou número e sua senha para entrar.'; return; }
    try {
      await window.uberApi.login({ identifier, password });
    } catch (requestError) {
      error.textContent = requestError.message || 'Não foi possível entrar agora.';
      return;
    }
    startAppEntry('credentials');
  });

  document.querySelector('[data-google-login]').addEventListener('click', () => {
    loginForm.querySelector('.login-error').textContent = 'O login com Google precisa ser configurado no provedor OAuth do projeto.';
  });

  document.querySelector('[data-forgot-password]').addEventListener('click', (event) => {
    event.preventDefault();
    window.dispatchEvent(new CustomEvent('auth:password-reset'));
    loginForm.querySelector('.login-error').textContent = 'O fluxo de recuperação será conectado ao serviço de autenticação.';
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault(); formError.textContent = '';
    const data = Object.fromEntries(new FormData(form).entries()); const phoneDigits = (data.phone || '').replace(/\D/g, '');
    const missing = [['fullName', 'nome completo'], ['surname', 'sobrenome'], ['phone', 'telefone'], ['email', 'e-mail'], ['password', 'senha']].filter(([key]) => !String(data[key] || '').trim()).map(([, label]) => label);
    if (missing.length) { formError.textContent = `Preencha: ${missing.join(', ')}.`; form.querySelector(`[name="${missing[0] === 'nome completo' ? 'fullName' : missing[0] === 'sobrenome' ? 'surname' : missing[0] === 'telefone' ? 'phone' : missing[0] === 'e-mail' ? 'email' : 'password'}"]`)?.focus(); return; }
    if (phoneDigits.length < 10) { formError.textContent = 'Digite um telefone com DDD e pelo menos 10 números.'; return; }
    if (!/^\S+@\S+\.\S+$/.test(data.email || '')) { formError.textContent = 'Digite um e-mail válido.'; return; }
    if ((data.password || '').length < 8) { formError.textContent = 'A senha precisa ter pelo menos 8 caracteres.'; return; }
    if (!form.querySelector('[name="terms"]').checked) { formError.textContent = 'Marque a caixa para aceitar os Termos de Uso e a Política de Privacidade.'; return; }
    state.form = { ...data, phone: data.phone }; state.method = 'phone';
    try {
      await window.uberApi.register({ fullName: `${data.fullName} ${data.surname}`.trim(), phone: data.phone, email: data.email, password: data.password });
    } catch (requestError) {
      formError.textContent = requestError.message || 'Não foi possível criar sua conta agora.';
      return;
    }
    document.querySelectorAll('.method-option').forEach((item) => { const selected = item.dataset.method === state.method; item.classList.toggle('is-selected', selected); item.setAttribute('aria-checked', String(selected)); });
    window.dispatchEvent(new CustomEvent('auth:signup', { detail: { account: 'passenger', data: state.form } }));
    startAppEntry('signup');
  });

  document.querySelectorAll('.method-option').forEach((option) => option.addEventListener('click', () => {
    state.method = option.dataset.method;
    document.querySelectorAll('.method-option').forEach((item) => { const selected = item === option; item.classList.toggle('is-selected', selected); item.setAttribute('aria-checked', String(selected)); });
    updateVerificationCopy();
  }));

  codeInputs.forEach((input, index) => {
    input.addEventListener('input', () => { input.value = input.value.replace(/\D/g, '').slice(-1); if (input.value && codeInputs[index + 1]) codeInputs[index + 1].focus(); });
    input.addEventListener('keydown', (event) => { if (event.key === 'Backspace' && !input.value && codeInputs[index - 1]) codeInputs[index - 1].focus(); });
    input.addEventListener('paste', (event) => { const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6); if (!pasted) return; event.preventDefault(); pasted.split('').forEach((digit, digitIndex) => { if (codeInputs[digitIndex]) codeInputs[digitIndex].value = digit; }); codeInputs[Math.min(pasted.length, 6) - 1]?.focus(); });
  });
  resendButton.addEventListener('click', () => { if (!resendButton.disabled) { verifyError.textContent = 'O reenvio depende de um serviço de autenticação conectado.'; window.dispatchEvent(new CustomEvent('verification:resend', { detail: { method: state.method } })); } });
  document.querySelector('[data-verify]').addEventListener('click', () => { verifyError.textContent = ''; const code = codeInputs.map((input) => input.value).join(''); if (code.length !== 6) { verifyError.textContent = 'Digite os 6 dígitos recebidos para continuar.'; return; } verifyError.textContent = 'A verificação real depende de um serviço de autenticação conectado.'; window.dispatchEvent(new CustomEvent('verification:request', { detail: { method: state.method, code } })); });

  document.querySelectorAll('[data-driver-field="phone"]').forEach((input) => input.addEventListener('input', () => { input.value = formatPhone(input.value); }));
  document.querySelectorAll('[data-driver-field="cpf"]').forEach((input) => input.addEventListener('input', () => { const digits = input.value.replace(/\D/g, '').slice(0, 11); input.value = digits.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2'); }));
  document.querySelectorAll('[data-vehicle-field="plate"]').forEach((input) => input.addEventListener('input', () => { input.value = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7); if (input.value.length > 3 && !input.value.includes('-')) input.value = `${input.value.slice(0, 3)}-${input.value.slice(3)}`; }));
  document.querySelectorAll('.driver-password-toggle').forEach((button) => button.addEventListener('click', (event) => { const input = document.querySelector('[data-driver-field="password"]'); const visible = input.type === 'text'; input.type = visible ? 'password' : 'text'; event.currentTarget.setAttribute('aria-label', visible ? 'Mostrar senha' : 'Ocultar senha'); }));
  document.querySelectorAll('[data-upload]').forEach((input) => input.addEventListener('change', () => loadPreview(input)));
  document.querySelectorAll('[data-vehicle-icon]').forEach((image) => image.addEventListener('error', () => {
    image.hidden = true;
    const fallback = image.parentElement.querySelector('.vehicle-visual, [data-vehicle-fallback]');
    if (fallback) fallback.hidden = false;
  }, { once: true }));

  document.querySelectorAll('[data-driver-next]').forEach((button) => button.addEventListener('click', () => {
    const step = Number(button.dataset.driverNext); const error = validateDriverStep(step); setDriverError(step, error); if (error) return; showDriverStep(step + 1);
  }));
  document.querySelector('[data-driver-back]').addEventListener('click', () => { if (state.driverStep > 1) showDriverStep(state.driverStep - 1); else showStep('account'); });
  document.querySelectorAll('.vehicle-type').forEach((button) => button.addEventListener('click', () => { state.driver.vehicleType = button.dataset.vehicle; document.querySelectorAll('.vehicle-type').forEach((item) => item.classList.toggle('is-selected', item === button)); }));
  document.querySelector('[data-submit-driver]').addEventListener('click', () => {
    const missing = [1, 2, 3, 4, 5, 6].map(validateDriverStep).find(Boolean);
    if (missing) { setDriverError(7, missing); return; }
    if (state.submitting) return;
    state.submitting = true; const button = document.querySelector('[data-submit-driver]'); button.disabled = true; button.textContent = 'Preparando envio...';
    window.dispatchEvent(new CustomEvent('driver:submit', { detail: { state: { ...state.driver, uploads: Object.keys(state.driver.uploads) } } }));
    window.setTimeout(() => { button.disabled = false; button.textContent = 'Finalizar cadastro'; state.submitting = false; setDriverError(7, 'O envio real depende da integração segura com o servidor.'); }, 700);
  });
})();
