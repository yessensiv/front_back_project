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

// Функция переключения вкладок
function switchTab(target) {
  // 1. Снимаем класс active со всех верхних кнопок-вкладок
  const tabButtons = document.querySelectorAll(".tab-btn");
  tabButtons.forEach(btn => btn.classList.remove("active"));

  // 2. Скрываем все экраны
  const views = document.querySelectorAll(".tab-view");
  views.forEach(view => view.classList.remove("active"));

  if (target === "main") {
    // Активируем кнопку «Главная» и показываем Main page
    document.getElementById("tab-btn-main").classList.add("active");
    document.getElementById("view-main").classList.add("active");
  } else if (typeof target === "number" && programmers[target]) {
    // Активируем соответствующую вкладку (1, 2 или 3 человек)
    const btn = document.getElementById("tab-btn-" + target);
    if (btn) btn.classList.add("active");

    // Заполняем данные резюме выбранного участника
    const dev = programmers[target];
    document.getElementById("resumePhoto").src = dev.photo;
    document.getElementById("resumePhoto").alt = dev.name;
    document.getElementById("resumeName").textContent = dev.name;
    document.getElementById("resumeRole").textContent = dev.role;
    document.getElementById("resumeAbout").textContent = dev.about;

    const skillsList = document.getElementById("resumeSkills");
    skillsList.innerHTML = "";
    dev.skills.forEach(skill => {
      const li = document.createElement("li");
      li.textContent = skill;
      skillsList.appendChild(li);
    });

    document.getElementById("resumeExperience").textContent = dev.experience;
    document.getElementById("resumeContacts").textContent = dev.contacts;

    // Показываем экран резюме
    document.getElementById("view-resume").classList.add("active");
  }

  window.scrollTo(0, 0);
}
