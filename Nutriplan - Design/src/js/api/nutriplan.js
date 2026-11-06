const BASE_URL = "https://nutriplan-api.vercel.app/api";
const DEFAULT_USDA_API_KEY = "DEMO_KEY";
const USDA_KEY_STORAGE = "nutriplan-usda-key";

export function getUsdaKey() {
  try {
    return localStorage.getItem(USDA_KEY_STORAGE) || DEFAULT_USDA_API_KEY;
  } catch {
    return DEFAULT_USDA_API_KEY;
  }
}

export function setUsdaKey(key) {
  try {
    localStorage.setItem(USDA_KEY_STORAGE, key);
  } catch {
  }
}

const cache = {};

async function request(path, { params, ...options } = {}) {
  const url = new URL(BASE_URL + path);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, value);
      }
    });
  }

  const isGet = !options.method;
  if (isGet && cache[url]) return cache[url];

  const response = await fetch(url, options);
  const data = await response.json();

  if (!response.ok) {
    const message =
      data?.error?.message || data?.error || data?.message || `Request failed (${response.status})`;
    throw new Error(message);
  }
  if (isGet) cache[url] = data;
  return data;
}

// =========== meals ============

export function searchMeals(query = "") {
  return request("/meals/search", { params: { q: query } });
}

export function filterMeals({ category, area, ingredient, limit = 25 } = {}) {
  return request("/meals/filter", { params: { category, area, ingredient, limit } });
}

export async function getMealById(id) {
  const data = await request(`/meals/${encodeURIComponent(id)}`);
  return data.result;
}

export async function getMealCategories() {
  const data = await request("/meals/categories");
  return data.results;
}

export async function getMealAreas() {
  const data = await request("/meals/areas");
  return data.results;
}

// =========== nutrition  ============

export async function analyzeRecipe(recipeName, ingredients) {
  const data = await request("/nutrition/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": getUsdaKey(),
    },
    body: JSON.stringify({ recipeName, ingredients }),
  });
  return data.data;
}

// =========== products ============

export async function getProductCategories(page = 1, limit = 50) {
  const data = await request("/products/categories", { params: { page, limit } });
  return data.results;
}

export function getProductsByCategory(category, page = 1, limit = 24) {
  return request(`/products/category/${encodeURIComponent(category)}`, {
    params: { page, limit },
  });
}

export function searchProducts(query) {
  return request("/products/search", { params: { q: query } });
}

export async function getProductByBarcode(code) {
  const data = await request(`/products/barcode/${encodeURIComponent(code)}`);
  return data.result;
}
