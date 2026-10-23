const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const toast = $('#toast');
let toastTimer;
function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
}

// Mobile navigation
$('#menuToggle').addEventListener('click', () => {
  const open = $('#navLinks').classList.toggle('open');
  $('#menuToggle').textContent = open ? '×' : '☰';
  $('#menuToggle').setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
});
$$('#navLinks a').forEach(link => link.addEventListener('click', () => {
  $('#navLinks').classList.remove('open');
  $('#menuToggle').textContent = '☰';
}));

// Dark mode remembers the visitor's preference.
const savedTheme = localStorage.getItem('indiaExploraTheme');
if (savedTheme === 'dark') document.body.classList.add('dark-mode');
function updateThemeIcon() { $('#themeToggle').textContent = document.body.classList.contains('dark-mode') ? '☀' : '☾'; }
updateThemeIcon();
$('#themeToggle').addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
  const theme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
  localStorage.setItem('indiaExploraTheme', theme);
  updateThemeIcon();
  showToast(`${theme === 'dark' ? 'Dark' : 'Light'} mode enabled`);
});

// Favorites persist between visits.
let favorites = JSON.parse(localStorage.getItem('indiaExploraFavorites') || '[]');
function renderFavorites() {
  $$('.favorite-btn').forEach(button => {
    const saved = favorites.includes(button.dataset.favorite);
    button.classList.toggle('saved', saved);
    button.textContent = saved ? '♥' : '♡';
    button.setAttribute('aria-pressed', String(saved));
  });
  $('#favoriteCount').textContent = favorites.length;
}
renderFavorites();
$$('.favorite-btn').forEach(button => button.addEventListener('click', event => {
  event.stopPropagation();
  const name = button.dataset.favorite;
  favorites = favorites.includes(name) ? favorites.filter(item => item !== name) : [...favorites, name];
  localStorage.setItem('indiaExploraFavorites', JSON.stringify(favorites));
  renderFavorites();
  showToast(favorites.includes(name) ? `${name} saved to your favourites ♥` : `${name} removed from favourites`);
}));
$('#openFavorites').addEventListener('click', () => {
  if (!favorites.length) return showToast('Your saved list is empty — tap a heart on any destination to save it.');
  showToast(`Your saved places: ${favorites.join(' · ')}`);
  $$('.destination-card').forEach(card => card.classList.toggle('favorite-highlight', favorites.includes(card.querySelector('.favorite-btn')?.dataset.favorite)));
  $('#destinations').scrollIntoView({ behavior: 'smooth' });
});

// Destination filters and search.
let currentFilter = 'All';
let expanded = false;
function filterCards(query = '') {
  const cards = $$('.destination-card');
  let visible = 0;
  cards.forEach(card => {
    const categories = card.dataset.category.split(' ');
    const matchesFilter = currentFilter === 'All' || categories.includes(currentFilter);
    const matchesQuery = !query || (card.dataset.name + ' ' + card.dataset.place).toLowerCase().includes(query.toLowerCase());
    const isExtra = card.classList.contains('extra-card');
    const shouldShow = matchesFilter && matchesQuery && (expanded || !isExtra || query.length > 0 || currentFilter !== 'All');
    card.style.display = shouldShow ? '' : 'none';
    if (shouldShow) visible++;
  });
  $('#emptyState').hidden = visible > 0;
  $('#showMore').style.display = (currentFilter !== 'All' || query) ? 'none' : '';
}
$$('.filter-chip').forEach(chip => chip.addEventListener('click', () => {
  $$('.filter-chip').forEach(item => item.classList.toggle('active', item === chip));
  currentFilter = chip.dataset.filter;
  filterCards($('#searchPlace').value.trim());
}));
$('#showMore').addEventListener('click', () => {
  expanded = !expanded;
  $('#destinationGrid').classList.toggle('expanded', expanded);
  $('#showMore').innerHTML = expanded ? 'Show fewer places <span>↑</span>' : 'Discover more places <span>↓</span>';
  filterCards($('#searchPlace').value.trim());
});
$('#viewAll').addEventListener('click', event => {
  event.preventDefault();
  expanded = true;
  $('#destinationGrid').classList.add('expanded');
  currentFilter = 'All';
  $$('.filter-chip').forEach(item => item.classList.toggle('active', item.dataset.filter === 'All'));
  $('#showMore').innerHTML = 'Show fewer places <span>↑</span>';
  filterCards('');
});
$$('[data-search]').forEach(button => button.addEventListener('click', () => {
  $('#searchPlace').value = button.dataset.search;
  $('#tripSearch').requestSubmit();
}));
$('#tripSearch').addEventListener('submit', event => {
  event.preventDefault();
  const query = $('#searchPlace').value.trim();
  if (!query) {
    $('#searchPlace').focus();
    showToast('Enter a destination or try one of the popular searches.');
    return;
  }
  expanded = true;
  $('#destinationGrid').classList.add('expanded');
  currentFilter = 'All';
  $$('.filter-chip').forEach(item => item.classList.toggle('active', item.dataset.filter === 'All'));
  filterCards(query);
  $('#destinations').scrollIntoView({ behavior: 'smooth' });
  const matches = $$('.destination-card').filter(card => card.style.display !== 'none').length;
  showToast(matches ? `${matches} destination${matches === 1 ? '' : 's'} found for “${query}”. Choose a card to plan your visit.` : `No exact match for “${query}”. Try Goa, Kerala, Jaipur or Ladakh.`);
});

