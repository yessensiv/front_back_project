// Данные 3-х программистов
const programmers = [
  {
    name: "Есенсары Нұрдаулет",
    role: "Junior Backend Developer",
    photo: "assets/Nurdaulet.jpeg",
    about: "Студент 3-го курса по специальности «Computer Engineering and Software». Увлекаюсь веб-разработкой и созданием пользовательских интерфейсов, активно изучаю современные технологии программирования.",
    skills: ["HTML5", "CSS3", "JavaScript", "Python", "Linux", "Git"],
    experience: "Учебные проекты по разработке веб-страниц и автоматизации задач с использованием скриптов.",
    contacts: "Telegram: @prfctiv | Email: timushl404@gmail.com"
  },
  {
    name: "Жусупова Дана",
    role: "UX/UI designer",
    photo: "assets/Dana.jpeg",
    about: "UI/UX дизайнер с фокусом на создание чистых и функциональных интерфейсов.",
    skills: [
      "Figma",
      "Adobe Photoshop",
      "Adobe Illustrator",
      "UI/UX Design",
      "HTML/CSS"
    ],
    experience: "Учебные проекты по разработке веб-страниц и автоматизации задач с использованием скриптов.",
    contacts: "Telegram: hazahahahahz | Email: zhusupovad055@gmail.com"
  },
  {
    name: "Әмірхан Асылхан",
    role: "Frontend Разработчик",
    photo: "assets/Asylkhan.jpeg",
    about: "Студент 3-го курса, учусь в университете AIU. Увлекаюсь фронтенд разработкой.",
    skills: ["HTML", "CSS", "Javascript", "React", "Python", "C++", "Typescript", "Java"],
    experience: "3 года",
    contacts: "Telegram: @as1kqlw | Email: asylhkanamyrhkan@gmail.com"
  }
];


function switchTab(target) {

  const tabButtons = document.querySelectorAll(".tab-btn");
  tabButtons.forEach(btn => btn.classList.remove("active"));

  const views = document.querySelectorAll(".tab-view");
  views.forEach(view => view.classList.remove("active"));

  if (target === "main") {

    document.getElementById("tab-btn-main").classList.add("active");
    document.getElementById("view-main").classList.add("active");
  } else if (typeof target === "number" && programmers[target]) {

    const btn = document.getElementById("tab-btn-" + target);
    if (btn) btn.classList.add("active");

    const dev = programmers[target];
    document.getElementById("resumePhoto").src = dev.photo;
    document.getElementById("resumePhoto").alt = dev.name;
    document.getElementById("resumeName").textContent = dev.name;
    document.getElementById("resumeRole").textContent = dev.role;
    document.getElementById("resumeAbout").textContent = dev.about;

    const badge = document.getElementById("resumeBadge");
    if (badge) badge.textContent = dev.role;

    const skillsList = document.getElementById("resumeSkills");
    skillsList.innerHTML = "";
    dev.skills.forEach(skill => {
      const chip = document.createElement("span");
      chip.className = "skill-chip";
      chip.textContent = skill;
      skillsList.appendChild(chip);
    });

    document.getElementById("resumeExperience").textContent = dev.experience;
    document.getElementById("resumeContacts").textContent = dev.contacts;

    document.getElementById("view-resume").classList.add("active");
  } else if (["task1", "task2", "task3", "task4"].includes(target)) {
    document.getElementById("tab-btn-" + target).classList.add("active");
    document.getElementById("view-" + target).classList.add("active");
  }

  window.scrollTo(0, 0);
}

const zholEngizu = document.getElementById("rows-input");
const baganEngizu = document.getElementById("cols-input");
const kesteBatyrmasy = document.getElementById("build-table-btn");
const kesteOrny = document.getElementById("table-container");
const sanaqMati = document.getElementById("colored-counter");
const temaBatyrmasy = document.getElementById("theme-toggle-btn");
const temaMati = document.getElementById("theme-status");

function boyaulySana() {
  const boyaulyUyashyktar = document.querySelectorAll(".colored");
  sanaqMati.textContent = "Боялған ұяшықтар саны: " + boyaulyUyashyktar.length;
}

function kesteKuru() {
  const zholSany = zholEngizu.value;
  const baganSany = baganEngizu.value;
  kesteOrny.innerHTML = "";

  const keste = document.createElement("table");
  keste.className = "dynamic-table";

  for (let zhol = 0; zhol < zholSany; zhol++) {
    const kesteZholy = document.createElement("tr");
    for (let bagan = 0; bagan < baganSany; bagan++) {
      const uyashyk = document.createElement("td");
      uyashyk.textContent = (zhol + 1) + ":" + (bagan + 1);
      uyashyk.onclick = function () {
        uyashyk.classList.toggle("colored");
        boyaulySana();
      };
      kesteZholy.appendChild(uyashyk);
    }
    keste.appendChild(kesteZholy);
  }
  kesteOrny.appendChild(keste);
  boyaulySana();
}

kesteBatyrmasy.onclick = kesteKuru;

temaBatyrmasy.onclick = function () {
  document.body.classList.toggle("light-theme");
  if (document.body.classList.contains("light-theme")) {
    temaMati.textContent = "Қазір ашық тақырып қосулы.";
    temaBatyrmasy.textContent = "Қараңғы тақырыпты қосу";
  } else {
    temaMati.textContent = "Қазір қараңғы тақырып қосулы.";
    temaBatyrmasy.textContent = "Ашық тақырыпты қосу";
  }
};

kesteKuru();

// 1-тапсырма: барлық өзгеріс тек батырманы басқанда орындалады.
const greeting = document.getElementById("greeting");
const greetingBatyrmasy = document.getElementById("change-greeting-btn");
greetingBatyrmasy.onclick = function () {
  greeting.textContent = "Сәлем, әлем!";
};

const changeableParagraph = document.getElementById("changeable-paragraph");
const ozgertuBatyrmasy = document.getElementById("change-text-btn");
function changeParagraphStyle() {
  changeableParagraph.classList.toggle("changed");
}
ozgertuBatyrmasy.onclick = changeParagraphStyle;

const divKosuBatyrmasy = document.getElementById("add-div-btn");
divKosuBatyrmasy.onclick = function () {
  const janaDiv = document.createElement("div");
  janaDiv.className = "new-div";
  janaDiv.textContent = "Мен жаңа элементпін";
  document.getElementById("new-div-place").appendChild(janaDiv);
  divKosuBatyrmasy.disabled = true;
  divKosuBatyrmasy.textContent = "Жаңа div қосылды";
};

const zhouBatyrmasy = document.getElementById("delete-old-btn");
zhouBatyrmasy.onclick = function () {
  document.querySelector(".old-element").remove();
  zhouBatyrmasy.disabled = true;
  zhouBatyrmasy.textContent = "Элемент жойылды";
};

// 2-тапсырма: класты ауыстыру және барлық кластарды шығару.
const classDemo = document.getElementById("class-demo");
const toggleClassButton = document.getElementById("toggle-class-btn");
function showClasses() {
  const classes = Array.from(classDemo.classList).join(", ");
  document.getElementById("class-list").textContent = "Кластар тізімі: " + classes;
  console.log("Кластар тізімі:", classes);
}
toggleClassButton.addEventListener("click", () => {
  const active = classDemo.classList.toggle("active");
  toggleClassButton.textContent = active ? "active класын жою" : "active класын қосу";
  toggleClassButton.setAttribute("aria-pressed", String(active));
  showClasses();
});
showClasses();
