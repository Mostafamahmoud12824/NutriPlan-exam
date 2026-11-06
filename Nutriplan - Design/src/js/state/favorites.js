const STORAGE_KEY = "nutriplan-favorites";

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function save(favorites) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  } catch {
  }
}

export function getFavorites() {
  return load();
}

export function isFavorite(id) {
  return load().some((meal) => meal.id === id);
}

export function toggleFavorite(meal) {
  const favorites = load();
  const saved = favorites.some((item) => item.id === meal.id);
  save(saved ? favorites.filter((item) => item.id !== meal.id) : [...favorites, meal]);
  return !saved;
}
