// =========== helpers ============

const HTML_ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
}

function round(n) {
  return Math.round(Number(n) || 0);
}

function roundOne(n) {
  return Math.round((Number(n) || 0) * 10) / 10;
}

function percentOf(value, goal) {
  return Math.min(100, round((value / goal) * 100));
}

// =========== shared ============

export function loadingSpinner() {
  return `
    <div class="col-span-full flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
    </div>`;
}

export function emptyState(
  title = "No recipes found",
  subtitle = "Try searching for something else",
  icon = "fa-search"
) {
  return `
    <div class="col-span-full flex flex-col items-center justify-center py-12 text-center">
      <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <i class="fa-solid ${icon} text-gray-400 text-2xl"></i>
      </div>
      <p class="text-gray-500 text-lg">${escapeHtml(title)}</p>
      <p class="text-gray-400 text-sm mt-2">${escapeHtml(subtitle)}</p>
    </div>`;
}

export function errorState(message) {
  return emptyState("Something went wrong", message, "fa-triangle-exclamation");
}

export function backButton() {
  return `
    <button id="back-to-meals-btn"
      class="flex items-center gap-2 text-gray-600 hover:text-emerald-600 font-medium mb-6 transition-colors">
      <i class="fa-solid fa-arrow-left"></i>
      <span>Back to Recipes</span>
    </button>`;
}

// =========== meals ============

export function areaButton(name, active) {
  const colors = active
    ? "bg-emerald-600 text-white hover:bg-emerald-700"
    : "bg-gray-100 text-gray-700 hover:bg-gray-200";
  return `
    <button class="area-btn px-4 py-2 ${colors} rounded-full font-medium text-sm whitespace-nowrap transition-all"
      data-area="${escapeHtml(name)}">
      ${name ? escapeHtml(name) : "All Recipes"}
    </button>`;
}

const CATEGORY_STYLES = {
  Beef: ["fa-drumstick-bite", "from-red-50 to-rose-50 border-red-200 hover:border-red-400", "from-red-400 to-rose-500"],
  Chicken: ["fa-drumstick-bite", "from-amber-50 to-orange-50 border-amber-200 hover:border-amber-400", "from-amber-400 to-orange-500"],
  Dessert: ["fa-ice-cream", "from-pink-50 to-rose-50 border-pink-200 hover:border-pink-400", "from-pink-400 to-rose-500"],
  Lamb: ["fa-bone", "from-orange-50 to-red-50 border-orange-200 hover:border-orange-400", "from-orange-400 to-red-500"],
  Miscellaneous: ["fa-bowl-food", "from-slate-50 to-gray-50 border-slate-200 hover:border-slate-400", "from-slate-400 to-gray-500"],
  Pasta: ["fa-plate-wheat", "from-yellow-50 to-amber-50 border-yellow-200 hover:border-yellow-400", "from-yellow-400 to-amber-500"],
  Pork: ["fa-bacon", "from-rose-50 to-red-50 border-rose-200 hover:border-rose-400", "from-rose-400 to-red-500"],
  Seafood: ["fa-fish", "from-cyan-50 to-blue-50 border-cyan-200 hover:border-cyan-400", "from-cyan-400 to-blue-500"],
  Side: ["fa-carrot", "from-green-50 to-emerald-50 border-green-200 hover:border-green-400", "from-green-400 to-emerald-500"],
  Starter: ["fa-bowl-rice", "from-teal-50 to-cyan-50 border-teal-200 hover:border-teal-400", "from-teal-400 to-cyan-500"],
  Vegan: ["fa-leaf", "from-lime-50 to-green-50 border-lime-200 hover:border-lime-400", "from-lime-400 to-green-500"],
  Vegetarian: ["fa-seedling", "from-emerald-50 to-teal-50 border-emerald-200 hover:border-emerald-400", "from-emerald-400 to-teal-500"],
  Breakfast: ["fa-mug-hot", "from-yellow-50 to-orange-50 border-yellow-200 hover:border-yellow-400", "from-yellow-400 to-orange-500"],
  Goat: ["fa-cow", "from-stone-50 to-gray-50 border-stone-200 hover:border-stone-400", "from-stone-400 to-gray-500"],
  default: ["fa-utensils", "from-emerald-50 to-teal-50 border-emerald-200 hover:border-emerald-400", "from-emerald-400 to-green-500"],
};

