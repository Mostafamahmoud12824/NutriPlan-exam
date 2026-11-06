const STORAGE_KEY = "nutriplan-foodlog";
export const DAILY_GOALS = { calories: 2000, protein: 50, carbs: 250, fat: 65 };

export function dateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function save(log) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(log));
  } catch {
  }
}

export function getItems(day = dateKey()) {
  return load()[day] || [];
}

export function addItem(item) {
  const log = load();
  const day = dateKey();
  const entry = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    time: new Date().toISOString(),
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    ...item,
  };
  log[day] = [...(log[day] || []), entry];
  save(log);
  return entry;
}

export function removeItem(id, day = dateKey()) {
  const log = load();
  log[day] = (log[day] || []).filter((item) => item.id !== id);
  save(log);
}

export function clearDay(day = dateKey()) {
  const log = load();
  delete log[day];
  save(log);
}

export function getTotals(items) {
  const totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  for (const item of items) {
    totals.calories += Number(item.calories) || 0;
    totals.protein += Number(item.protein) || 0;
    totals.carbs += Number(item.carbs) || 0;
    totals.fat += Number(item.fat) || 0;
  }
  return totals;
}

export function getWeek() {
  const log = load();
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const items = log[dateKey(date)] || [];
    days.push({ date, count: items.length, ...getTotals(items) });
  }
  return days;
}
