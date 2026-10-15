// DummyJSON имитирует запись: накладываем локальные изменения на ответы API.
const TODO_STORAGE_KEY = "front_back_project.todos.v1";
const byId = id => document.getElementById(id);
const todoForm = byId("todo-form");
const todoInput = byId("todo-input");
const todoList = byId("todo-list");
const todoDialog = byId("todo-dialog");
const profileDialog = byId("profile-dialog");
const todoTemplate = byId("todo-item-template");
let serverTodos = [];
let users = new Map();
let activeFilter = "all";
let activeSort = "";
let editingTodoKey = null;
let profileUserId = null;
let profileServerTodos = [];
let profileFilter = "all";
let profileSort = "";
let profileRequest = 0;
let sortRequest = 0;
let formBusy = false;
const busyTodoKeys = new Set();

function readTodoChanges() {
  try {
    const saved = JSON.parse(localStorage.getItem(TODO_STORAGE_KEY));
    if (saved && Array.isArray(saved.created) && Array.isArray(saved.deleted) &&
        saved.updated && typeof saved.updated === "object") return saved;
  } catch (error) { console.warn("Не удалось прочитать сохранённые задачи:", error); }
  return { created: [], updated: {}, deleted: [] };
}
const todoChanges = readTodoChanges();

function setTodoStatus(message, isError = false) {
  for (const element of [byId("todo-status"), byId("profile-status")]) {
    element.textContent = message;
    element.classList.toggle("error", isError);
  }
}

function saveTodoChanges(message) {
  try {
    localStorage.setItem(TODO_STORAGE_KEY, JSON.stringify(todoChanges));
    setTodoStatus(message);
  } catch {
    setTodoStatus("Изменение выполнено, но браузер не смог сохранить его для следующего открытия.", true);
  }
}

function todoKey(todo) { return todo.localKey || `server-${todo.id}`; }

function mergeTodoChanges(source, order = "") {
  const deleted = new Set(todoChanges.deleted);
  const tasks = [
    ...todoChanges.created,
    ...source.filter(todo => !deleted.has(todo.id)).map(todo => ({
      ...todo, ...todoChanges.updated[todo.id]
    }))
  ];
  // API сортирует исходные задачи; локальные названия включаем в тот же порядок.
  if (order && (todoChanges.created.length || Object.values(todoChanges.updated).some(change => "todo" in change))) {
    tasks.sort((a, b) => a.todo.localeCompare(b.todo, ["ru", "en"], { sensitivity: "base" }) * (order === "asc" ? 1 : -1));
  }
  return tasks;
}

function getTodos() { return mergeTodoChanges(serverTodos, activeSort); }

function getProfileTodos() {
  return mergeTodoChanges(profileServerTodos, profileSort).filter(todo => Number(todo.userId) === profileUserId);
}

function setAvatar(image, user) {
  image.hidden = !user?.image;
  image.onerror = () => { image.hidden = true; };
  if (user?.image) image.src = user.image;
  else image.removeAttribute("src");
}

function renderList(list, tasks, showUser = true) {
  const fragment = document.createDocumentFragment();
  if (!tasks.length) {
    const empty = document.createElement("li");
    empty.className = "todo-empty";
    empty.textContent = "Задачи не найдены.";
    fragment.append(empty);
  }
  for (const todo of tasks) {
    const item = todoTemplate.content.firstElementChild.cloneNode(true);
    const field = selector => item.querySelector(selector);
    const key = todoKey(todo);
    const user = users.get(Number(todo.userId));
    item.dataset.key = key;
    item.classList.toggle("completed", Boolean(todo.completed));
    field(".todo-checkbox").checked = Boolean(todo.completed);
    field(".todo-checkbox").setAttribute("aria-label", `${todo.completed ? "Отметить невыполненной" : "Отметить выполненной"}: ${todo.todo}`);
    field(".todo-text").textContent = todo.todo;
    field(".task-state").textContent = todo.completed ? "Выполнено" : "Не выполнено";
    field(".todo-local-note").hidden = !todo.localKey;
    field(".todo-user").hidden = !showUser;
    field(".user-handle").textContent = user ? `@${user.username}` : `Исполнитель · ID ${todo.userId}`;
    field(".todo-user").title = user ? `Открыть профиль ${user.firstName} ${user.lastName}` : "Пользователь недоступен";
    setAvatar(field(".user-avatar"), user);
    item.querySelectorAll("button, input").forEach(control => { control.disabled = busyTodoKeys.has(key); });
    field(".todo-user").disabled = !user;
    fragment.append(item);
  }
  list.replaceChildren(fragment);
}

