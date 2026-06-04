// Key untuk data yang disimpan di browser.

const STORAGE_KEYS = {
  name: "lifeDashboardName",
  tasks: "lifeDashboardTasks",
  links: "lifeDashboardLinks",
  theme: "lifeDashboardTheme",
  timerMinutes: "lifeDashboardTimerMinutes"
};

function getFromStorage(key, fallbackValue) {
  const savedValue = localStorage.getItem(key);

  // Belum ada data tersimpan, jadi pakai bawaan.
  if (savedValue === null) {
    return fallbackValue;
  }

  try {
    return JSON.parse(savedValue);
  } catch (error) {
    // Kalau datanya rusak, pakai bawaan lagi.
    return fallbackValue;
  }
}

function saveToStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// Ambil elemen HTML yang nanti sering dipakai.

const clockElement = document.getElementById("clock");
const dateTextElement = document.getElementById("dateText");
const greetingTextElement = document.getElementById("greetingText");
const themeToggleButton = document.getElementById("themeToggle");

const nameForm = document.getElementById("nameForm");
const nameInput = document.getElementById("nameInput");

const timerDisplay = document.getElementById("timerDisplay");
const startTimerButton = document.getElementById("startTimerBtn");
const stopTimerButton = document.getElementById("stopTimerBtn");
const resetTimerButton = document.getElementById("resetTimerBtn");
const timerSettingForm = document.getElementById("timerSettingForm");
const timerMinuteInput = document.getElementById("timerMinuteInput");

const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const taskList = document.getElementById("taskList");
const taskMessage = document.getElementById("taskMessage");
const sortTasksButton = document.getElementById("sortTasksBtn");

const linkForm = document.getElementById("linkForm");
const linkNameInput = document.getElementById("linkNameInput");
const linkUrlInput = document.getElementById("linkUrlInput");
const quickLinksContainer = document.getElementById("quickLinks");
const linkMessage = document.getElementById("linkMessage");

// Data awal. Kalau sebelumnya sudah tersimpan, datanya otomatis dipakai lagi.

let userName = getFromStorage(STORAGE_KEYS.name, "");
let tasks = getFromStorage(STORAGE_KEYS.tasks, []);
let links = getFromStorage(STORAGE_KEYS.links, [
  { id: crypto.randomUUID(), name: "Google", url: "https://google.com" },
  { id: crypto.randomUUID(), name: "Gmail", url: "https://mail.google.com" },
  { id: crypto.randomUUID(), name: "Calendar", url: "https://calendar.google.com" }
]);

let timerMinutes = getFromStorage(STORAGE_KEYS.timerMinutes, 25);
let timerSecondsLeft = timerMinutes * 60;
let timerIntervalId = null;
let isSortDoneFirst = false;

// Update jam, tanggal, dan sapaan di bagian atas.

function getGreetingByHour(hour) {
  if (hour >= 5 && hour < 12) return "Good Morning";
  if (hour >= 12 && hour < 17) return "Good Afternoon";
  if (hour >= 17 && hour < 21) return "Good Evening";
  return "Good Night";
}

function updateClockAndGreeting() {
  const now = new Date();

  const timeText = now.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });

  const dateText = now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  const greeting = getGreetingByHour(now.getHours());
  const namePart = userName ? `, ${userName}` : "";

  clockElement.textContent = timeText;
  dateTextElement.textContent = dateText;
  greetingTextElement.textContent = `${greeting}${namePart}`;
}

nameForm.addEventListener("submit", function (event) {
  event.preventDefault();

  userName = nameInput.value.trim();
  saveToStorage(STORAGE_KEYS.name, userName);
  nameInput.value = "";
  updateClockAndGreeting();
});

// Tema terang/gelap disimpan supaya tidak berubah saat halaman dibuka lagi.

function applyTheme(theme) {
  const isDarkMode = theme === "dark";
  document.body.classList.toggle("dark-mode", isDarkMode);
  themeToggleButton.textContent = isDarkMode ? "☀️" : "🌙";
}

const savedTheme = getFromStorage(STORAGE_KEYS.theme, "light");
applyTheme(savedTheme);

themeToggleButton.addEventListener("click", function () {
  const nextTheme = document.body.classList.contains("dark-mode") ? "light" : "dark";
  saveToStorage(STORAGE_KEYS.theme, nextTheme);
  applyTheme(nextTheme);
});

