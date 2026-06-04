const STORAGE_KEYS = {
  tasks: "lifeDashboard.tasks",
  links: "lifeDashboard.links",
  name: "lifeDashboard.name",
  theme: "lifeDashboard.theme",
  timerMinutes: "lifeDashboard.timerMinutes"
};

const DEFAULT_LINKS = [
  { id: crypto.randomUUID(), name: "Google", url: "https://google.com" },
  { id: crypto.randomUUID(), name: "Gmail", url: "https://mail.google.com" },
  { id: crypto.randomUUID(), name: "Calendar", url: "https://calendar.google.com" }
];

const clockEl = document.getElementById("clock");
const dateTextEl = document.getElementById("dateText");
const greetingTextEl = document.getElementById("greetingText");
const nameForm = document.getElementById("nameForm");
const nameInput = document.getElementById("nameInput");
const themeToggleBtn = document.getElementById("themeToggleBtn");

const timerDisplay = document.getElementById("timerDisplay");
const timerStatus = document.getElementById("timerStatus");
const timerSettingForm = document.getElementById("timerSettingForm");
const timerMinutesInput = document.getElementById("timerMinutesInput");
const startTimerBtn = document.getElementById("startTimerBtn");
const stopTimerBtn = document.getElementById("stopTimerBtn");
const resetTimerBtn = document.getElementById("resetTimerBtn");

const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const taskList = document.getElementById("taskList");
const taskMessage = document.getElementById("taskMessage");
const sortTasksBtn = document.getElementById("sortTasksBtn");

const linkForm = document.getElementById("linkForm");
const linkNameInput = document.getElementById("linkNameInput");
const linkUrlInput = document.getElementById("linkUrlInput");
const quickLinks = document.getElementById("quickLinks");
const linkMessage = document.getElementById("linkMessage");

let tasks = loadFromStorage(STORAGE_KEYS.tasks, []);
let links = loadFromStorage(STORAGE_KEYS.links, DEFAULT_LINKS);
let userName = localStorage.getItem(STORAGE_KEYS.name) || "";
let selectedMinutes = Number(localStorage.getItem(STORAGE_KEYS.timerMinutes)) || 25;

let timerSeconds = selectedMinutes * 60;
let timerIntervalId = null;
let isSortedAscending = true;

function loadFromStorage(key, fallback) {
  try {
    const savedValue = localStorage.getItem(key);
    return savedValue ? JSON.parse(savedValue) : fallback;
  } catch (error) {
    console.warn(`Failed to load ${key}`, error);
    return fallback;
  }
}

function saveToStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function updateClock() {
  const now = new Date();

  clockEl.textContent = now.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });

  dateTextEl.textContent = now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  greetingTextEl.textContent = getGreeting(now.getHours());
}

function getGreeting(hour) {
  const nameSuffix = userName ? `, ${userName}` : "";

  if (hour >= 5 && hour < 12) return `Good Morning${nameSuffix}`;
  if (hour >= 12 && hour < 17) return `Good Afternoon${nameSuffix}`;
  if (hour >= 17 && hour < 21) return `Good Evening${nameSuffix}`;
  return `Good Night${nameSuffix}`;
}

