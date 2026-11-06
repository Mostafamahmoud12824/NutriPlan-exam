import * as api from "./api/nutriplan.js";
import * as foodLog from "./state/foodlog.js";
import * as ui from "./ui/components.js";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const state = {
  meals: [],
  categories: [],
  areaNames: [],
  products: [],
  productCategories: [],
  activeArea: "",
  activeCategory: "",
  query: "",
  activeProductCategory: "",
  productGrade: "",
  productsDescription: "",
  listView: false,
  showAllCategories: false,
  currentMealId: null,
  currentMeal: null,
  currentAnalysis: null,
};

function toast(title, icon = "success") {
  Swal.fire({ toast: true, position: "top-end", timer: 2000, showConfirmButton: false, icon, title });
}
async function askAmount(options) {
  const { value } = await Swal.fire({
    input: "number",
    showCancelButton: true,
    confirmButtonColor: "#059669",
    inputValidator: (value) => (Number(value) > 0 ? null : "Enter a number greater than 0"),
    ...options,
  });
  return value ? Number(value) : null;
}

function addToLog(item, nutrients, factor) {
  foodLog.addItem({
    ...item,
    calories: (nutrients.calories || 0) * factor,
    protein: (nutrients.protein || 0) * factor,
    carbs: (nutrients.carbs || 0) * factor,
    fat: (nutrients.fat || 0) * factor,
  });
}

// =========== navigation ============

const PAGES = {
  meals: {
    nav: 0,
    title: "Meals & Recipes",
    subtitle: "Discover delicious and nutritious recipes tailored for you",
    sections: ["search-filters-section", "meal-categories-section", "all-recipes-section"],
  },
  meal: {
    nav: 0,
    title: "Recipe Details",
    subtitle: "Ingredients, instructions and nutrition facts",
    sections: ["meal-details"],
  },
  products: {
    nav: 1,
    title: "Product Scanner",
    subtitle: "Search packaged foods and check their nutrition",
    sections: ["products-section"],
  },
  foodlog: {
    nav: 2,
    title: "Food Log",
    subtitle: "Track your daily nutrition intake",
    sections: ["foodlog-section"],
  },
};
const ALL_SECTIONS = Object.values(PAGES).flatMap((page) => page.sections);
const NAV_PATHS = ["meals", "products", "foodlog"];
const BASE_PATH = location.pathname.slice(0, location.pathname.lastIndexOf("/") + 1);

function navigate(path) {
  const url = BASE_PATH + path;
  if (location.pathname + location.search !== url) history.pushState(null, "", url);
  route();
}

function showPage(name) {
  const page = PAGES[name];
  ALL_SECTIONS.forEach((id) => $(`#${id}`).classList.toggle("hidden", !page.sections.includes(id)));

  $("#header h1").textContent = page.title;
  $("#header p").textContent = page.subtitle;

  $$(".nav-link").forEach((link, i) => {
    const active = i === page.nav;
    const text = link.querySelector("span");
    link.classList.toggle("bg-emerald-50", active);
    link.classList.toggle("text-emerald-700", active);
    link.classList.toggle("text-gray-600", !active);
    link.classList.toggle("hover:bg-gray-50", !active);
    text.classList.toggle("font-semibold", active);
    text.classList.toggle("font-medium", !active);
  });

  closeSidebar();
  window.scrollTo({ top: 0 });
}

function route() {
  const name = decodeURIComponent(location.pathname.slice(BASE_PATH.length));
  const mealId = new URLSearchParams(location.search).get("id");

  if (name === "meal" && mealId) {
    showPage("meal");
    openMeal(mealId);
  } else if (name === "products") {
    showPage("products");
  } else if (name === "foodlog") {
    showPage("foodlog");
    renderFoodLog();
  } else {
    showPage("meals");
  }
}

function openSidebar() {
  $("#sidebar").classList.add("open");
  $("#sidebar-overlay").classList.add("active");
}

function closeSidebar() {
  $("#sidebar").classList.remove("open");
  $("#sidebar-overlay").classList.remove("active");
}

// =========== meals ============

async function loadAreas() {
  try {
    const areas = await api.getMealAreas();
    state.areaNames = [...new Set(areas.map((area) => area.name.trim()))];
  } catch {
    state.areaNames = [];
  }
  renderAreas();
}

function renderAreas() {
  $("#area-filters").innerHTML = ["", ...state.areaNames]
    .map((name) => ui.areaButton(name, name === state.activeArea))
    .join("");
}