function renderTodos() {
  const tasks = getTodos();
  const query = byId("todo-search").value.trim().toLocaleLowerCase();
  const visible = tasks.filter(todo =>
    (activeFilter === "all" || (activeFilter === "completed" ? todo.completed : !todo.completed)) &&
    todo.todo.toLocaleLowerCase().includes(query));
  renderList(todoList, visible);
  byId("todo-count").textContent = `${visible.length} / ${tasks.length}`;
  if (profileDialog.open) renderProfileTasks();
}

function renderProfileTasks() {
  const tasks = getProfileTodos();
  const visible = tasks.filter(todo => profileFilter === "all" || (profileFilter === "completed" ? todo.completed : !todo.completed));
  const completed = tasks.filter(todo => todo.completed).length;
  byId("profile-count").textContent = `Показано: ${visible.length} / ${tasks.length} · Выполнено: ${completed} · Не выполнено: ${tasks.length - completed}`;
  renderList(byId("profile-todos"), visible, false);
}

async function fetchProfileTodos() {
  if (!profileDialog.open) return;
  const request = ++profileRequest;
  const userId = profileUserId;
  const filter = byId("profile-filter").value;
  const order = byId("profile-sort").value;
  const status = byId("profile-status");
  status.textContent = "Загрузка задач исполнителя…";
  status.classList.remove("error");
  byId("profile-todos").setAttribute("aria-busy", "true");
  byId("profile-retry").hidden = true;
  try {
    // В /todos нет документированного фильтра completed: каждый выбор делает GET,
    // сервер сортирует, затем браузер применяет userId, статус и локальные изменения.
    const result = await todoApi.getAll(order);
    if (request !== profileRequest || userId !== profileUserId || !profileDialog.open) return;
    profileServerTodos = result;
    profileFilter = filter;
    profileSort = order;
    renderProfileTasks();
    status.textContent = "Задачи исполнителя обновлены.";
  } catch (error) {
    if (request !== profileRequest || userId !== profileUserId || !profileDialog.open) return;
    byId("profile-filter").value = profileFilter;
    byId("profile-sort").value = profileSort;
    status.textContent = `Не удалось загрузить задачи исполнителя: ${error.message}. Повторите загрузку.`;
    status.classList.add("error");
    byId("profile-retry").hidden = false;
  } finally {
    if (request === profileRequest) byId("profile-todos").setAttribute("aria-busy", "false");
  }
}

function openProfile(userId) {
  const user = users.get(Number(userId));
  if (!user) return;
  profileUserId = Number(userId);
  profileServerTodos = [...serverTodos].sort((a, b) => a.id - b.id);
  profileFilter = "all";
  profileSort = "";
  byId("profile-filter").value = "all";
  byId("profile-sort").value = "";
  setAvatar(byId("profile-avatar"), user);
  byId("profile-name").textContent = `${user.firstName} ${user.lastName}`;
  byId("profile-handle").textContent = `@${user.username} · ID ${user.id}`;
  byId("profile-status").textContent = "";
  const details = [
    ["Email", user.email], ["Телефон", user.phone], ["Возраст", user.age],
    ["Пол", ({ male: "Мужской", female: "Женский" })[user.gender] || user.gender],
    ["Дата рождения", user.birthDate],
    ["Адрес", [user.address?.address, user.address?.city, user.address?.state, user.address?.country].filter(Boolean).join(", ")],
    ["Индекс", user.address?.postalCode], ["Компания", user.company?.name],
    ["Отдел", user.company?.department], ["Должность", user.company?.title],
    ["Университет", user.university], ["Роль", user.role],
    ["Рост / вес", user.height != null && user.weight != null ? `${user.height} см / ${user.weight} кг` : null],
    ["Группа крови", user.bloodGroup]
  ];
  byId("profile-details").replaceChildren();
  for (const [label, value] of details) {
    const term = document.createElement("dt");
    const description = document.createElement("dd");
    term.textContent = label;
    description.textContent = value ?? "—";
    byId("profile-details").append(term, description);
  }
  renderProfileTasks();
  profileDialog.showModal();
  fetchProfileTodos();
}