export function categoryCard(category, active) {
  const [icon, cardColors, iconColors] = CATEGORY_STYLES[category.name] || CATEGORY_STYLES.default;
  const ring = active ? "ring-2 ring-emerald-500 shadow-md" : "";
  return `
    <div class="category-card bg-gradient-to-br ${cardColors} ${ring} rounded-xl p-3 border hover:shadow-md cursor-pointer transition-all group"
      data-category="${escapeHtml(category.name)}">
      <div class="flex items-center gap-2.5">
        <div class="w-9 h-9 bg-gradient-to-br ${iconColors} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
          <i class="fa-solid ${icon} text-sm text-white"></i>
        </div>
        <div>
          <h3 class="text-sm font-bold text-gray-900">${escapeHtml(category.name)}</h3>
        </div>
      </div>
    </div>`;
}

function badge(text, colors) {
  if (!text) return "";
  return `<span class="px-2 py-1 ${colors} text-xs font-semibold rounded-full">${escapeHtml(text)}</span>`;
}

export function recipeCard(meal, listView = false, favorite = false) {
  const description = meal.instructions?.[0] || "Delicious recipe to try!";
  const layout = listView ? "flex" : "";
  const imageBox = listView ? "w-48 shrink-0" : "h-48";
  const heart = favorite ? "fa-solid fa-heart text-red-500" : "fa-regular fa-heart text-gray-400";

  return `
    <div class="recipe-card bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group ${layout}"
      data-meal-id="${escapeHtml(meal.id)}">
      <div class="relative ${imageBox} overflow-hidden">
        <img class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          src="${escapeHtml(meal.thumbnail)}" alt="${escapeHtml(meal.name)}" loading="lazy" />
        <button class="favorite-btn absolute top-2 right-2 w-9 h-9 rounded-full bg-white/90 shadow-sm flex items-center justify-center hover:text-red-500"
          data-meal-id="${escapeHtml(meal.id)}" title="${favorite ? "Remove from Favorites" : "Add to Favorites"}">
          <i class="${heart}"></i>
        </button>
        <div class="absolute bottom-3 left-3 flex gap-2">
          ${badge(meal.category, "bg-white/90 backdrop-blur-sm text-gray-700")}
          ${badge(meal.area, "bg-emerald-500 text-white")}
        </div>
      </div>
      <div class="p-4 flex-1">
        <h3 class="text-base font-bold text-gray-900 mb-1 group-hover:text-emerald-600 transition-colors line-clamp-1">
          ${escapeHtml(meal.name)}
        </h3>
        <p class="text-xs text-gray-600 mb-3 line-clamp-2">${escapeHtml(description)}</p>
        <div class="flex items-center justify-between text-xs">
          <span class="font-semibold text-gray-900">
            <i class="fa-solid fa-utensils text-emerald-600 mr-1"></i>
            ${escapeHtml(meal.category || "-")}
          </span>
          <span class="font-semibold text-gray-500">
            <i class="fa-solid fa-globe text-blue-500 mr-1"></i>
            ${escapeHtml(meal.area || "-")}
          </span>
        </div>
      </div>
    </div>`;
}

// =========== meal details ============