// Clicking a destination suggests a simple itinerary-planning next step.
$$('.destination-card').forEach(card => card.addEventListener('click', event => {
  if (event.target.closest('.favorite-btn')) return;
  const title = $('h3', card).textContent;
  const place = card.dataset.place;
  openModal('tripModal', title, `Let's start planning your journey to ${place}.`, title);
}));

// Modals: demo-only login/signup and trip enquiry; no account data is sent anywhere.
let modalMode = 'login';
function openModal(mode, destination = '', description = '') {
  modalMode = mode;
  const backdrop = $('#modalBackdrop');
  const title = $('#modalTitle');
  const desc = $('#modalDescription');
  const nameLabel = $('#modalNameLabel');
  const form = $('#modalForm');
  form.reset();
  if (mode === 'login') {
    title.textContent = 'Welcome back'; desc.textContent = 'Sign in to keep your travel inspiration close.';
    nameLabel.hidden = true; $('#modalSubmit').textContent = 'Log in ↗'; $('#modalSwitch').textContent = 'Demo interface only — no real account is created.';
  } else if (mode === 'signup') {
    title.textContent = 'Your next story awaits'; desc.textContent = 'Create your traveller profile and start dreaming.';
    nameLabel.hidden = false; $('#modalSubmit').textContent = 'Create my account ↗'; $('#modalSwitch').textContent = 'Demo interface only — no information is sent to a server.';
  } else {
    title.textContent = `Plan ${destination}`; desc.textContent = description || 'Tell us where to send your trip idea.';
    nameLabel.hidden = false; $('#modalSubmit').textContent = 'Save trip idea ↗'; $('#modalSwitch').textContent = 'This is a portfolio demo. Your enquiry stays in this browser session.';
    $('#modalName').placeholder = 'Your name';
  }
  backdrop.hidden = false;
  setTimeout(() => (mode === 'signup' || mode === 'tripModal' ? $('#modalName') : $('#modalEmail')).focus(), 50);
}
$$('[data-modal]').forEach(button => button.addEventListener('click', () => openModal(button.dataset.modal === 'signupModal' ? 'signup' : 'login')));
$$('.plan-package').forEach(button => button.addEventListener('click', () => openModal('tripModal', button.dataset.package, `Let's make ${button.dataset.package} your next great story.`)));
$('#closeModal').addEventListener('click', () => { $('#modalBackdrop').hidden = true; });
$('#modalBackdrop').addEventListener('click', event => { if (event.target === $('#modalBackdrop')) $('#modalBackdrop').hidden = true; });
document.addEventListener('keydown', event => { if (event.key === 'Escape') $('#modalBackdrop').hidden = true; });
$('#modalForm').addEventListener('submit', event => {
  event.preventDefault();
  if (modalMode === 'tripModal') {
    showToast(`Trip idea saved for ${$('#modalName').value || 'traveller'}! Connect a backend to receive real enquiries.`);
  } else {
    showToast(modalMode === 'signup' ? 'Nice! The sign-up demo is working. Add a backend for real accounts.' : 'Login demo complete. Connect authentication for real accounts.');
  }
  $('#modalBackdrop').hidden = true;
});

// Newsletter validates input and gives a clear demo response.
$('#newsletterForm').addEventListener('submit', event => {
  event.preventDefault();
  const email = $('#emailAddress').value.trim();
  if (!email) return;
  $('#newsletterMessage').textContent = `Thanks! ${email} is on the demo list — connect a mailing service to activate subscriptions.`;
  $('#newsletterMessage').style.color = 'var(--blue)';
  $('#emailAddress').value = '';
  showToast('You are on the list in this demo — happy travels!');
});

// Keep the travel date from defaulting to a date in the past.
const today = new Date();
const localToday = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
$('#travelDate').min = localToday;
