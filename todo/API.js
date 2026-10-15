// Запросы к DummyJSON. API имитирует изменения, но не хранит их на сервере.
(() => {
  const TODO_API = "https://dummyjson.com/todos";
  const USERS_API = "https://dummyjson.com/users";

  async function requestTodo(url, options) {
    const response = await fetch(url, { ...options, signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }

  window.todoApi = Object.freeze({
    async getAll(order = "") {
      const params = new URLSearchParams({ limit: "0" });
      if (order === "asc" || order === "desc") {
        params.set("sortBy", "todo");
        params.set("order", order);
      }
      const data = await requestTodo(`${TODO_API}?${params}`);
      if (!Array.isArray(data.todos)) throw new Error("Неверный формат ответа API");
      return data.todos;
    },

    async getUsers() {
      const data = await requestTodo(`${USERS_API}?limit=0`);
      if (!Array.isArray(data.users)) throw new Error("Неверный формат пользователей API");
      return data.users;
    },

    async create(task) {
      const created = await requestTodo(`${TODO_API}/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(task)
      });
      if (created.id == null) throw new Error("API не подтвердил создание");
      return created;
    },

    update(id, changes) {
      return requestTodo(`${TODO_API}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changes)
      });
    },

    remove(id) {
      return requestTodo(`${TODO_API}/${id}`, { method: "DELETE" });
    }
  });
})();
