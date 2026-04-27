const fallbackMovies = [
  { id: 1, title: 'Inception', director: 'Christopher Nolan', genre: 'Sci-Fi', year: 2010, rating: 8.8, actors: ['Leonardo DiCaprio', 'Joseph Gordon-Levitt', 'Elliot Page'], duration: 148, language: 'English', country: 'USA' },
  { id: 2, title: 'The Dark Knight', director: 'Christopher Nolan', genre: 'Action', year: 2008, rating: 9.0, actors: ['Christian Bale', 'Heath Ledger', 'Aaron Eckhart'], duration: 152, language: 'English', country: 'USA' },
  { id: 3, title: 'Interstellar', director: 'Christopher Nolan', genre: 'Sci-Fi', year: 2014, rating: 8.7, actors: ['Matthew McConaughey', 'Anne Hathaway', 'Jessica Chastain'], duration: 169, language: 'English', country: 'USA' },
  { id: 4, title: 'Parasite', director: 'Bong Joon-ho', genre: 'Thriller', year: 2019, rating: 8.5, actors: ['Song Kang-ho', 'Lee Sun-kyun', 'Cho Yeo-jeong'], duration: 132, language: 'Korean', country: 'South Korea' },
  { id: 5, title: 'Gladiator', director: 'Ridley Scott', genre: 'Action', year: 2000, rating: 8.5, actors: ['Russell Crowe', 'Joaquin Phoenix', 'Connie Nielsen'], duration: 155, language: 'English', country: 'USA' },
  { id: 6, title: 'The Shawshank Redemption', director: 'Frank Darabont', genre: 'Drama', year: 1994, rating: 9.3, actors: ['Tim Robbins', 'Morgan Freeman', 'Bob Gunton'], duration: 142, language: 'English', country: 'USA' },
  { id: 7, title: 'Spirited Away', director: 'Hayao Miyazaki', genre: 'Animation', year: 2001, rating: 8.6, actors: ['Rumi Hiiragi', 'Miyu Irino', 'Mari Natsuki'], duration: 125, language: 'Japanese', country: 'Japan' },
  { id: 8, title: 'Titanic', director: 'James Cameron', genre: 'Romance', year: 1997, rating: 7.9, actors: ['Leonardo DiCaprio', 'Kate Winslet', 'Billy Zane'], duration: 195, language: 'English', country: 'USA' }
];

const state = {
  movies: [],
  filtered: [],
  editingId: null,
  role: 'client',
  userName: 'Guest'
};

const loginScreen = document.getElementById('loginScreen');
const appView = document.getElementById('appView');
const loginForm = document.getElementById('loginForm');
const loginMessage = document.getElementById('loginMessage');
const adminCheck = document.getElementById('adminCheck');
const userNameInput = document.getElementById('userName');
const welcomeText = document.getElementById('welcomeText');
const roleText = document.getElementById('roleText');
const logoutBtn = document.getElementById('logoutBtn');
const form = document.getElementById('movieForm');
const formMessage = document.getElementById('formMessage');
const tbody = document.getElementById('movieTableBody');
const resetBtn = document.getElementById('resetBtn');
const searchInput = document.getElementById('searchInput');
const focusFormBtn = document.getElementById('focusFormBtn');
const downloadBtn = document.getElementById('downloadBtn');
const app = document.getElementById('app');
const modePill = document.getElementById('modePill');

const fields = {
  id: document.getElementById('movieId'),
  title: document.getElementById('title'),
  director: document.getElementById('director'),
  genre: document.getElementById('genre'),
  year: document.getElementById('year'),
  rating: document.getElementById('rating'),
  actors: document.getElementById('actors'),
  duration: document.getElementById('duration'),
  language: document.getElementById('language'),
  country: document.getElementById('country')
};

async function init() {
  initNoise();
  try {
    const response = await fetch('./data.json');
    if (!response.ok) throw new Error('Could not load data.json');
    const data = await response.json();
    state.movies = Array.isArray(data.films) ? data.films : [...fallbackMovies];
  } catch (error) {
    state.movies = [...fallbackMovies];
  }

  state.filtered = [...state.movies];
  renderTable();
  renderStats();
}

