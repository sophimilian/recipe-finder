// ===========================
// RECIPE FINDER — app.js
// ===========================

// --- API CONFIG ---
const API_KEY = 'c6367fa9e68b47d98c777786400e28b2';
const BASE_URL = 'https://api.spoonacular.com/recipes';

// --- STATE ---
let currentFilter = 'all';
let currentRecipes = [];
let savedRecipes = [];

// --- DOM REFS ---
const searchForm    = document.getElementById('searchForm');
const searchInput   = document.getElementById('searchInput');
const searchError   = document.getElementById('searchError');
const resultsGrid   = document.getElementById('resultsGrid');
const emptyState    = document.getElementById('emptyState');
const loader        = document.getElementById('loader');
const savedGrid     = document.getElementById('savedGrid');
const savedEmpty    = document.getElementById('savedEmpty');
const themeToggle   = document.getElementById('themeToggle');
const detailOverlay = document.getElementById('page-detail');
const btnBack       = document.getElementById('btnBack');
const btnSave       = document.getElementById('btnSave');

// ===========================
// NAVIGATION
// ===========================

function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  detailOverlay.classList.add('hidden');
  document.getElementById(`page-${pageId}`).classList.remove('hidden');

  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.dataset.page === pageId);
  });

  if (pageId === 'saved') renderSavedRecipes();
}

document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    showPage(link.dataset.page);
  });
});

// ===========================
// THEME TOGGLE
// ===========================

function toggleTheme() {
  const isDark = document.body.getAttribute('data-theme') === 'dark';
  document.body.setAttribute('data-theme', isDark ? '' : 'dark');
  themeToggle.textContent = isDark ? '🌙' : '☀️';
  localStorage.setItem('theme', isDark ? 'light' : 'dark');
}

const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
  document.body.setAttribute('data-theme', 'dark');
  themeToggle.textContent = '☀️';
}

themeToggle.addEventListener('click', toggleTheme);

// ===========================
// SEARCH & FORM VALIDATION
// ===========================

searchForm.addEventListener('submit', e => {
  e.preventDefault();
  const query = searchInput.value.trim();

  if (!query) {
    searchError.textContent = 'Please enter a dish, ingredient, or cuisine.';
    searchInput.focus();
    return;
  }
  if (query.length < 2) {
    searchError.textContent = 'Search must be at least 2 characters.';
    return;
  }

  searchError.textContent = '';
  fetchRecipes(query);
});

// ===========================
// FILTER BUTTONS
// ===========================

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderRecipes(currentRecipes);
  });
});

// ===========================
// API FETCH — Search
// ===========================