async function loadCategories() {
  $("#categories-grid").innerHTML = ui.loadingSpinner();
  try {
    state.categories = await api.getMealCategories();
    renderCategories();
  } catch (error) {
    $("#categories-grid").innerHTML = ui.errorState(error.message);
  }
}

function renderCategories() {
  const list = state.showAllCategories ? state.categories : state.categories.slice(0, 12);
  $("#categories-grid").innerHTML = list
    .map((category) => ui.categoryCard(category, category.name === state.activeCategory))
    .join("");

  const button = $("#view-all-categories");
  button.classList.toggle("hidden", state.categories.length <= 12);
  button.innerHTML = state.showAllCategories
    ? 'Show Less <i class="fa-solid fa-chevron-up text-xs"></i>'
    : 'View All <i class="fa-solid fa-chevron-right text-xs"></i>';
}

async function fetchMeals() {
  const { query, activeCategory, activeArea } = state;

  if (!query && (activeCategory || activeArea)) {
    const data = await api.filterMeals({ category: activeCategory, area: activeArea });
    return data.results || [];
  }

  const data = await api.searchMeals(query);
  return (data.results || []).filter(
    (meal) => (!activeArea || meal.area === activeArea) && (!activeCategory || meal.category === activeCategory)
  );
}

let mealsRequestId = 0;

async function loadMeals() {
  const requestId = ++mealsRequestId;
  $("#recipes-grid").innerHTML = ui.loadingSpinner();
  $("#recipes-count").textContent = "Loading recipes...";

  try {
    const meals = await fetchMeals();
    if (requestId !== mealsRequestId) return; 
    state.meals = meals;
    renderMeals();
  } catch (error) {
    if (requestId !== mealsRequestId) return;
    $("#recipes-grid").innerHTML = ui.errorState(error.message);
    $("#recipes-count").textContent = "Could not load recipes";
  }
}

function renderMeals() {
  const grid = $("#recipes-grid");
  grid.classList.toggle("grid-cols-4", !state.listView);
  grid.classList.toggle("grid-cols-1", state.listView);

  const filters = [state.activeCategory, state.activeArea].filter(Boolean).join(" · ");
  let label = `Showing ${state.meals.length} recipes`;
  if (state.query) label += ` for "${state.query}"`;
  if (filters) label += ` in ${filters}`;
  $("#recipes-count").textContent = label;

  grid.innerHTML = state.meals.length
    ? state.meals.map((meal) => ui.recipeCard(meal, state.listView)).join("")
    : ui.emptyState();
}

function styleViewButton(selector, active) {
  const button = $(selector);
  const icon = button.querySelector("i");
  button.classList.toggle("bg-white", active);
  button.classList.toggle("rounded-md", active);
  button.classList.toggle("shadow-sm", active);
  icon.classList.toggle("text-gray-700", active);
  icon.classList.toggle("text-gray-500", !active);
}

function setViewMode(listView) {
  state.listView = listView;
  styleViewButton("#grid-view-btn", !listView);
  styleViewButton("#list-view-btn", listView);
  renderMeals();
}

// =========== meal details ============

async function openMeal(id) {
  const container = $("#meal-details-content");
  state.currentMealId = id;
  state.currentMeal = null;
  state.currentAnalysis = null;
  container.innerHTML = ui.loadingSpinner();

  try {
    const meal = state.meals.find((m) => m.id === id) || (await api.getMealById(id));
    if (state.currentMealId !== id) return; 
    if (!meal) throw new Error("Recipe not found");

    state.currentMeal = meal;
    container.innerHTML = ui.mealDetails(meal);
    analyzeMeal(meal);
  } catch (error) {
    if (state.currentMealId !== id) return;
    container.innerHTML = ui.backButton() + ui.errorState(error.message);
  }
}

