// Запросы к DummyJSON. API имитирует изменения, но не хранит их на сервере.
(() => {
  const TODO_API = "https://dummyjson.com/todos";

  async function requestTodo(url, options) {
    const response = await fetch(url, options);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }

  window.todoApi = Object.freeze({
    async getAll() {
      const data = await requestTodo(`${TODO_API}?limit=0`);
      if (!Array.isArray(data.todos)) throw new Error("Неверный формат ответа API");
      return data.todos;
    },

    async create(text) {
      const created = await requestTodo(`${TODO_API}/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ todo: text, completed: false, userId: 5 })
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