function updateCompletionLabel() {
  byId("todo-completed-label").textContent = byId("todo-completed").checked ? "Выполнено" : "Не выполнено";
}

function openTodoForm(todo = null, userId = null) {
  editingTodoKey = todo ? todoKey(todo) : null;
  todoForm.reset();
  todoInput.setCustomValidity("");
  todoInput.value = todo?.todo || "";
  byId("todo-user").value = String(todo?.userId ?? userId ?? users.keys().next().value);
  byId("todo-completed").checked = Boolean(todo?.completed);
  updateCompletionLabel();
  byId("todo-dialog-title").textContent = todo ? "Изменить задачу" : "Новая задача";
  byId("todo-add-btn").textContent = todo ? "✓ Сохранить" : "✓ Добавить";
  byId("todo-form-status").textContent = "";
  todoDialog.showModal();
  todoInput.focus();
}

byId("todo-new-btn").addEventListener("click", () => openTodoForm());
byId("profile-add-btn").addEventListener("click", () => openTodoForm(null, profileUserId));
byId("profile-filter").addEventListener("change", fetchProfileTodos);
byId("profile-sort").addEventListener("change", fetchProfileTodos);
byId("profile-retry").addEventListener("click", fetchProfileTodos);
byId("todo-completed").addEventListener("change", updateCompletionLabel);
todoInput.addEventListener("input", () => todoInput.setCustomValidity(""));
byId("todo-search").addEventListener("input", renderTodos);
byId("todo-sort").addEventListener("change", fetchTodos);
byId("todo-retry").addEventListener("click", loadData);
byId("todo-filters").addEventListener("click", event => {
  const button = event.target.closest("button[data-filter]");
  if (!button) return;
  activeFilter = button.dataset.filter;
  byId("todo-filters").querySelectorAll("button").forEach(item => {
    item.setAttribute("aria-pressed", String(item.dataset.filter === activeFilter));
  });
  renderTodos();
});

document.querySelectorAll("[data-close]").forEach(button => {
  button.addEventListener("click", () => byId(button.dataset.close).close());
});
todoDialog.addEventListener("cancel", event => { if (formBusy) event.preventDefault(); });
todoDialog.addEventListener("close", () => {
  editingTodoKey = null;
  if (profileDialog.open) byId("profile-add-btn").focus();
  else byId("todo-new-btn").focus();
});
profileDialog.addEventListener("close", () => {
  ++profileRequest; // Ответ закрытого профиля не должен менять следующий профиль.
  byId("profile-todos").setAttribute("aria-busy", "false");
  byId("todo-new-btn").focus();
});

// Главный список и профиль используют одинаковые операции и общее состояние.
for (const list of [todoList, byId("profile-todos")]) {
  const fromEvent = event => (list === todoList ? getTodos() : getProfileTodos()).find(todo => todoKey(todo) === event.target.closest(".todo-item")?.dataset.key);
  list.addEventListener("change", event => {
    if (event.target.matches(".todo-checkbox")) mutateTodo(fromEvent(event), { completed: event.target.checked });
  });
  list.addEventListener("click", event => {
    const button = event.target.closest("button[data-action]");
    const todo = fromEvent(event);
    if (!button || !todo) return;
    if (button.dataset.action === "profile") openProfile(todo.userId);
    if (button.dataset.action === "edit") openTodoForm(todo);
    if (button.dataset.action === "delete") mutateTodo(todo, null);
  });
}

async function fetchTodos() {
  const request = ++sortRequest;
  const order = byId("todo-sort").value;
  setTodoStatus("Загрузка задач…");
  todoList.setAttribute("aria-busy", "true");
  try {
    const result = await todoApi.getAll(order);
    if (request !== sortRequest) return;
    serverTodos = result;
    activeSort = order;
    byId("todo-retry").hidden = users.size > 0;
    renderTodos();
    setTodoStatus(users.size ? `Загружено задач: ${getTodos().length}` : "Задачи загружены. Ожидаем пользователей…");
  } catch (error) {
    if (request !== sortRequest) return;
    byId("todo-sort").value = activeSort;
    byId("todo-retry").hidden = false;
    renderTodos();
    setTodoStatus(`Не удалось загрузить задачи: ${error.message}. Повторите загрузку.`, true);
  } finally {
    if (request === sortRequest) todoList.setAttribute("aria-busy", "false");
  }
}

