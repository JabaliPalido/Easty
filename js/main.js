/* Interacciones pequeñas de EATSY: contador, filtros y personalización de plato. */
document.addEventListener('DOMContentLoaded', () => {
  const countLabels = document.querySelectorAll('.cart-count');
  const readSavedCartCount = () => {
    try { return Number(sessionStorage.getItem('eatsy-cart-count')) || 0; }
    catch { return 0; }
  };
  let cartCount = readSavedCartCount();

  const updateCart = () => {
    countLabels.forEach((label) => { label.textContent = String(cartCount); });
    try { sessionStorage.setItem('eatsy-cart-count', String(cartCount)); } catch { /* El contador sigue funcionando sin almacenamiento. */ }
  };
  updateCart();

  document.querySelectorAll('[data-add-cart]').forEach((button) => {
    button.addEventListener('click', () => {
      cartCount += 1;
      updateCart();
      const originalLabel = button.dataset.originalLabel || button.textContent.trim();
      button.dataset.originalLabel = originalLabel;
      button.textContent = 'Añadido ✓';
      button.classList.add('is-added');
      window.setTimeout(() => {
        button.textContent = originalLabel;
        button.classList.remove('is-added');
      }, 1500);
    });
  });

  // Búsqueda y filtro para las tarjetas del catálogo.
  const productCards = Array.from(document.querySelectorAll('.product-card'));
  const filterSelect = document.querySelector('#catalog-filter');
  const searchInputs = document.querySelectorAll('.site-search');
  const noResults = document.querySelector('.no-results');

  const filterCatalog = () => {
    if (!productCards.length) return;
    const filterValue = filterSelect ? filterSelect.value : 'all';
    const query = Array.from(searchInputs).map((input) => input.value.trim().toLocaleLowerCase('es')).find(Boolean) || '';
    let visible = 0;
    productCards.forEach((card) => {
      const tags = (card.dataset.tags || '').split(/\s+/);
      const searchableText = card.textContent.toLocaleLowerCase('es');
      const matchesTag = filterValue === 'all' || tags.includes(filterValue);
      const matchesQuery = !query || searchableText.includes(query);
      const shouldShow = matchesTag && matchesQuery;
      card.hidden = !shouldShow;
      if (shouldShow) visible += 1;
    });
    if (noResults) noResults.hidden = visible > 0;
    document.querySelectorAll('.catalog-section').forEach((section) => {
      const sectionCards = Array.from(section.querySelectorAll('.product-card'));
      section.hidden = sectionCards.length > 0 && sectionCards.every((card) => card.hidden);
    });
  };

  if (filterSelect) filterSelect.addEventListener('change', filterCatalog);
  searchInputs.forEach((input) => input.addEventListener('input', filterCatalog));

  // Controles +/- y actualización del importe en el detalle del plato.
  const totalOutput = document.querySelector('#total-price');
  const dishForm = document.querySelector('#dish-form');
  const initialTotal = 30.90;
  const qtyStartValues = new Map();
  const quantityInputs = Array.from(document.querySelectorAll('.quantity-control input'));
  quantityInputs.forEach((input) => qtyStartValues.set(input.id, Number(input.value) || 0));

  const updateTotal = () => {
    if (!totalOutput || !dishForm) return;
    let total = initialTotal;
    quantityInputs.forEach((input) => {
      const current = Math.max(Number(input.min) || 0, Number(input.value) || 0);
      const original = qtyStartValues.get(input.id) || 0;
      const price = Number(input.dataset.price) || 0;
      total += (current - original) * price;
    });
    totalOutput.value = Math.max(0, total).toFixed(2);
    totalOutput.textContent = Math.max(0, total).toFixed(2);
  };

  document.querySelectorAll('[data-qty-change]').forEach((button) => {
    button.addEventListener('click', () => {
      const input = document.getElementById(button.dataset.target);
      if (!input) return;
      const minimum = input.min === '' ? 0 : Number(input.min);
      const maximum = input.max === '' ? 99 : Number(input.max);
      const nextValue = Math.min(maximum, Math.max(minimum, (Number(input.value) || 0) + Number(button.dataset.qtyChange)));
      input.value = String(nextValue);
      updateTotal();
    });
  });
  quantityInputs.forEach((input) => input.addEventListener('change', () => {
    const min = input.min === '' ? 0 : Number(input.min);
    const max = input.max === '' ? 99 : Number(input.max);
    input.value = String(Math.min(max, Math.max(min, Number(input.value) || 0)));
    updateTotal();
  }));

  // Campo adicional opcional para cada alergia.
  document.querySelectorAll('[data-allergy-note]').forEach((button) => {
    button.addEventListener('click', () => {
      const note = document.getElementById(button.dataset.allergyNote);
      if (!note) return;
      note.hidden = !note.hidden;
      if (!note.hidden) note.focus();
    });
  });

  if (dishForm) {
    dishForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const dishQuantity = Number(document.querySelector('#dish-quantity')?.value) || 1;
      cartCount += dishQuantity;
      updateCart();
      const submitButton = dishForm.querySelector('[type="submit"]');
      if (submitButton) {
        const original = submitButton.textContent;
        submitButton.textContent = '¡Añadido al carrito!';
        submitButton.disabled = true;
        window.setTimeout(() => {
          submitButton.textContent = original;
          submitButton.disabled = false;
        }, 1800);
      }
    });
  }

  // Los siguientes formularios son demostraciones visuales: no consultan un servidor.
  const loginForm = document.querySelector('#login-form');
  const loginStatus = document.querySelector('#login-status');
  const showLoginStatus = (message) => {
    if (loginStatus) loginStatus.textContent = message;
  };

  if (loginForm) {
    loginForm.addEventListener('submit', (event) => {
      event.preventDefault();
      showLoginStatus('Vista de demostración: conecta un servicio de autenticación para validar tu cuenta.');
    });
  }

  document.querySelector('[data-google-login]')?.addEventListener('click', () => {
    showLoginStatus('El acceso con Google es visual; para activarlo debes configurar la autenticación de Google.');
  });

  document.querySelector('[data-forgot-password]')?.addEventListener('click', (event) => {
    event.preventDefault();
    showLoginStatus('La recuperación de contraseña requiere conectar un servicio de correo.');
  });

  const registerForm = document.querySelector('#register-form');
  const registerStatus = document.querySelector('#register-status');
  if (registerForm) {
    registerForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const password = registerForm.querySelector('#register-password');
      const repeat = registerForm.querySelector('#repeat-password');
      if (password && repeat && password.value !== repeat.value) {
        repeat.setCustomValidity('Las contraseñas no coinciden.');
        repeat.reportValidity();
        repeat.addEventListener('input', () => repeat.setCustomValidity(''), { once: true });
        if (registerStatus) registerStatus.textContent = 'Revisa la confirmación de contraseña.';
        return;
      }
      if (registerStatus) registerStatus.textContent = 'Formulario validado visualmente. Para crear una cuenta real, conecta un servicio de usuarios.';
    });
  }

  const paymentForm = document.querySelector('#payment-form');
  const paymentStatus = document.querySelector('#payment-status');
  if (paymentForm) {
    paymentForm.addEventListener('submit', (event) => {
      event.preventDefault();
      if (paymentStatus) paymentStatus.textContent = 'Selección validada en esta demostración. No se ha realizado ningún cobro.';
    });
  }
});
