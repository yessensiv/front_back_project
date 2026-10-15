// Test dependency only: npm install --no-save --package-lock=false jsdom
// Run: node todo/tests.cjs (the application itself needs no packages).
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const source = name => fs.readFileSync(path.join(__dirname, name), 'utf8');
const seed = [
  { id: 1, todo: 'Zulu task with a long title that wraps onto several lines', userId: 1, completed: false },
  { id: 2, todo: 'Alpha task', userId: 1, completed: true },
  { id: 3, todo: 'Beta task', userId: 2, completed: false }
];
const people = [
  { id: 1, username: 'emilys', firstName: 'Emily', lastName: 'Johnson', email: 'emily@example.test', image: 'https://example.test/avatar.png', address: { city: 'City' } },
  { id: 2, username: 'alex', firstName: 'Alex', lastName: 'Smith' }
];
const storageKey = 'front_back_project.todos.v1';
const tick = () => new Promise(resolve => setTimeout(resolve, 0));

async function createApp(saved, initialFailure = '') {
  const dom = new JSDOM(html, { url: 'http://localhost/', runScripts: 'outside-only' });
  const w = dom.window;
  w.AbortSignal = AbortSignal;
  w.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  w.HTMLDialogElement.prototype.close = function () { this.open = false; this.dispatchEvent(new w.Event('close')); };
  if (saved) w.localStorage.setItem(storageKey, saved);
  const requests = [];
  const control = { fail: initialFailure, delay: null };
  w.fetch = async (url, options = {}) => {
    requests.push({ url, ...options });
    if (control.fail && url.includes(control.fail)) return { ok: false, status: 503 };
    const parsed = new URL(url);
    let body;
    if (options.method === 'POST') body = { id: 255, ...JSON.parse(options.body) };
    else if (options.method) body = { id: Number(parsed.pathname.split('/').pop()), ...JSON.parse(options.body || '{}') };
    else if (parsed.pathname === '/users') body = { users: people };
    else {
      let tasks = [...seed];
      if (parsed.searchParams.has('order')) tasks.sort((a, b) => a.todo.localeCompare(b.todo) * (parsed.searchParams.get('order') === 'asc' ? 1 : -1));
      body = { todos: tasks };
    }
    if (control.delay) await control.delay(url);
    return { ok: true, json: async () => body };
  };
  w.eval(source('API.js'));
  w.eval(source('script.js'));
  await tick();
  const $ = selector => w.document.querySelector(selector);
  const all = selector => [...w.document.querySelectorAll(selector)];
  const event = (selector, name) => $(selector).dispatchEvent(new w.Event(name, { bubbles: true, cancelable: true }));
  const fill = (selector, value) => { $(selector).value = value; event(selector, 'input'); };
  const click = selector => $(selector).click();
  return { dom, w, $, all, event, fill, click, requests, control };
}