// Timer fokus. Awalnya 25 menit, tapi bisa diubah dari form.

function formatTimer(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

function renderTimer() {
  timerDisplay.textContent = formatTimer(timerSecondsLeft);
  timerMinuteInput.placeholder = String(timerMinutes);
}

function setActiveTimerButton(activeButton) {
  // Biar tombol yang terakhir dipakai kelihatan jelas.
  [startTimerButton, stopTimerButton, resetTimerButton].forEach(function (button) {
    button.classList.toggle("is-active", button === activeButton);
  });
}

function startTimer() {
  // Cegah timer dobel kalau tombol Start ditekan berkali-kali.
  if (timerIntervalId !== null) return;

  setActiveTimerButton(startTimerButton);

  timerIntervalId = setInterval(function () {
    if (timerSecondsLeft <= 0) {
      stopTimer();
      alert("Sesi fokus telah selesai. Silakan beristirahat sejenak sebelum melanjutkan aktivitas.");
      return;
    }

    timerSecondsLeft -= 1;
    renderTimer();
  }, 1000);
}

function stopTimer() {
  clearInterval(timerIntervalId);
  timerIntervalId = null;
  setActiveTimerButton(stopTimerButton);
}

function resetTimer() {
  clearInterval(timerIntervalId);
  timerIntervalId = null;
  timerSecondsLeft = timerMinutes * 60;
  renderTimer();
  setActiveTimerButton(resetTimerButton);
}

startTimerButton.addEventListener("click", startTimer);
stopTimerButton.addEventListener("click", stopTimer);
resetTimerButton.addEventListener("click", resetTimer);

timerSettingForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const newMinutes = Number(timerMinuteInput.value);

  if (!Number.isFinite(newMinutes) || newMinutes < 1 || newMinutes > 180) {
    alert("Masukkan durasi antara 1 sampai 180 menit.");
    return;
  }

  timerMinutes = newMinutes;
  saveToStorage(STORAGE_KEYS.timerMinutes, timerMinutes);
  timerMinuteInput.value = "";
  resetTimer();
});

// Semua urusan task ada di bagian ini.

function showTaskMessage(message) {
  taskMessage.textContent = message;

  setTimeout(function () {
    taskMessage.textContent = "";
  }, 2500);
}

function saveTasks() {
  saveToStorage(STORAGE_KEYS.tasks, tasks);
}

function renderTasks() {
  taskList.innerHTML = "";

  if (tasks.length === 0) {
    taskList.innerHTML = '<p class="empty-state">Belum ada task. Silakan tambahkan task terlebih dahulu.</p>';
    return;
  }

  const visibleTasks = [...tasks];

  if (isSortDoneFirst) {
    // Saat sort aktif, task yang belum selesai ditampilkan dulu.
    visibleTasks.sort(function (a, b) {
      return Number(a.isDone) - Number(b.isDone);
    });
  }

  visibleTasks.forEach(function (task) {
    const taskItem = document.createElement("li");
    taskItem.className = "task-item";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.isDone;
    checkbox.addEventListener("change", function () {
      toggleTaskDone(task.id);
    });

    const title = document.createElement("span");
    title.className = task.isDone ? "task-title done" : "task-title";
    title.textContent = task.title;

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "secondary-button small-button";
    editButton.textContent = "Edit";
    editButton.addEventListener("click", function () {
      editTask(task.id);
    });

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-button small-button";
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", function () {
      deleteTask(task.id);
    });

    taskItem.append(checkbox, title, editButton, deleteButton);
    taskList.appendChild(taskItem);
  });
}

function addTask(title) {
  const cleanTitle = title.trim();

  if (!cleanTitle) {
    showTaskMessage("Task tidak boleh kosong.");
    return;
  }

  const alreadyExists = tasks.some(function (task) {
    return task.title.toLowerCase() === cleanTitle.toLowerCase();
  });

  // Cek duplikat agar task yang sama tidak masuk dua kali.
  if (alreadyExists) {
    showTaskMessage("Task ini sudah ada. Silakan masukkan task yang berbeda.");
    return;
  }

  tasks.push({
    id: crypto.randomUUID(),
    title: cleanTitle,
    isDone: false,
    createdAt: new Date().toISOString()
  });

  saveTasks();
  renderTasks();
}