async function loadData() {
  byId("todo-retry").disabled = true;
  const results = await Promise.allSettled([fetchTodos(), todoApi.getUsers()]);
  if (results[1].status === "fulfilled") {
    users = new Map(results[1].value.map(user => [Number(user.id), user]));
    const options = [...users.values()].map(user => {
      const option = document.createElement("option");
      option.value = user.id;
      option.textContent = `${user.firstName} ${user.lastName} (@${user.username}) · ID ${user.id}`;
      return option;
    });
    byId("todo-user").replaceChildren(...options);
    byId("todo-new-btn").disabled = !users.size;
    if (!byId("todo-status").classList.contains("error")) {
      byId("todo-retry").hidden = true;
      setTodoStatus(`Загружено задач: ${getTodos().length}`);
    }
  } else {
    byId("todo-retry").hidden = false;
    setTodoStatus(`Не удалось загрузить пользователей: ${results[1].reason.message}. Повторите загрузку.`, true);
  }
  byId("todo-retry").disabled = false;
  renderTodos();
}

async function mutateTodo(todo, changes) {
  if (!todo || busyTodoKeys.has(todoKey(todo))) return false;
  const key = todoKey(todo);
  busyTodoKeys.add(key);
  renderTodos();
  try {
    if (changes === null) {
      if (todo.localKey) todoChanges.created = todoChanges.created.filter(item => todoKey(item) !== key);
      else {
        await todoApi.remove(todo.id);
        todoChanges.deleted.push(todo.id);
        delete todoChanges.updated[todo.id];
      }
    } else if (todo.localKey) {
      Object.assign(todoChanges.created.find(item => todoKey(item) === key), changes);
    } else {
      await todoApi.update(todo.id, changes);
      todoChanges.updated[todo.id] = { ...todoChanges.updated[todo.id], ...changes };
    }
    saveTodoChanges(changes === null ? "Задача удалена." : "Задача обновлена.");
    return true;
  } catch (error) {
    const message = `Не удалось ${changes === null ? "удалить" : "обновить"} задачу: ${error.message}`;
    setTodoStatus(message, true);
    if (todoDialog.open) byId("todo-form-status").textContent = message;
    return false;
  } finally {
    busyTodoKeys.delete(key);
    renderTodos();
  }
}

todoForm.addEventListener("submit", async event => {
  event.preventDefault();
  if (formBusy) return;
  const task = { todo: todoInput.value.trim(), userId: Number(byId("todo-user").value), completed: byId("todo-completed").checked };
  if (!task.todo) {
    todoInput.setCustomValidity("Введите название задачи.");
    todoInput.reportValidity();
    return;
  }
  if (!users.has(task.userId)) {
    byId("todo-form-status").textContent = "Выберите исполнителя. Если список пуст, повторите загрузку пользователей.";
    return;
  }
  formBusy = true;
  todoForm.querySelectorAll("input, select, button").forEach(control => { control.disabled = true; });
  byId("todo-form-status").textContent = "Сохранение…";
  try {
    if (editingTodoKey) {
      const todo = [...getTodos(), ...getProfileTodos()].find(item => todoKey(item) === editingTodoKey);
      if (await mutateTodo(todo, task)) todoDialog.close();
    } else {
      const created = await todoApi.create(task);
      todoChanges.created.unshift({ ...created, ...task, localKey: `local-${Date.now()}-${Math.random()}` });
      saveTodoChanges("Задача добавлена.");
      renderTodos();
      todoDialog.close();
    }
  } catch (error) {
    byId("todo-form-status").textContent = `Не удалось сохранить задачу: ${error.message}`;
  } finally {
    formBusy = false;
    todoForm.querySelectorAll("input, select, button").forEach(control => { control.disabled = false; });
  }
});

loadData();
