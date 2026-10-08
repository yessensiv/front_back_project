// CRUD задач. DummyJSON подтверждает изменения, но не хранит их на сервере.
const TODO_STORAGE_KEY = "front_back_project.todos.v1";
const todoForm = document.getElementById("todo-form");
const todoInput = document.getElementById("todo-input");
const todoAddButton = document.getElementById("todo-add-btn");
const todoList = document.getElementById("todo-list");
const todoStatus = document.getElementById("todo-status");
const todoTemplate = document.getElementById("todo-item-template");
const todoFilters = document.getElementById("todo-filters");
let activeFilter = "all";
let todos = [];
let editingTodoKey = null;
const busyTodoKeys = new Set();

function readTodoChanges() {
  try {
    const saved = JSON.parse(localStorage.getItem(TODO_STORAGE_KEY));
    if (saved && Array.isArray(saved.created) && Array.isArray(saved.deleted) && saved.updated && typeof saved.updated === "object") {
      return saved;
    }
  } catch (error) {
    console.warn("Не удалось прочитать сохранённые задачи:", error);
  }
  return { created: [], updated: {}, deleted: [] };
}

const todoChanges = readTodoChanges();

function saveTodoChanges() {
  try {
    localStorage.setItem(TODO_STORAGE_KEY, JSON.stringify(todoChanges));
    return true;
  } catch (error) {
    console.warn("Не удалось сохранить задачи в браузере:", error);
    setTodoStatus("Изменение выполнено, но браузер не смог сохранить его для следующего открытия.", true);
    return false;
  }
}

function setTodoStatus(message, isError = false) {
  todoStatus.textContent = message;
  todoStatus.classList.toggle("error", isError);
}

function todoKey(todo) {
  return todo.localKey || `server-${todo.id}`;
}

function renderTodos() {
  const visibleTodos = todos.filter(todo => {
    if (activeFilter === "active") return !todo.completed;
    if (activeFilter === "completed") return Boolean(todo.completed);
    return true;
  });
  if (visibleTodos.length === 0) {
    const empty = document.createElement("li");
    empty.className = "todo-empty";
    empty.textContent = activeFilter === "active"
      ? "Незаконченных задач нет."
      : activeFilter === "completed" ? "Законченных задач нет." : "Задач пока нет.";
    todoList.replaceChildren(empty);
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const todo of visibleTodos) {
    const key = todoKey(todo);
    const item = todoTemplate.content.firstElementChild.cloneNode(true);
    const field = selector => item.querySelector(selector);
    const editing = editingTodoKey === key;
    item.dataset.key = key;
    item.classList.toggle("completed", Boolean(todo.completed));
    const checkbox = field(".todo-checkbox");
    checkbox.checked = Boolean(todo.completed);
    checkbox.setAttribute("aria-label", `Сделано: ${todo.todo}`);
    field(".todo-text").textContent = todo.todo;
    field(".todo-text").hidden = editing;
    field(".todo-edit-input").value = todo.todo;
    field(".todo-edit-input").hidden = !editing;
    field(".todo-local-note").hidden = !todo.localKey;
    field('[data-action="edit"]').textContent = editing ? "Сохранить" : "Изменить";
    field('[data-action="cancel"]').hidden = !editing;
    item.querySelectorAll("button, .todo-checkbox").forEach(control => {
      control.disabled = busyTodoKeys.has(key);
    });
    fragment.appendChild(item);
  }
  todoList.replaceChildren(fragment);
  todoList.querySelector(".todo-edit-input:not([hidden])")?.focus();
}

// Один обработчик для всех строк: после перерисовки его не нужно назначать снова.
function todoFromEvent(event) {
  const row = event.target.closest(".todo-item");
  return todos.find(todo => todoKey(todo) === row?.dataset.key);
}

todoFilters.addEventListener("click", event => {
  const button = event.target.closest("button[data-filter]");
  if (!button || button.dataset.filter === activeFilter) return;
  activeFilter = button.dataset.filter;
  editingTodoKey = null;
  todoFilters.querySelectorAll("button[data-filter]").forEach(filter => {
    filter.setAttribute("aria-pressed", String(filter.dataset.filter === activeFilter));
  });
  renderTodos();
});