(async () => {
  const app = await createApp();
  const { w, $, all, event, fill, click, requests, control } = app;
  assert.equal(all('#todo-list .todo-item').length, 3);
  assert.equal($('#todo-list .user-handle').textContent, '@emilys');
  assert.equal($('#todo-list .todo-content').children[1].className, 'todo-user');
  assert.equal($('#todo-user').options.length, 2);
  assert(requests.some(r => r.url === 'https://dummyjson.com/users?limit=0'));

  fill('#todo-search', 'aLPHa');
  assert.equal(all('#todo-list .todo-item').length, 1);
  click('#todo-list .todo-user');
  assert.equal($('#profile-dialog').open, true);
  assert.equal($('#profile-name').textContent, 'Emily Johnson');
  assert.equal(all('#profile-todos .todo-item').length, 2, 'profile ignores main search');
  assert($('#profile-details').textContent.includes('emily@example.test'));

  click('#profile-todos [data-key="server-1"] .todo-checkbox');
  await tick();
  assert.equal($('#profile-todos [data-key="server-1"] .task-state').textContent, 'Выполнено');
  assert.equal(JSON.parse(requests.find(r => r.method === 'PATCH').body).completed, true);

  click('#profile-todos [data-key="server-1"] [data-action="edit"]');
  fill('#todo-input', 'Edited task');
  fill('#todo-user', '2');
  event('#todo-form', 'submit');
  await tick();
  assert.equal($('#todo-dialog').open, false);
  assert.equal(all('#profile-todos .todo-item').length, 1, 'reassigned task leaves old profile');
  assert.equal(JSON.parse(w.localStorage.getItem(storageKey)).updated[1].userId, 2);

  click('#profile-add-btn');
  assert.equal($('#todo-user').value, '1');
  fill('#todo-input', 'Local task');
  click('#todo-completed');
  assert.equal($('#todo-completed-label').textContent, 'Выполнено');
  event('#todo-form', 'submit');
  event('#todo-form', 'submit');
  await tick();
  assert.equal(requests.filter(r => r.method === 'POST').length, 1, 'double submit protected');
  assert.equal(all('#profile-todos .todo-item').length, 2);
  assert.deepEqual(JSON.parse(requests.find(r => r.method === 'POST').body), { todo: 'Local task', userId: 1, completed: true });

  const localKey = JSON.parse(w.localStorage.getItem(storageKey)).created[0].localKey;
  const before = requests.length;
  click(`#profile-todos [data-key="${localKey}"] [data-action="edit"]`);
  fill('#todo-input', '<img src=x onerror=alert(1)>');
  event('#todo-form', 'submit');
  await tick();
  assert.equal(requests.length, before, 'new DummyJSON tasks update locally');
  assert.equal($('#profile-todos .todo-text img'), null, 'task text cannot inject HTML');
  click(`#profile-todos [data-key="${localKey}"] [data-action="delete"]`);
  await tick();
  assert.equal(requests.length, before, 'new DummyJSON tasks delete locally');

  control.fail = '/todos/2';
  click('#profile-todos [data-key="server-2"] [data-action="delete"]');
  await tick();
  assert($('#profile-todos [data-key="server-2"]'), 'failed delete preserves task');
  assert($('#profile-status').textContent.includes('503'));
  control.fail = '';
  click('#profile-todos [data-key="server-2"] [data-action="delete"]');
  await tick();
  assert.equal($('#profile-todos [data-key="server-2"]'), null);
  click('[data-close="profile-dialog"]');
  fill('#todo-search', '');
  fill('#todo-sort', 'asc'); event('#todo-sort', 'change'); await tick();
  assert(requests.some(r => r.url.includes('sortBy=todo&order=asc')));
  assert.equal($('#todo-list .todo-text').textContent, 'Beta task');
  fill('#todo-sort', 'desc'); event('#todo-sort', 'change'); await tick();
  assert.equal($('#todo-list .todo-text').textContent, 'Edited task');
  assert.equal($('#todo-list [data-key="server-2"]'), null, 'sorting does not restore deletion');

  let release;
  control.delay = url => url.includes('order=asc') ? new Promise(resolve => { release = resolve; }) : Promise.resolve();
  fill('#todo-sort', 'asc'); event('#todo-sort', 'change');
  fill('#todo-sort', 'desc'); event('#todo-sort', 'change');
  await tick(); release(); await tick(); control.delay = null;
  assert.equal($('#todo-list .todo-text').textContent, 'Edited task', 'late sort response ignored');

  control.fail = '/todos?';
  fill('#todo-sort', 'asc'); event('#todo-sort', 'change'); await tick();
  assert.equal($('#todo-sort').value, 'desc', 'failed sort restores selection');
  assert.equal($('#todo-retry').hidden, false);
  control.fail = '';
  click('#todo-retry'); await tick();
  assert.equal($('#todo-retry').hidden, true);

  click('#todo-new-btn'); fill('#todo-input', '    '); event('#todo-form', 'submit');
  assert.equal($('#todo-input').validity.customError, true);
  click('[data-close="todo-dialog"]');
  assert.equal($('#todo-dialog').open, false);
  click('[data-filter="active"]');
  assert.equal(all('#todo-list .todo-item').length, 1);
  click('[data-filter="completed"]');
  assert.equal(all('#todo-list .todo-item').length, 1);

  const reloaded = await createApp(w.localStorage.getItem(storageKey));
  assert.equal(reloaded.all('#todo-list .todo-item').length, 2);
  assert.equal(reloaded.$('[data-key="server-1"] .todo-text').textContent, 'Edited task');
  assert.equal(reloaded.$('[data-key="server-1"] .user-handle').textContent, '@alex');
  reloaded.dom.window.close();

  const legacy = await createApp(JSON.stringify({
    created: [{ id: 255, todo: 'Previously saved', userId: 1, completed: false, localKey: 'local-old' }],
    updated: { 3: { completed: true } }, deleted: [2]
  }));
  assert.equal(legacy.all('#todo-list .todo-item').length, 3);
  assert.equal(legacy.$('[data-key="local-old"] .user-handle').textContent, '@emilys');
  assert.equal(legacy.$('[data-key="server-3"] .todo-checkbox').checked, true);
  legacy.dom.window.close();

  const unavailable = await createApp(null, '/users');
  assert.equal(unavailable.$('#todo-new-btn').disabled, true);
  assert.equal(unavailable.all('#todo-list .todo-item').length, 3);
  assert.equal(unavailable.$('#todo-retry').hidden, false);
  unavailable.control.fail = '';
  unavailable.click('#todo-retry'); await tick();
  assert.equal(unavailable.$('#todo-new-btn').disabled, false);
  unavailable.control.fail = '/todos/add';
  unavailable.click('#todo-new-btn');
  unavailable.fill('#todo-input', 'Keep unsaved text');
  unavailable.event('#todo-form', 'submit'); await tick();
  assert.equal(unavailable.$('#todo-dialog').open, true);
  assert.equal(unavailable.$('#todo-input').value, 'Keep unsaved text');
  assert.equal(unavailable.$('#todo-add-btn').disabled, false);
  assert(unavailable.$('#todo-form-status').textContent.includes('503'));
  unavailable.dom.window.close();

  const profile = await createApp();
  profile.click('#todo-list .todo-user'); await tick();
  const initialRequests = profile.requests.length;
  profile.fill('#profile-sort', 'asc'); profile.event('#profile-sort', 'change'); await tick();
  assert.equal(profile.requests.length, initialRequests + 1);
  assert(profile.requests.at(-1).url.includes('sortBy=todo&order=asc'));
  assert.equal(profile.$('#profile-todos .todo-text').textContent, 'Alpha task');
  assert.equal(profile.$('#todo-list .todo-text').textContent, seed[0].todo, 'profile sort is independent');
  profile.fill('#profile-filter', 'completed'); profile.event('#profile-filter', 'change'); await tick();
  assert.equal(profile.requests.length, initialRequests + 2, 'status filter sends GET too');
  assert.equal(profile.all('#profile-todos .todo-item').length, 1);
  assert(profile.$('#profile-todos [data-key="server-2"]'));
  profile.click('#profile-todos .todo-checkbox'); await tick();
  assert.equal(profile.all('#profile-todos .todo-item').length, 0, 'status change reapplies filter');
  assert.equal(profile.$('#todo-list [data-key="server-2"] .todo-checkbox').checked, false);

  profile.fill('#profile-filter', 'active'); profile.event('#profile-filter', 'change'); await tick();
  assert.equal(profile.all('#profile-todos .todo-item').length, 2, 'GET preserves local status');
  profile.fill('#profile-sort', 'desc'); profile.event('#profile-sort', 'change'); await tick();
  assert(profile.requests.at(-1).url.includes('order=desc'));
  assert.equal(profile.$('#profile-todos .todo-text').textContent, seed[0].todo);
  profile.click('#profile-add-btn'); profile.fill('#todo-input', 'New profile task');
  profile.event('#todo-form', 'submit'); await tick();
  profile.fill('#profile-sort', 'asc'); profile.event('#profile-sort', 'change'); await tick();
  assert.deepEqual(profile.all('#profile-todos .todo-text').map(el => el.textContent), ['Alpha task', 'New profile task', seed[0].todo]);

  profile.control.fail = '/todos?';
  profile.fill('#profile-filter', 'completed'); profile.event('#profile-filter', 'change'); await tick();
  assert.equal(profile.$('#profile-filter').value, 'active');
  assert.equal(profile.all('#profile-todos .todo-item').length, 3);
  assert.equal(profile.$('#profile-retry').hidden, false);
  assert(profile.$('#profile-status').textContent.includes('503'));
  profile.control.fail = '';
  profile.click('#profile-retry'); await tick();
  assert.equal(profile.$('#profile-retry').hidden, true);

  let releaseProfile;
  profile.control.delay = url => url.includes('order=desc') ? new Promise(resolve => { releaseProfile = resolve; }) : Promise.resolve();
  profile.fill('#profile-sort', 'desc'); profile.event('#profile-sort', 'change');
  profile.fill('#profile-sort', 'asc'); profile.event('#profile-sort', 'change'); await tick();
  releaseProfile(); await tick();
  assert.equal(profile.$('#profile-todos .todo-text').textContent, 'Alpha task', 'late profile sort ignored');

  profile.fill('#profile-sort', 'desc'); profile.event('#profile-sort', 'change');
  profile.click('[data-close="profile-dialog"]');
  profile.click('#todo-list [data-key="server-3"] .todo-user'); await tick();
  releaseProfile(); await tick();
  assert.equal(profile.$('#profile-handle').textContent, '@alex · ID 2');
  assert.equal(profile.all('#profile-todos .todo-item').length, 1);
  assert.equal(profile.$('#profile-todos .todo-text').textContent, 'Beta task', 'old user response ignored');
  assert.equal(profile.$('#profile-filter').value, 'all');
  assert.equal(profile.$('#profile-sort').value, '');
  assert.equal(profile.$('#profile-todos').getAttribute('aria-busy'), 'false');
  profile.dom.window.close();
  app.dom.window.close();
  console.log('PASS: users, profile GET filters/sorts, independent lists, search, CRUD, assignment, status, request races, errors/retry, cancellation, validation, safe text and persistence');
})().catch(error => { console.error(error); process.exitCode = 1; });