function youtubeEmbedUrl(url) {
  const match = url?.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

function card(icon, title, content, extra = "") {
  return `
    <div class="bg-white rounded-2xl shadow-lg p-6">
      <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <i class="fa-solid ${icon}"></i>
        ${title}
        ${extra}
      </h2>
      ${content}
    </div>`;
}

function heroTags(meal) {
  const tags = [
    [meal.category, "bg-emerald-500"],
    [meal.area, "bg-blue-500"],
    ...(meal.tags || []).slice(0, 3).map((tag) => [tag, "bg-purple-500"]),
  ];
  return tags
    .filter(([text]) => text)
    .map(([text, color]) => `<span class="px-3 py-1 ${color} text-white text-sm font-semibold rounded-full">${escapeHtml(text)}</span>`)
    .join("");
}

function ingredientsList(ingredients) {
  const items = ingredients
    .map(
      ({ ingredient, measure }) => `
        <label class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-emerald-50 transition-colors cursor-pointer">
          <input type="checkbox" class="ingredient-checkbox w-5 h-5 text-emerald-600 rounded border-gray-300" />
          <span class="text-gray-700">
            <span class="font-medium text-gray-900">${escapeHtml(measure)}</span> ${escapeHtml(ingredient)}
          </span>
        </label>`
    )
    .join("");
  return `<div class="grid grid-cols-1 md:grid-cols-2 gap-3">${items}</div>`;
}

function instructionsList(steps) {
  const items = steps
    .map(
      (step, i) => `
        <div class="flex gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors">
          <div class="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">${i + 1}</div>
          <p class="text-gray-700 leading-relaxed pt-2">${escapeHtml(step)}</p>
        </div>`
    )
    .join("");
  return `<div class="space-y-4">${items}</div>`;
}

function videoSection(youtubeUrl) {
  const video = youtubeEmbedUrl(youtubeUrl);
  if (!video) return "";
  return card(
    "fa-video text-red-500",
    "Video Tutorial",
    `<div class="relative aspect-video rounded-xl overflow-hidden bg-gray-100">
      <iframe src="${video}" class="absolute inset-0 w-full h-full" frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen></iframe>
    </div>`
  );
}

export function favoriteMealButton(favorite) {
  const colors = favorite ? "bg-red-500 text-white hover:bg-red-700" : "bg-red-50 text-red-600 hover:bg-red-200";
  return `
    <button id="favorite-meal-btn"
      class="flex items-center gap-2 px-6 py-3 ${colors} rounded-xl font-semibold transition-all">
      <i class="${favorite ? "fa-solid" : "fa-regular"} fa-heart"></i>
      <span>${favorite ? "Saved to Favorites" : "Add to Favorites"}</span>
    </button>`;
}

export function mealDetails(meal, favorite = false) {
  const ingredientsCount = `<span class="text-sm font-normal text-gray-500 ml-auto">${meal.ingredients.length} items</span>`;

  return `
    ${backButton()}

    <div class="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
      <div class="relative h-80 md:h-96">
        <img src="${escapeHtml(meal.thumbnail)}" alt="${escapeHtml(meal.name)}" class="w-full h-full object-cover" />
        <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
        <div class="absolute bottom-0 left-0 right-0 p-8">
          <div class="flex items-center gap-3 mb-3">${heroTags(meal)}</div>
          <h1 class="text-3xl md:text-4xl font-bold text-white mb-2">${escapeHtml(meal.name)}</h1>
          <div class="flex items-center gap-6 text-white/90">
            <span class="flex items-center gap-2">
              <i class="fa-solid fa-utensils"></i>
              <span id="hero-servings">- servings</span>
            </span>
            <span class="flex items-center gap-2">
              <i class="fa-solid fa-fire"></i>
              <span id="hero-calories">Calculating...</span>
            </span>
          </div>
        </div>
      </div>
    </div>

    <div class="flex flex-wrap gap-3 mb-8">
      <button id="log-meal-btn"
        class="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all"
        data-meal-id="${escapeHtml(meal.id)}">
        <i class="fa-solid fa-clipboard-list"></i>
        <span>Log This Meal</span>
      </button>
      <div id="favorite-meal-wrapper">${favoriteMealButton(favorite)}</div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div class="lg:col-span-2 space-y-8">
        ${card("fa-list-check text-emerald-600", "Ingredients", ingredientsList(meal.ingredients), ingredientsCount)}
        ${card("fa-shoe-prints text-emerald-600", "Instructions", instructionsList(meal.instructions))}
        ${videoSection(meal.youtube)}
      </div>

      <div class="space-y-6">
        <div class="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
          <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <i class="fa-solid fa-chart-pie text-emerald-600"></i>
            Nutrition Facts
          </h2>
          <div id="nutrition-facts-container">
            ${loadingSpinner()}
            <p class="text-center text-sm text-gray-500">Analyzing ingredients...</p>
          </div>
        </div>
      </div>
    </div>`;
}

// =========== nutrition facts ============

const DAILY_VALUES = { protein: 50, carbs: 275, fat: 78, fiber: 28, sugar: 50 };

function nutrientBar(label, value, dailyValue, color) {
  return `
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div class="w-3 h-3 rounded-full ${color}"></div>
        <span class="text-gray-700">${label}</span>
      </div>
      <span class="font-bold text-gray-900">${round(value)}g</span>
    </div>
    <div class="w-full bg-gray-100 rounded-full h-2">
      <div class="${color} h-2 rounded-full" style="width: ${percentOf(value, dailyValue)}%"></div>
    </div>`;
}

function infoRow(label, value) {
  return `
    <div class="flex justify-between">
      <span class="text-gray-600">${label}</span>
      <span class="font-medium">${value}</span>
    </div>`;
}

export function nutritionFacts(analysis) {
  const per = analysis.perServing;
  return `
    <p class="text-sm text-gray-500 mb-4">Per serving (${analysis.servings} servings)</p>

    <div class="text-center py-4 mb-4 bg-linear-to-br from-emerald-50 to-teal-50 rounded-xl">
      <p class="text-sm text-gray-600">Calories per serving</p>
      <p class="text-4xl font-bold text-emerald-600">${round(per.calories)}</p>
      <p class="text-xs text-gray-500 mt-1">Total: ${round(analysis.totals.calories)} cal</p>
    </div>

    <div class="space-y-4">
      ${nutrientBar("Protein", per.protein, DAILY_VALUES.protein, "bg-emerald-500")}
      ${nutrientBar("Carbs", per.carbs, DAILY_VALUES.carbs, "bg-blue-500")}
      ${nutrientBar("Fat", per.fat, DAILY_VALUES.fat, "bg-purple-500")}
      ${nutrientBar("Fiber", per.fiber, DAILY_VALUES.fiber, "bg-orange-500")}
      ${nutrientBar("Sugar", per.sugar, DAILY_VALUES.sugar, "bg-pink-500")}
    </div>

    <div class="mt-6 pt-6 border-t border-gray-100">
      <h3 class="text-sm font-semibold text-gray-900 mb-3">More per serving</h3>
      <div class="grid grid-cols-2 gap-3 text-sm">
        ${infoRow("Saturated Fat", `${round(per.saturatedFat)}g`)}
        ${infoRow("Cholesterol", `${round(per.cholesterol)}mg`)}
        ${infoRow("Sodium", `${round(per.sodium)}mg`)}
        ${infoRow("Total Weight", `${round(analysis.totalWeight)}g`)}
      </div>
    </div>`;
}

export function nutritionError(message) {
  return `
    ${emptyState("Nutrition data unavailable", message, "fa-chart-pie")}
    <div class="flex flex-col gap-2">
      <button id="retry-analysis-btn" class="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-all">
        <i class="fa-solid fa-rotate-right mr-1"></i>Try Again
      </button>
      <button id="set-usda-key-btn" class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-all">
        <i class="fa-solid fa-key mr-1"></i>Use My USDA API Key
      </button>
    </div>`;
}

// =========== products ============

const GRADE_COLORS = { a: "bg-green-500", b: "bg-lime-500", c: "bg-yellow-500", d: "bg-orange-500", e: "bg-red-500" };
const NOVA_COLORS = { 1: "bg-green-500", 2: "bg-lime-500", 3: "bg-orange-500", 4: "bg-red-500" };

const PRODUCT_CATEGORY_STYLES = {
  snacks: ["fa-cookie", "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"],
  beverages: ["fa-glass-water", "bg-blue-100 text-blue-700 hover:bg-blue-200"],
  "breakfast-cereals": ["fa-bread-slice", "bg-amber-100 text-amber-700 hover:bg-amber-200"],
  desserts: ["fa-ice-cream", "bg-purple-100 text-purple-700 hover:bg-purple-200"],
  dairies: ["fa-cheese", "bg-rose-100 text-rose-700 hover:bg-rose-200"],
  cheeses: ["fa-cheese", "bg-amber-100 text-amber-700 hover:bg-amber-200"],
  "ice-creams": ["fa-ice-cream", "bg-purple-100 text-purple-700 hover:bg-purple-200"],
  breads: ["fa-bread-slice", "bg-amber-100 text-amber-700 hover:bg-amber-200"],
  waters: ["fa-glass-water", "bg-blue-100 text-blue-700 hover:bg-blue-200"],
  coffees: ["fa-mug-hot", "bg-amber-100 text-amber-700 hover:bg-amber-200"],
  teas: ["fa-mug-hot", "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"],
  fruits: ["fa-apple-whole", "bg-rose-100 text-rose-700 hover:bg-rose-200"],
  vegetables: ["fa-carrot", "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"],
  meats: ["fa-drumstick-bite", "bg-rose-100 text-rose-700 hover:bg-rose-200"],
  fishes: ["fa-fish", "bg-blue-100 text-blue-700 hover:bg-blue-200"],
  default: ["fa-tag", "bg-gray-100 text-gray-700 hover:bg-gray-200"],
};

export function productCategoryButton(category, active) {
  const [icon, colors] = PRODUCT_CATEGORY_STYLES[category.id] || PRODUCT_CATEGORY_STYLES.default;
  const ring = active ? "ring-2 ring-emerald-500" : "";
  return `
    <button class="product-category-btn px-4 py-2 ${colors} ${ring} rounded-lg text-sm font-medium whitespace-nowrap transition-all"
      data-category="${escapeHtml(category.id)}">
      <i class="fa-solid ${icon} mr-1.5"></i>${escapeHtml(category.name)}
    </button>`;
}

function productImage(product) {
  if (!product.image) return `<i class="fa-solid fa-box-open text-4xl text-gray-300"></i>`;
  return `<img class="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
    src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" loading="lazy" />`;
}

function gradeBadge(grade) {
  const color = GRADE_COLORS[grade] || "bg-gray-400";
  const label = GRADE_COLORS[grade] ? `Nutri-Score ${grade.toUpperCase()}` : "Nutri-Score N/A";
  return `<div class="absolute top-2 left-2 ${color} text-white text-xs font-bold px-2 py-1 rounded uppercase">${label}</div>`;
}

function novaBadge(nova) {
  if (!NOVA_COLORS[nova]) return "";
  return `<div class="absolute top-2 right-2 ${NOVA_COLORS[nova]} text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center"
    title="NOVA ${nova}">${nova}</div>`;
}

function macroBox(label, value, bg, text) {
  return `
    <div class="${bg} rounded p-1.5">
      <p class="text-xs font-bold ${text}">${roundOne(value)}g</p>
      <p class="text-[10px] text-gray-500">${label}</p>
    </div>`;
}

export function productCard(product) {
  const grade = (product.nutritionGrade || "").toLowerCase();
  const n = product.nutrients || {};

  return `
    <div class="product-card bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer group"
      data-barcode="${escapeHtml(product.barcode)}">
      <div class="relative h-40 bg-gray-100 flex items-center justify-center overflow-hidden">
        ${productImage(product)}
        ${gradeBadge(grade)}
        ${novaBadge(product.novaGroup)}
      </div>
      <div class="p-4">
        <p class="text-xs text-emerald-600 font-semibold mb-1 truncate">${escapeHtml(product.brand || "Unknown brand")}</p>
        <h3 class="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-emerald-600 transition-colors">
          ${escapeHtml(product.name || "Unnamed product")}
        </h3>
        <div class="flex items-center gap-3 text-xs text-gray-500 mb-3">
          <span><i class="fa-solid fa-fire mr-1"></i>${round(n.calories)} kcal/100g</span>
        </div>
        <div class="grid grid-cols-4 gap-1 text-center">
          ${macroBox("Protein", n.protein, "bg-emerald-50", "text-emerald-700")}
          ${macroBox("Carbs", n.carbs, "bg-blue-50", "text-blue-700")}
          ${macroBox("Fat", n.fat, "bg-purple-50", "text-purple-700")}
          ${macroBox("Sugar", n.sugar, "bg-orange-50", "text-orange-700")}
        </div>
        <button class="log-product-btn w-full mt-3 px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-all">
          <i class="fa-solid fa-plus mr-1"></i>Add to Food Log
        </button>
      </div>
    </div>`;
}

export function productSummary(product) {
  const n = product.nutrients || {};
  const image = product.image
    ? `<img src="${escapeHtml(product.image)}" alt="" style="max-height:160px;margin:0 auto 12px">`
    : "";
  return `
    <p style="color:#059669;font-weight:600;margin-bottom:8px">${escapeHtml(product.brand || "")}</p>
    ${image}
    <p style="font-size:14px;color:#4b5563">Per 100g: <b>${Math.round(n.calories || 0)} kcal</b> ·
      Protein ${n.protein?.toFixed(1) ?? 0}g · Carbs ${n.carbs?.toFixed(1) ?? 0}g · Fat ${n.fat?.toFixed(1) ?? 0}g ·
      Sugar ${n.sugar?.toFixed(1) ?? 0}g · Fiber ${n.fiber?.toFixed(1) ?? 0}g</p>
    <p style="font-size:12px;color:#9ca3af;margin-top:6px">Barcode: ${escapeHtml(product.barcode)}</p>`;
}

// =========== food log ============

const SOURCE_ICONS = {
  meal: ["fa-utensils", "bg-emerald-100 text-emerald-600"],
  product: ["fa-barcode", "bg-teal-100 text-teal-600"],
  custom: ["fa-pencil", "bg-purple-100 text-purple-600"],
};

export function loggedItem(item) {
  const [icon, colors] = SOURCE_ICONS[item.source] || SOURCE_ICONS.custom;
  const time = new Date(item.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return `
    <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
      <div class="w-10 h-10 rounded-lg ${colors} flex items-center justify-center shrink-0">
        <i class="fa-solid ${icon}"></i>
      </div>
      <div class="flex-1 min-w-0">
        <p class="font-semibold text-gray-900 truncate">${escapeHtml(item.name)}</p>
        <p class="text-xs text-gray-500">${escapeHtml(item.amount || "")} · ${time}</p>
      </div>
      <div class="text-right text-xs text-gray-500">
        <p class="text-sm font-bold text-gray-900">${round(item.calories)} kcal</p>
        <p>P ${round(item.protein)}g · C ${round(item.carbs)}g · F ${round(item.fat)}g</p>
      </div>
      <button class="remove-log-item text-gray-400 hover:text-red-500 p-2" data-id="${escapeHtml(item.id)}" title="Remove">
        <i class="fa-solid fa-trash"></i>
      </button>
    </div>`;
}

export function emptyFoodLog() {
  return `
    <div class="text-center py-8 text-gray-500">
      <i class="fa-solid fa-utensils text-4xl mb-3 text-gray-300"></i>
      <p class="font-medium">No meals logged today</p>
      <p class="text-sm">Add meals from the Meals page or scan products</p>
    </div>`;
}

export function progressCard(label, value, goal, unit, bg, bar) {
  const over = value > goal;
  const diff = round(Math.abs(goal - value));
  const status = over
    ? `<span class="text-red-600 font-semibold">${diff} ${unit} over goal</span>`
    : `<span class="text-gray-500">${diff} ${unit} left</span>`;

  return `
    <div class="${bg} rounded-xl p-4">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm font-semibold text-gray-700">${label}</span>
        <span class="text-sm ${over ? "text-red-600 font-semibold" : "text-gray-500"}">${round(value)} / ${goal} ${unit}</span>
      </div>
      <div class="w-full bg-gray-200 rounded-full h-2.5">
        <div class="${over ? "bg-red-500" : bar} h-2.5 rounded-full" style="width: ${percentOf(value, goal)}%"></div>
      </div>
      <p class="text-xs mt-2">${status}</p>
    </div>`;
}