todoList.addEventListener("change", event => {
  if (event.target.matches(".todo-checkbox")) {
    updateTodo(todoFromEvent(event), { completed: event.target.checked });
  }
});

todoList.addEventListener("click", event => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const todo = todoFromEvent(event);
  if (button.dataset.action === "delete") return deleteTodo(todo);
  if (button.dataset.action === "cancel") {
    editingTodoKey = null;
  } else if (editingTodoKey === todoKey(todo)) {
    return updateTodo(todo, { todo: button.closest(".todo-item").querySelector(".todo-edit-input").value.trim() });
  } else {
    editingTodoKey = todoKey(todo);
  }
  renderTodos();
});

todoList.addEventListener("keydown", event => {
  if (!event.target.matches(".todo-edit-input")) return;
  if (event.key === "Enter") updateTodo(todoFromEvent(event), { todo: event.target.value.trim() });
  if (event.key === "Escape") {
    editingTodoKey = null;
    renderTodos();
  }
});

async function fetchTodos() {
  setTodoStatus("Загрузка задач…");
  try {
    const serverTodos = await todoApi.getAll();
    const deleted = new Set(todoChanges.deleted);
    todos = [
      ...todoChanges.created,
      ...serverTodos.filter(todo => !deleted.has(todo.id)).map(todo => ({
        ...todo,
        ...todoChanges.updated[todo.id]
      }))
    ];
    renderTodos();
    setTodoStatus(`Загружено задач: ${todos.length}`);
  } catch (error) {
    todos = [...todoChanges.created];
    renderTodos();
    setTodoStatus(`Не удалось загрузить задачи: ${error.message}. Проверьте подключение к интернету.`, true);
  }
}

todoForm.addEventListener("submit", async event => {
  event.preventDefault();
  const text = todoInput.value.trim();
  if (!text) {
    setTodoStatus("Введите текст задачи.", true);
    todoInput.focus();
    return;
  }
  todoAddButton.disabled = true;
  setTodoStatus("Добавление задачи…");
  try {
    const created = await todoApi.create(text);
    const todo = { ...created, todo: text, completed: false, localKey: `local-${Date.now()}-${Math.random()}` };
    todoChanges.created.unshift(todo);
    todos.unshift(todo);
    const saved = saveTodoChanges();
    todoForm.reset();
    renderTodos();
    if (saved) setTodoStatus("Задача добавлена.");
  } catch (error) {
    setTodoStatus(`Не удалось добавить задачу: ${error.message}`, true);
  } finally {
    todoAddButton.disabled = false;
  }
});

async function updateTodo(todo, changes) {
  const key = todoKey(todo);
  if (busyTodoKeys.has(key)) return;
  if ("todo" in changes && !changes.todo) {
    setTodoStatus("Текст задачи не может быть пустым.", true);
    return;
  }
  busyTodoKeys.add(key);
  renderTodos();
  try {
    if (!todo.localKey) {
      await todoApi.update(todo.id, changes);
      todoChanges.updated[todo.id] = { ...todoChanges.updated[todo.id], ...changes };
    }
    Object.assign(todo, changes);
    if (todo.localKey) {
      const saved = todoChanges.created.find(item => item.localKey === key);
      Object.assign(saved, changes);
    }
    const saved = saveTodoChanges();
    editingTodoKey = null;
    if (saved) setTodoStatus("Задача обновлена.");
  } catch (error) {
    setTodoStatus(`Не удалось обновить задачу: ${error.message}`, true);
  } finally {
    busyTodoKeys.delete(key);
    renderTodos();
  }
}

async function deleteTodo(todo) {
  const key = todoKey(todo);
  if (busyTodoKeys.has(key)) return;
  busyTodoKeys.add(key);
  renderTodos();
  try {
    if (todo.localKey) {
      todoChanges.created = todoChanges.created.filter(item => item.localKey !== key);
    } else {
      await todoApi.remove(todo.id);
      todoChanges.deleted.push(todo.id);
      delete todoChanges.updated[todo.id];
    }
    todos = todos.filter(item => todoKey(item) !== key);
    const saved = saveTodoChanges();
    if (saved) setTodoStatus("Задача удалена.");
  } catch (error) {
    setTodoStatus(`Не удалось удалить задачу: ${error.message}`, true);
  } finally {
    busyTodoKeys.delete(key);
    renderTodos();
  }
}

fetchTodos();