function cleanIngredient({ ingredient, measure }) {
  return `${measure || ""} ${ingredient}`
    .replace(/\([^)]*\)/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const ANALYSIS_CACHE_PREFIX = "nutriplan-analysis-";

function getCachedAnalysis(mealId) {
  try {
    return JSON.parse(localStorage.getItem(ANALYSIS_CACHE_PREFIX + mealId));
  } catch {
    return null;
  }
}

function cacheAnalysis(mealId, analysis) {
  try {
    localStorage.setItem(ANALYSIS_CACHE_PREFIX + mealId, JSON.stringify(analysis));
  } catch {
  }
}

async function analyzeMeal(meal) {
  const ingredients = meal.ingredients.map(cleanIngredient).filter(Boolean);
  try {
    const analysis = getCachedAnalysis(meal.id) || (await api.analyzeRecipe(meal.name, ingredients));
    if (state.currentMeal !== meal) return;

    cacheAnalysis(meal.id, analysis);
    state.currentAnalysis = analysis;
    $("#nutrition-facts-container").innerHTML = ui.nutritionFacts(analysis);
    $("#hero-servings").textContent = `${analysis.servings} servings`;
    $("#hero-calories").textContent = `${Math.round(analysis.perServing.calories)} cal/serving`;
  } catch (error) {
    if (state.currentMeal !== meal) return;
    const message = /429|400/.test(error.message)
      ? "USDA API limit reached. Try again later or use your own key."
      : error.message;
    $("#nutrition-facts-container").innerHTML = ui.nutritionError(message);
    $("#hero-calories").textContent = "N/A";
  }
}

function retryAnalysis() {
  if (!state.currentMeal) return;
  $("#nutrition-facts-container").innerHTML = ui.loadingSpinner();
  $("#hero-calories").textContent = "Calculating...";
  analyzeMeal(state.currentMeal);
}

async function promptUsdaKey() {
  const current = api.getUsdaKey();
  const { value: key } = await Swal.fire({
    title: "USDA API Key",
    html: `The shared DEMO_KEY is rate limited.<br>Get a free key at
      <a href="https://fdc.nal.usda.gov/api-key-signup.html" target="_blank" rel="noopener" style="color:#059669">fdc.nal.usda.gov</a>`,
    input: "text",
    inputValue: current === "DEMO_KEY" ? "" : current,
    inputPlaceholder: "Paste your API key",
    showCancelButton: true,
    confirmButtonText: "Save & Retry",
    confirmButtonColor: "#059669",
    inputValidator: (value) => (value.trim() ? null : "Enter a key"),
  });
  if (!key) return;
  api.setUsdaKey(key.trim());
  retryAnalysis();
}

async function logCurrentMeal() {
  const meal = state.currentMeal;
  const analysis = state.currentAnalysis;
  if (!meal) return;
  if (!analysis) {
    toast("Nutrition is still being calculated, please wait", "info");
    return;
  }

  const servings = await askAmount({
    title: `Log "${meal.name}"`,
    text: `${Math.round(analysis.perServing.calories)} kcal per serving`,
    inputValue: 1,
    inputLabel: "Number of servings",
    inputAttributes: { min: "0.25", step: "0.25" },
    confirmButtonText: "Log Meal",
  });
  if (!servings) return;

  const amount = `${servings} serving${servings === 1 ? "" : "s"}`;
  addToLog({ source: "meal", refId: meal.id, name: meal.name, amount }, analysis.perServing, servings);
  toast("Meal added to today's log");
}

// =========== products ============

async function loadProductCategories() {
  try {
    state.productCategories = await api.getProductCategories();
    renderProductCategories();
  } catch {
  }
}

function renderProductCategories() {
  $("#product-categories").innerHTML = state.productCategories
    .map((category) => ui.productCategoryButton(category, category.id === state.activeProductCategory))
    .join("");
}

let productsRequestId = 0;
async function loadProducts(request, description) {
  const requestId = ++productsRequestId;
  $("#products-grid").innerHTML = ui.loadingSpinner();
  $("#products-count").textContent = "Searching...";

  try {
    const products = await request;
    if (requestId !== productsRequestId) return; 
    state.products = products;
    state.productsDescription = description;
    renderProducts();
  } catch (error) {
    if (requestId !== productsRequestId) return;
    state.products = [];
    $("#products-grid").innerHTML = ui.errorState(error.message);
    $("#products-count").textContent = "No results";
  }
}

function renderProducts() {
  const grade = state.productGrade;
  const products = grade
    ? state.products.filter((product) => (product.nutritionGrade || "").toLowerCase() === grade)
    : state.products;

  $("#products-count").textContent = `Showing ${products.length} products ${state.productsDescription}`;
  $("#products-grid").innerHTML = products.length
    ? products.map(ui.productCard).join("")
    : ui.emptyState("No products found", "Try another search, category or Nutri-Score", "fa-box-open");
}

function searchProducts() {
  const query = $("#product-search-input").value.trim();
  if (!query) {
    toast("Type a product name to search", "info");
    return;
  }
  state.activeProductCategory = "";
  renderProductCategories();
  loadProducts(api.searchProducts(query).then((data) => data.results), `for "${query}"`);
}

function lookupBarcode() {
  const code = $("#barcode-input").value.trim();
  if (!/^\d{6,14}$/.test(code)) {
    toast("Enter a valid barcode (digits only)", "warning");
    return;
  }
  state.activeProductCategory = "";
  renderProductCategories();
  loadProducts(api.getProductByBarcode(code).then((product) => [product]), `for barcode ${code}`);
}

function loadProductCategory(categoryId) {
  state.activeProductCategory = categoryId;
  renderProductCategories();
  const category = state.productCategories.find((c) => c.id === categoryId);
  loadProducts(
    api.getProductsByCategory(categoryId).then((data) => data.results),
    `in ${category?.name || categoryId}`
  );
}

function setProductGrade(grade) {
  state.productGrade = grade;
  $$(".nutri-score-filter").forEach((button) => {
    const active = button.dataset.grade === grade;
    button.classList.toggle("ring-2", active);
    button.classList.toggle("ring-emerald-500", active);
  });
  if (state.productsDescription) renderProducts(); 
}

async function showProduct(barcode) {
  const product = state.products.find((p) => p.barcode === barcode);
  if (!product) return;

  const grams = await askAmount({
    title: ui.escapeHtml(product.name || "Product"),
    html: ui.productSummary(product),
    inputValue: 100,
    inputLabel: "Amount eaten (grams)",
    inputAttributes: { min: "1", step: "1" },
    confirmButtonText: "Log Product",
  });
  if (!grams) return;

  const item = { source: "product", refId: product.barcode, name: product.name || "Product", amount: `${grams}g` };
  addToLog(item, product.nutrients || {}, grams / 100); 
  toast("Product added to today's log");
}

// =========== food log ============

function renderFoodLog() {
  const items = foodLog.getItems();
  const totals = foodLog.getTotals(items);
  const goals = foodLog.DAILY_GOALS;

  $("#foodlog-date").textContent = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  $("#foodlog-progress").innerHTML =
    ui.progressCard("Calories", totals.calories, goals.calories, "kcal", "bg-emerald-50", "bg-emerald-500") +
    ui.progressCard("Protein", totals.protein, goals.protein, "g", "bg-blue-50", "bg-blue-500") +
    ui.progressCard("Carbs", totals.carbs, goals.carbs, "g", "bg-amber-50", "bg-amber-500") +
    ui.progressCard("Fat", totals.fat, goals.fat, "g", "bg-purple-50", "bg-purple-500");

  $("#logged-items-count").textContent = `Logged Items (${items.length})`;
  $("#clear-foodlog").style.display = items.length ? "" : "none";
  $("#logged-items-list").innerHTML = items.length ? items.map(ui.loggedItem).join("") : ui.emptyFoodLog();

  const week = foodLog.getWeek();
  renderWeeklyStats(week);
  renderWeeklyChart(week);
}

function renderWeeklyStats(week) {
  const loggedDays = week.filter((day) => day.calories > 0);

  const daysOnGoal = loggedDays.filter((day) => day.calories <= foodLog.DAILY_GOALS.calories).length;
  $("#days-on-goal").textContent = `${daysOnGoal} / 7`;
  const totalCalories = loggedDays.reduce((sum, day) => sum + day.calories, 0);
  const average = loggedDays.length ? totalCalories / loggedDays.length : 0;
  $("#weekly-average").textContent = `${Math.round(average)} kcal`;

  const itemsCount = week.reduce((sum, day) => sum + day.count, 0);
  $("#weekly-items").textContent = `${itemsCount} item${itemsCount === 1 ? "" : "s"}`;
}

function renderWeeklyChart(week) {
  if (typeof Plotly === "undefined") return; 

  const chart = $("#weekly-chart");
  const days = week.map(({ date }) => date.toLocaleDateString("en-US", { weekday: "short" }));
  const calories = week.map((day) => Math.round(day.calories));
  const goal = days.map(() => foodLog.DAILY_GOALS.calories);

  const caloriesBar = {
    type: "bar",
    x: days,
    y: calories,
    name: "Calories",
    marker: { color: "#10b981" },
    hovertemplate: "%{y} kcal<extra></extra>",
  };
  const goalLine = {
    type: "scatter",
    mode: "lines",
    x: days,
    y: goal,
    name: "Goal",
    line: { color: "#9ca3af", dash: "dash" },
    hoverinfo: "skip",
  };
  const layout = {
    height: 256,
    margin: { t: 10, r: 10, b: 30, l: 40 },
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
    showlegend: false,
    yaxis: { rangemode: "tozero", gridcolor: "#e5e7eb" },
    font: { family: "Inter, sans-serif", color: "#6b7280" },
  };

  chart.innerHTML = "";
  chart.classList.remove("flex", "items-center", "justify-center");
  Plotly.newPlot(chart, [caloriesBar, goalLine], layout, { displayModeBar: false, responsive: true });
}

async function clearFoodLog() {
  const { isConfirmed } = await Swal.fire({
    title: "Clear today's log?",
    text: "All items logged today will be removed.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Clear All",
    confirmButtonColor: "#ef4444",
  });
  if (!isConfirmed) return;
  foodLog.clearDay();
  renderFoodLog();
}

// =========== events ============

function bindEvents() {
  window.addEventListener("popstate", route);

  // sidebar
  $$(".nav-link").forEach((link, i) => {
    link.href = BASE_PATH + NAV_PATHS[i];
    link.addEventListener("click", (event) => {
      if (event.ctrlKey || event.metaKey || event.shiftKey) return; 
      event.preventDefault();
      navigate(NAV_PATHS[i]);
    });
  });
  $("#header-menu-btn").addEventListener("click", openSidebar);
  $("#sidebar-close-btn").addEventListener("click", closeSidebar);
  $("#sidebar-overlay").addEventListener("click", closeSidebar);

  // meals
  let searchTimer;
  $("#search-input").addEventListener("input", (event) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      state.query = event.target.value.trim();
      loadMeals();
    }, 400); 
  });

  $("#area-filters").addEventListener("click", (event) => {
    const button = event.target.closest(".area-btn");
    if (!button) return;
    state.activeArea = button.dataset.area;
    renderAreas();
    loadMeals();
  });

  $("#categories-grid").addEventListener("click", (event) => {
    const card = event.target.closest(".category-card");
    if (!card) return;
    const category = card.dataset.category;
    state.activeCategory = state.activeCategory === category ? "" : category;
    renderCategories();
    loadMeals();
    $("#all-recipes-section").scrollIntoView({ behavior: "smooth" });
  });

  $("#view-all-categories").addEventListener("click", () => {
    state.showAllCategories = !state.showAllCategories;
    renderCategories();
  });

  $("#recipes-grid").addEventListener("click", (event) => {
    const card = event.target.closest(".recipe-card");
    if (card) navigate(`meal?id=${encodeURIComponent(card.dataset.mealId)}`);
  });

  $("#grid-view-btn").addEventListener("click", () => setViewMode(false));
  $("#list-view-btn").addEventListener("click", () => setViewMode(true));
  $("#meal-details").addEventListener("click", (event) => {
    if (event.target.closest("#back-to-meals-btn")) navigate("meals");
    else if (event.target.closest("#log-meal-btn")) logCurrentMeal();
    else if (event.target.closest("#retry-analysis-btn")) retryAnalysis();
    else if (event.target.closest("#set-usda-key-btn")) promptUsdaKey();
  });

  // products
  $("#search-product-btn").addEventListener("click", searchProducts);
  $("#product-search-input").addEventListener("keydown", (event) => {
    if (event.key === "Enter") searchProducts();
  });
  $("#lookup-barcode-btn").addEventListener("click", lookupBarcode);
  $("#barcode-input").addEventListener("keydown", (event) => {
    if (event.key === "Enter") lookupBarcode();
  });

  $("#product-categories").addEventListener("click", (event) => {
    const button = event.target.closest(".product-category-btn");
    if (button?.dataset.category) loadProductCategory(button.dataset.category);
  });

  $$(".nutri-score-filter").forEach((button) => {
    button.addEventListener("click", () => setProductGrade(button.dataset.grade));
  });

  $("#products-grid").addEventListener("click", (event) => {
    const card = event.target.closest(".product-card");
    if (card) showProduct(card.dataset.barcode);
  });

  // food log
  $("#clear-foodlog").addEventListener("click", clearFoodLog);
  $("#logged-items-list").addEventListener("click", (event) => {
    const button = event.target.closest(".remove-log-item");
    if (!button) return;
    foodLog.removeItem(button.dataset.id);
    renderFoodLog();
  });
}

// =========== start ============

async function init() {
  bindEvents();
  route();

  $("#products-grid").innerHTML = ui.emptyState(
    "Search for products",
    "Search by name, scan a barcode or pick a category",
    "fa-barcode"
  );

  await Promise.allSettled([loadMeals(), loadCategories(), loadAreas(), loadProductCategories()]);

  const overlay = $("#app-loading-overlay");
  overlay.classList.add("opacity-0");
  setTimeout(() => overlay.classList.add("hidden"), 500);
}

init();