function applyTheme(theme) {
  const isDark = theme === "dark";
  document.body.classList.toggle("dark", isDark);
  themeToggleBtn.textContent = isDark ? "☀️" : "🌙";
  localStorage.setItem(STORAGE_KEYS.theme, theme);
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function renderTimer() {
  timerDisplay.textContent = formatTime(timerSeconds);
  timerMinutesInput.value = selectedMinutes;
}

function startTimer() {
  if (timerIntervalId) return;

  timerStatus.textContent = "Running";
  startTimerBtn.disabled = true;

  timerIntervalId = setInterval(() => {
    if (timerSeconds <= 0) {
      stopTimer();
      timerStatus.textContent = "Done";
      alert("Focus session complete!");
      return;
    }

    timerSeconds -= 1;
    renderTimer();
  }, 1000);
}

function stopTimer() {
  clearInterval(timerIntervalId);
  timerIntervalId = null;
  timerStatus.textContent = "Paused";
  startTimerBtn.disabled = false;
}

function resetTimer() {
  stopTimer();
  timerSeconds = selectedMinutes * 60;
  timerStatus.textContent = "Ready";
  renderTimer();
}

function setTimerMinutes(minutes) {
  selectedMinutes = minutes;
  localStorage.setItem(STORAGE_KEYS.timerMinutes, String(selectedMinutes));
  timerSeconds = selectedMinutes * 60;
  timerStatus.textContent = "Ready";
  renderTimer();
}

function renderTasks() {
  taskList.innerHTML = "";

  if (tasks.length === 0) {
    taskList.innerHTML = `<li class="empty-state">No tasks yet. Add your first task.</li>`;
    return;
  }

  tasks.forEach((task) => {
    const taskItem = document.createElement("li");
    taskItem.className = `task-item ${task.done ? "done" : ""}`;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.done;
    checkbox.ariaLabel = `Mark ${task.title} as done`;
    checkbox.addEventListener("change", () => toggleTask(task.id));

    const title = document.createElement("span");
    title.className = "task-title";
    title.textContent = task.title;

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "small-btn";
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", () => editTask(task.id));

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "small-btn delete-btn";
    deleteBtn.textContent = "Delete";
    deleteBtn.addEventListener("click", () => deleteTask(task.id));

    taskItem.append(checkbox, title, editBtn, deleteBtn);
    taskList.appendChild(taskItem);
  });
}

function normalizeText(value) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function addTask(title) {
  const cleanTitle = title.trim().replace(/\s+/g, " ");

  if (!cleanTitle) {
    showTaskMessage("Task cannot be empty.");
    return;
  }

  const isDuplicate = tasks.some((task) => normalizeText(task.title) === normalizeText(cleanTitle));

  if (isDuplicate) {
    showTaskMessage("Duplicate task blocked.");
    return;
  }

  tasks.push({
    id: crypto.randomUUID(),
    title: cleanTitle,
    done: false,
    createdAt: Date.now()
  });

  saveToStorage(STORAGE_KEYS.tasks, tasks);
  taskInput.value = "";
  showTaskMessage("");
  renderTasks();
}

function toggleTask(id) {
  tasks = tasks.map((task) => {
    if (task.id !== id) return task;
    return { ...task, done: !task.done };
  });

  saveToStorage(STORAGE_KEYS.tasks, tasks);
  renderTasks();
}

function editTask(id) {
  const task = tasks.find((item) => item.id === id);
  if (!task) return;

  const newTitle = prompt("Edit task:", task.title);
  if (newTitle === null) return;

  const cleanTitle = newTitle.trim().replace(/\s+/g, " ");

  if (!cleanTitle) {
    showTaskMessage("Task cannot be empty.");
    return;
  }

  const isDuplicate = tasks.some((item) => item.id !== id && normalizeText(item.title) === normalizeText(cleanTitle));

  if (isDuplicate) {
    showTaskMessage("Duplicate task blocked.");
    return;
  }

  tasks = tasks.map((item) => {
    if (item.id !== id) return item;
    return { ...item, title: cleanTitle };
  });

  saveToStorage(STORAGE_KEYS.tasks, tasks);
  showTaskMessage("");
  renderTasks();
}

function deleteTask(id) {
  tasks = tasks.filter((task) => task.id !== id);
  saveToStorage(STORAGE_KEYS.tasks, tasks);
  renderTasks();
}

function sortTasks() {
  tasks.sort((a, b) => {
    const titleA = a.title.toLowerCase();
    const titleB = b.title.toLowerCase();

    if (titleA < titleB) return isSortedAscending ? -1 : 1;
    if (titleA > titleB) return isSortedAscending ? 1 : -1;
    return 0;
  });

  isSortedAscending = !isSortedAscending;
  saveToStorage(STORAGE_KEYS.tasks, tasks);
  renderTasks();
}

function showTaskMessage(message) {
  taskMessage.textContent = message;
}

function ensureUrl(url) {
  const cleanUrl = url.trim();

  if (!cleanUrl) return "";

  if (cleanUrl.startsWith("http://") || cleanUrl.startsWith("https://")) {
    return cleanUrl;
  }

  return `https://${cleanUrl}`;
}

function renderLinks() {
  quickLinks.innerHTML = "";

  if (links.length === 0) {
    quickLinks.innerHTML = `<p class="empty-state">No quick links yet.</p>`;
    return;
  }

  links.forEach((link) => {
    const anchor = document.createElement("a");
    anchor.className = "quick-link";
    anchor.href = link.url;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";

    const label = document.createElement("span");
    label.textContent = link.name;

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "remove-link-btn";
    removeBtn.textContent = "×";
    removeBtn.ariaLabel = `Remove ${link.name}`;
    removeBtn.addEventListener("click", (event) => {
      event.preventDefault();
      deleteLink(link.id);
    });

    anchor.append(label, removeBtn);
    quickLinks.appendChild(anchor);
  });
}

function addLink(name, url) {
  const cleanName = name.trim().replace(/\s+/g, " ");
  const cleanUrl = ensureUrl(url);

  if (!cleanName || !cleanUrl) {
    showLinkMessage("Link name and URL are required.");
    return;
  }

  try {
    new URL(cleanUrl);
  } catch (error) {
    showLinkMessage("Please enter a valid URL.");
    return;
  }

  links.push({
    id: crypto.randomUUID(),
    name: cleanName,
    url: cleanUrl
  });

  saveToStorage(STORAGE_KEYS.links, links);
  linkNameInput.value = "";
  linkUrlInput.value = "";
  showLinkMessage("");
  renderLinks();
}

function deleteLink(id) {
  links = links.filter((link) => link.id !== id);
  saveToStorage(STORAGE_KEYS.links, links);
  renderLinks();
}

function showLinkMessage(message) {
  linkMessage.textContent = message;
}

nameForm.addEventListener("submit", (event) => {
  event.preventDefault();

  userName = nameInput.value.trim().replace(/\s+/g, " ");
  localStorage.setItem(STORAGE_KEYS.name, userName);
  updateClock();
});

themeToggleBtn.addEventListener("click", () => {
  const currentTheme = document.body.classList.contains("dark") ? "dark" : "light";
  applyTheme(currentTheme === "dark" ? "light" : "dark");
});

timerSettingForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const minutes = Number(timerMinutesInput.value);

  if (!Number.isInteger(minutes) || minutes < 1 || minutes > 180) {
    alert("Timer must be between 1 and 180 minutes.");
    return;
  }

  setTimerMinutes(minutes);
});

startTimerBtn.addEventListener("click", startTimer);
stopTimerBtn.addEventListener("click", stopTimer);
resetTimerBtn.addEventListener("click", resetTimer);

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  addTask(taskInput.value);
});

sortTasksBtn.addEventListener("click", sortTasks);

linkForm.addEventListener("submit", (event) => {
  event.preventDefault();
  addLink(linkNameInput.value, linkUrlInput.value);
});

window.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem(STORAGE_KEYS.theme) || "light";

  nameInput.value = userName;
  applyTheme(savedTheme);
  updateClock();
  renderTimer();
  renderTasks();
  renderLinks();

  setInterval(updateClock, 1000);
});