async function fetchRecipes(query) {
  showLoader(true);
  emptyState.style.display = 'none';
  resultsGrid.innerHTML = '';

  try {
    const dietParam = currentFilter !== 'all' ? `&diet=${encodeURIComponent(currentFilter)}` : '';
    const url = `${BASE_URL}/complexSearch?query=${encodeURIComponent(query)}&number=12&addRecipeInformation=true&apiKey=${API_KEY}${dietParam}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`API error: ${res.status}`);

    const data = await res.json();
    currentRecipes = data.results || [];

    renderRecipes(currentRecipes);
  } catch (err) {
    console.error('Fetch error:', err);
    emptyState.textContent = 'Something went wrong. Please try again.';
    emptyState.style.display = 'block';
  } finally {
    showLoader(false);
  }
}

// ===========================
// API FETCH — Full Recipe Detail
// ===========================

/**
 * Second API call to get ingredients + instructions.
 * complexSearch does NOT return these — we need a separate /information call.
 * @param {number} id - Spoonacular recipe ID
 */
async function fetchRecipeDetail(id) {
  const url = `${BASE_URL}/${id}/information?includeNutrition=false&apiKey=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Detail fetch error: ${res.status}`);
  return res.json();
}

// ===========================
// RENDER RECIPES
// ===========================

function renderRecipes(recipes) {
  resultsGrid.innerHTML = '';

  const filtered = currentFilter === 'all'
    ? recipes
    : recipes.filter(r => (r.diets || []).includes(currentFilter));

  if (filtered.length === 0) {
    emptyState.textContent = 'No recipes found. Try a different search or filter.';
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';

  filtered.forEach((recipe, i) => {
    const card = buildRecipeCard(recipe);
    card.style.animationDelay = `${i * 60}ms`;
    resultsGrid.appendChild(card);
  });
}

function buildRecipeCard(recipe) {
  const card = document.createElement('article');
  card.className = 'recipe-card';
  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');
  card.setAttribute('aria-label', `View recipe: ${recipe.title}`);

  const tags = (recipe.diets || []).slice(0, 3)
    .map(d => `<span class="tag">${d}</span>`)
    .join('');

  card.innerHTML = `
    <img src="${recipe.image || 'https://via.placeholder.com/300x180?text=No+Image'}"
         alt="${recipe.title}"
         loading="lazy" />
    <div class="card-body">
      <h3>${recipe.title}</h3>
      <div class="card-meta">
        <span>⏱ ${recipe.readyInMinutes || '?'} min</span>
        <span>👤 ${recipe.servings || '?'} servings</span>
      </div>
      <div class="card-tags">${tags}</div>
    </div>
  `;

  card.addEventListener('click', () => openDetail(recipe));
  card.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') openDetail(recipe);
  });

  return card;
}

// ===========================
// RECIPE DETAIL VIEW
// ===========================

let currentDetailRecipe = null;

/**
 * Open detail overlay immediately with basic info,
 * then fire a second API call to load ingredients + instructions.
 */
async function openDetail(recipe) {
  // Show overlay right away
  detailOverlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  // Populate what we already have from the search result
  document.getElementById('detailTitle').textContent = recipe.title;
  document.getElementById('detailImage').src = recipe.image || '';
  document.getElementById('detailImage').alt = recipe.title;
  document.getElementById('detailMeta').innerHTML = '';
  document.getElementById('detailTags').innerHTML = '';
  document.getElementById('detailIngredients').innerHTML = '<li>Loading ingredients...</li>';
  document.getElementById('detailInstructions').innerHTML = '<p>Loading instructions...</p>';

  try {
    // Second call — gets extendedIngredients and instructions
    const full = await fetchRecipeDetail(recipe.id);
    currentDetailRecipe = full;

    // Meta
    document.getElementById('detailMeta').innerHTML = `
      <span>⏱ ${full.readyInMinutes || '?'} min</span>
      <span>👤 ${full.servings || '?'} servings</span>
      <span>❤️ ${full.aggregateLikes || 0} likes</span>
    `;

    // Diet tags
    const tags = (full.diets || [])
      .map(d => `<span class="tag">${d}</span>`)
      .join('');
    document.getElementById('detailTags').innerHTML = tags;

    // Ingredients
    const ingredientsList = document.getElementById('detailIngredients');
    ingredientsList.innerHTML = '';
    if (full.extendedIngredients && full.extendedIngredients.length > 0) {
      full.extendedIngredients.forEach(ing => {
        const li = document.createElement('li');
        li.textContent = ing.original;
        ingredientsList.appendChild(li);
      });
    } else {
      ingredientsList.innerHTML = '<li>No ingredients available.</li>';
    }

    // Instructions — Spoonacular returns HTML strings
    const instructions = full.instructions || 'Instructions not available for this recipe.';
    document.getElementById('detailInstructions').innerHTML = instructions;

    updateSaveButton(full.id);

  } catch (err) {
    console.error('Detail fetch error:', err);
    document.getElementById('detailIngredients').innerHTML = '<li>Could not load ingredients.</li>';
    document.getElementById('detailInstructions').innerHTML = 'Could not load instructions.';
  }
}

btnBack.addEventListener('click', () => {
  detailOverlay.classList.add('hidden');
  document.body.style.overflow = '';
  currentDetailRecipe = null;
});

// ===========================
// LOCAL STORAGE — Save Recipes
// ===========================

function loadSavedRecipes() {
  const stored = localStorage.getItem('savedRecipes');
  savedRecipes = stored ? JSON.parse(stored) : [];
}

function persistSaved() {
  localStorage.setItem('savedRecipes', JSON.stringify(savedRecipes));
}

function toggleSave(recipe) {
  const index = savedRecipes.findIndex(r => r.id === recipe.id);
  if (index === -1) {
    savedRecipes.push(recipe);
  } else {
    savedRecipes.splice(index, 1);
  }
  persistSaved();
  updateSaveButton(recipe.id);
}

function updateSaveButton(recipeId) {
  const isSaved = savedRecipes.some(r => r.id === recipeId);
  btnSave.textContent = isSaved ? '♥ Saved!' : '♡ Save Recipe';
  btnSave.classList.toggle('saved', isSaved);
}

btnSave.addEventListener('click', () => {
  if (currentDetailRecipe) toggleSave(currentDetailRecipe);
});

function renderSavedRecipes() {
  savedGrid.innerHTML = '';
  if (savedRecipes.length === 0) {
    savedEmpty.style.display = 'block';
    return;
  }
  savedEmpty.style.display = 'none';
  savedRecipes.forEach(recipe => {
    const card = buildRecipeCard(recipe);
    savedGrid.appendChild(card);
  });
}

// ===========================
// UTILITIES
// ===========================

function showLoader(show) {
  loader.classList.toggle('hidden', !show);
}

// ===========================
// INIT
// ===========================
loadSavedRecipes();