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
  userName: 'Guest',
  schema: null,
  validateDataset: null,
  validateMovie: null
};

const movieItemSchema = {
  type: 'object',
  required: ['id', 'title', 'director', 'genre', 'year', 'rating', 'actors', 'duration', 'language', 'country'],
  additionalProperties: false,
  properties: {
    id: { type: 'integer', minimum: 1 },
    title: { type: 'string', minLength: 1 },
    director: { type: 'string', minLength: 3 },
    genre: { type: 'string', enum: ['Action', 'Drama', 'Comedy', 'Sci-Fi', 'Thriller', 'Animation', 'Romance', 'Adventure', 'Fantasy', 'Horror'] },
    year: { type: 'integer', minimum: 1900, maximum: 2026 },
    rating: { type: 'number', minimum: 0, maximum: 10 },
    actors: { type: 'array', minItems: 1, items: { type: 'string', minLength: 2 } },
    duration: { type: 'integer', minimum: 40, maximum: 300 },
    language: { type: 'string', minLength: 2 },
    country: { type: 'string', minLength: 2 }
  }
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
  await loadSchema();
  await loadData();
  renderTable();
  renderStats();
}

async function loadSchema() {
  try {
    const response = await fetch('./schema.json');
    if (!response.ok) throw new Error('Could not load schema.json');
    state.schema = await response.json();
  } catch (error) {
    console.error('Failed to load schema:', error);
    state.schema = null;
  }

  const AjvConstructor = window.Ajv2020 || window.ajv2020;
  if (AjvConstructor && typeof AjvConstructor === 'function') {
    const ajv = new AjvConstructor({ allErrors: true, strict: false });
    if (state.schema) {
      state.validateDataset = ajv.compile(state.schema);
      state.validateMovie = ajv.compile(state.schema.properties.films.items);
    } else {
      // Fallback to hardcoded schema
      state.validateMovie = ajv.compile(movieItemSchema);
      state.validateDataset = ajv.compile({
        type: 'object',
        required: ['films'],
        additionalProperties: false,
        properties: {
          films: {
            type: 'array',
            minItems: 1,
            items: movieItemSchema
          }
        }
      });
    }
  }
}

async function loadData() {
  let sourceData;
  try {
    const response = await fetch('./data.json');
    if (!response.ok) throw new Error('Could not load data.json');
    sourceData = await response.json();
  } catch (error) {
    sourceData = { films: [...fallbackMovies] };
  }

  if (state.validateDataset) {
    const valid = state.validateDataset(sourceData);
    if (!valid) {
      console.warn('Schema validation errors:', state.validateDataset.errors);
      state.movies = [...fallbackMovies];
      return;
    }
  }

  state.movies = Array.isArray(sourceData.films) ? sourceData.films : [...fallbackMovies];
  state.filtered = [...state.movies];
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

function getAjvErrors(errors) {
  if (!errors || !errors.length) return 'Invalid data according to schema.';
  const first = errors[0];
  const path = first.instancePath ? first.instancePath.replaceAll('/', ' > ').replace(/^ > /, '') : 'field';
  return `${path}: ${first.message}`;
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

  // Pre-coercion presence check — catches blanks that Number('') would turn into 0
  const rawChecks = [
    { field: fields.title,    label: 'Title' },
    { field: fields.director, label: 'Director' },
    { field: fields.genre,    label: 'Genre' },
    { field: fields.year,     label: 'Year' },
    { field: fields.rating,   label: 'Rating' },
    { field: fields.duration, label: 'Duration' },
    { field: fields.language, label: 'Language' },
    { field: fields.country,  label: 'Country' },
    { field: fields.actors,   label: 'Actors' }
  ];
  for (const { field, label } of rawChecks) {
    if (!field.value.trim()) {
      formMessage.textContent = `${label} is required.`;
      field.focus();
      return;
    }
  }

  const actorList = fields.actors.value.split(',').map(a => a.trim()).filter(Boolean);
  if (actorList.length === 0 || actorList.some(a => a.length < 2)) {
    formMessage.textContent = 'Actors: provide at least one name (min 2 characters each).';
    fields.actors.focus();
    return;
  }

  const movie = getFormData();

  if (state.validateMovie) {
    const validMovie = state.validateMovie(movie);
    if (!validMovie) {
      formMessage.textContent = 'Schema validation failed: ' + getAjvErrors(state.validateMovie.errors);
      return;
    }
  }

  const nextMovies = state.editingId !== null
    ? state.movies.map(m => (m.id === state.editingId ? movie : m))
    : [...state.movies, movie];

  if (state.validateDataset) {
    const validDataset = state.validateDataset({ films: nextMovies });
    if (!validDataset) {
      formMessage.textContent = 'Dataset validation failed: ' + getAjvErrors(state.validateDataset.errors);
      return;
    }
  }

  if (state.editingId !== null) {
    const index = state.movies.findIndex(m => m.id === state.editingId);
    state.movies[index] = movie;
    formMessage.textContent = 'Movie updated successfully and validated by schema.';
  } else {
    state.movies.push(movie);
    formMessage.textContent = 'Movie added successfully and validated by schema.';
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
  const payload = { films: state.movies };
  if (state.validateDataset && !state.validateDataset(payload)) {
    formMessage.textContent = 'Export blocked because data does not match schema.';
    return;
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
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
  const nextMovies = state.movies.filter(m => m.id !== id);
  if (state.validateDataset && !state.validateDataset({ films: nextMovies })) {
    formMessage.textContent = 'Delete blocked because dataset would violate schema.';
    return;
  }
  state.movies = nextMovies;
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