function enterApp(role, userName) {
  state.role = role;
  state.userName = userName || 'Guest';
  loginScreen.classList.add('hidden');
  appView.classList.remove('hidden');
  app.classList.toggle('client-mode', role === 'client');
  app.classList.toggle('admin-mode', role === 'admin');
  welcomeText.textContent = `Welcome ${state.userName}. You are currently using the ${role} view of the movie collection.`;
  roleText.textContent = role === 'admin' ? 'Admin mode active' : 'Client mode active';
  modePill.textContent = role === 'admin' ? 'Admin mode' : 'Client mode';
  modePill.style.background = role === 'admin' ? 'rgba(124,58,237,0.15)' : 'rgba(34,197,94,0.12)';
  modePill.style.borderColor = role === 'admin' ? 'rgba(124,58,237,0.28)' : 'rgba(34,197,94,0.25)';
  modePill.style.color = role === 'admin' ? '#ddd6fe' : '#bbf7d0';
  renderTable();
}

function logout() {
  state.role = 'client';
  state.userName = 'Guest';
  resetForm(false);
  loginForm.reset();
  loginMessage.textContent = '';
  appView.classList.add('hidden');
  loginScreen.classList.remove('hidden');
}

function validateMovie(movie) {
  if (!movie.title || !movie.director || !movie.genre || !movie.language || !movie.country) return 'Please fill in all required text fields.';
  if (!Number.isInteger(movie.year) || movie.year < 1900 || movie.year > 2026) return 'Year must be between 1900 and 2026.';
  if (isNaN(movie.rating) || movie.rating < 0 || movie.rating > 10) return 'Rating must be between 0 and 10.';
  if (!Number.isInteger(movie.duration) || movie.duration < 40 || movie.duration > 300) return 'Duration must be between 40 and 300 minutes.';
  if (!movie.actors.length) return 'Please enter at least one actor.';
  return '';
}

function getFormData() {
  return {
    id: fields.id.value ? Number(fields.id.value) : generateNextId(),
    title: fields.title.value.trim(),
    director: fields.director.value.trim(),
    genre: fields.genre.value,
    year: Number(fields.year.value),
    rating: Number(fields.rating.value),
    actors: fields.actors.value.split(',').map(a => a.trim()).filter(Boolean),
    duration: Number(fields.duration.value),
    language: fields.language.value.trim(),
    country: fields.country.value.trim()
  };
}

function generateNextId() {
  return state.movies.length ? Math.max(...state.movies.map(m => m.id)) + 1 : 1;
}

function renderTable(movies = state.filtered) {
  if (!movies.length) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="6">No movies found.</td></tr>';
    return;
  }

  tbody.innerHTML = movies.map(movie => `
    <tr>
      <td><strong>${escapeHtml(movie.title)}</strong><br><small>${escapeHtml(movie.country)} • ${escapeHtml(movie.language)}</small></td>
      <td>${escapeHtml(movie.director)}</td>
      <td><span class="badge">${escapeHtml(movie.genre)}</span></td>
      <td>${movie.year}</td>
      <td>${Number(movie.rating).toFixed(1)}</td>
      <td class="actions-cell">${state.role === 'admin' ? `
        <div class="actions">
          <button class="action-btn edit" type="button" onclick="editMovie(${movie.id})">Edit</button>
          <button class="action-btn delete" type="button" onclick="deleteMovie(${movie.id})">Delete</button>
        </div>` : ''}</td>
    </tr>
  `).join('');
}

function renderStats() {
  document.getElementById('totalMovies').textContent = state.movies.length;
  const avg = state.movies.length ? state.movies.reduce((sum, m) => sum + Number(m.rating), 0) / state.movies.length : 0;
  document.getElementById('avgRating').textContent = avg.toFixed(1);
  const genreCounts = state.movies.reduce((acc, movie) => {
    acc[movie.genre] = (acc[movie.genre] || 0) + 1;
    return acc;
  }, {});
  const topGenre = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';
  document.getElementById('topGenre').textContent = topGenre;
  document.getElementById('languageCount').textContent = new Set(state.movies.map(m => m.language)).size;
}

loginForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const userName = userNameInput.value.trim();
  if (!userName) {
    loginMessage.textContent = 'Please enter your name.';
    return;
  }
  const role = adminCheck.checked ? 'admin' : 'client';
  loginMessage.textContent = role === 'admin' ? 'Logged in as admin.' : 'Logged in as client.';
  setTimeout(() => enterApp(role, userName), 250);
});

logoutBtn.addEventListener('click', logout);

form.addEventListener('submit', (event) => {
  event.preventDefault();
  if (state.role !== 'admin') {
    formMessage.textContent = 'Only admin mode can edit the collection.';
    return;
  }

  const movie = getFormData();
  const error = validateMovie(movie);
  if (error) {
    formMessage.textContent = error;
    return;
  }

  if (state.editingId !== null) {
    const index = state.movies.findIndex(m => m.id === state.editingId);
    state.movies[index] = movie;
    formMessage.textContent = 'Movie updated successfully.';
  } else {
    state.movies.push(movie);
    formMessage.textContent = 'Movie added successfully.';
  }

  state.filtered = [...state.movies];
  renderTable();
  renderStats();
  resetForm(true);
});

resetBtn.addEventListener('click', () => resetForm(false));

searchInput.addEventListener('input', (event) => {
  const query = event.target.value.toLowerCase().trim();
  state.filtered = state.movies.filter(movie =>
    movie.title.toLowerCase().includes(query) ||
    movie.director.toLowerCase().includes(query) ||
    movie.genre.toLowerCase().includes(query)
  );
  renderTable();
});

focusFormBtn.addEventListener('click', () => {
  document.getElementById('app').scrollIntoView({ behavior: 'smooth' });
  if (state.role === 'admin') fields.title.focus();
  else searchInput.focus();
});

downloadBtn.addEventListener('click', () => {
  if (state.role !== 'admin') {
    formMessage.textContent = 'Only admin mode can export updated data.';
    return;
  }
  const blob = new Blob([JSON.stringify({ films: state.movies }, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'films-updated.json';
  a.click();
  URL.revokeObjectURL(url);
});

function resetForm(preserveMessage = false) {
  form.reset();
  fields.id.value = '';
  state.editingId = null;
  if (!preserveMessage) formMessage.textContent = '';
}

window.editMovie = function (id) {
  if (state.role !== 'admin') return;
  const movie = state.movies.find(m => m.id === id);
  if (!movie) return;
  state.editingId = id;
  fields.id.value = movie.id;
  fields.title.value = movie.title;
  fields.director.value = movie.director;
  fields.genre.value = movie.genre;
  fields.year.value = movie.year;
  fields.rating.value = movie.rating;
  fields.actors.value = movie.actors.join(', ');
  fields.duration.value = movie.duration;
  fields.language.value = movie.language;
  fields.country.value = movie.country;
  formMessage.textContent = 'Editing movie #' + id;
  fields.title.focus();
};

window.deleteMovie = function (id) {
  if (state.role !== 'admin') return;
  const confirmed = confirm('Delete this movie?');
  if (!confirmed) return;
  state.movies = state.movies.filter(m => m.id !== id);
  state.filtered = [...state.movies];
  if (state.editingId === id) resetForm(false);
  renderTable();
  renderStats();
  formMessage.textContent = 'Movie deleted successfully.';
};

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function initNoise() {
  const canvas = document.getElementById('noiseCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  function resize() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    draw();
  }

  function draw() {
    const imageData = ctx.createImageData(canvas.width, canvas.height);
    const buffer = imageData.data;
    for (let i = 0; i < buffer.length; i += 4) {
      const shade = Math.random() * 255;
      buffer[i] = shade;
      buffer[i + 1] = shade;
      buffer[i + 2] = shade;
      buffer[i + 3] = 18;
    }
    ctx.putImageData(imageData, 0, 0);
  }

  resize();
  window.addEventListener('resize', resize);
  setInterval(draw, 180);
}

init();