function toggleTaskDone(taskId) {
  tasks = tasks.map(function (task) {
    if (task.id !== taskId) return task;

    return {
      ...task,
      isDone: !task.isDone
    };
  });

  saveTasks();
  renderTasks();
}

function editTask(taskId) {
  const selectedTask = tasks.find(function (task) {
    return task.id === taskId;
  });

  if (!selectedTask) return;

  const newTitle = prompt("Edit task:", selectedTask.title);

  // Kalau user membatalkan edit, task tidak diubah.
  if (newTitle === null) return;

  const cleanTitle = newTitle.trim();

  if (!cleanTitle) {
    showTaskMessage("Task tidak boleh kosong.");
    return;
  }

  const duplicateTask = tasks.some(function (task) {
    return task.id !== taskId && task.title.toLowerCase() === cleanTitle.toLowerCase();
  });

  if (duplicateTask) {
    showTaskMessage("Nama task sudah dipakai.");
    return;
  }

  tasks = tasks.map(function (task) {
    if (task.id !== taskId) return task;

    return {
      ...task,
      title: cleanTitle
    };
  });

  saveTasks();
  renderTasks();
}

function deleteTask(taskId) {
  tasks = tasks.filter(function (task) {
    return task.id !== taskId;
  });

  saveTasks();
  renderTasks();
}

taskForm.addEventListener("submit", function (event) {
  event.preventDefault();
  addTask(taskInput.value);
  taskInput.value = "";
});

sortTasksButton.addEventListener("click", function () {
  isSortDoneFirst = !isSortDoneFirst;
  sortTasksButton.textContent = isSortDoneFirst ? "Unsort" : "Sort";
  sortTasksButton.classList.toggle("is-active", isSortDoneFirst);
  renderTasks();
});

// Quick link untuk website yang sering dibuka.

function showLinkMessage(message) {
  linkMessage.textContent = message;

  setTimeout(function () {
    linkMessage.textContent = "";
  }, 2500);
}

function saveLinks() {
  saveToStorage(STORAGE_KEYS.links, links);
}

function normalizeUrl(url) {
  const cleanUrl = url.trim();

  // Kalau hanya menulis google.com, https:// ditambahkan otomatis.
  if (cleanUrl.startsWith("http://") || cleanUrl.startsWith("https://")) {
    return cleanUrl;
  }

  return `https://${cleanUrl}`;
}

function renderLinks() {
  quickLinksContainer.innerHTML = "";

  if (links.length === 0) {
    quickLinksContainer.innerHTML = '<p class="empty-state">Belum ada quick link.</p>';
    return;
  }

  links.forEach(function (link) {
    const linkWrapper = document.createElement("span");
    linkWrapper.className = "quick-link-item";

    const anchor = document.createElement("a");
    anchor.href = link.url;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    anchor.textContent = link.name;
    anchor.style.color = "inherit";
    anchor.style.textDecoration = "none";

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "remove-link-button";
    removeButton.textContent = "×";
    removeButton.setAttribute("aria-label", `Hapus link ${link.name}`);
    removeButton.addEventListener("click", function () {
      deleteLink(link.id);
    });

    linkWrapper.append(anchor, removeButton);
    quickLinksContainer.appendChild(linkWrapper);
  });
}

function addLink(name, url) {
  const cleanName = name.trim();
  const cleanUrl = normalizeUrl(url);

  if (!cleanName || !cleanUrl) {
    showLinkMessage("Nama link dan URL wajib diisi.");
    return;
  }

  try {
    new URL(cleanUrl);
  } catch (error) {
    showLinkMessage("URL tidak valid. Contoh: https://google.com");
    return;
  }

  links.push({
    id: crypto.randomUUID(),
    name: cleanName,
    url: cleanUrl
  });

  saveLinks();
  renderLinks();
}

function deleteLink(linkId) {
  links = links.filter(function (link) {
    return link.id !== linkId;
  });

  saveLinks();
  renderLinks();
}

linkForm.addEventListener("submit", function (event) {
  event.preventDefault();

  addLink(linkNameInput.value, linkUrlInput.value);
  linkNameInput.value = "";
  linkUrlInput.value = "";
});

// Jalankan tampilan awal saat halaman dibuka.

updateClockAndGreeting();
setInterval(updateClockAndGreeting, 1000);

renderTimer();
renderTasks();
renderLinks();
