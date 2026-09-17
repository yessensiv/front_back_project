// Данные программистов
const programmers = [
  {
    name: "Есенсары Нурдаулет",
    role: "Junior Backend Developer",
    about: "Студент 3-го курса по специальности «Computer Engineering and Software». Увлекаюсь веб-разработкой и созданием пользовательских интерфейсов, активно изучаю современные технологии программирования.",
    skills: ["HTML5", "CSS3", "JavaScript", "Python", "Linux", "Git"],
    experience: "Учебные проекты по разработке веб-страниц и автоматизации задач с использованием скриптов.",
    contacts: "Telegram: @prfctiv | Email: timushl404@gmail.com"
  },
  {
    name: "Жусупова Дана",
    role: "UX/UI designer",
    about: "UI/UX дизайнер с фокусом на создание чистых и функциональных интерфейсов",
    skills: ["Figma",
    "Adobe Photoshop",
    "Adobe Illustrator",
    "UI/UX Design",
    "HTML/CSS"],
    experience: "Учебные проекты по разработке веб-страниц и автоматизации задач с использованием скриптов.",
    contacts: "Telegram: hazahahahahz | Email: zhusupovad055@gmail.com"
  },
  {
    name: "Әмірхан Асылхан",
    role: "Frontend Разработчик",
    about: "Студент 3-го курса, учусь в университете AIU.Увлекаюсь в фронтенд разработкой",
    skills: ["HTML", "CSS", "Javascript", "React", "Python", "C++", "Typescript", "Java"],
    experience: "3 года",
    contacts: "Telegram: @as1kqlw | Email: asylhkanamyrhkan@gmail.com"
  }
];


function openResume(index) {
  const dev = programmers[index];

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


  document.getElementById("modal").style.display = "block";
}


function closeResume() {
  document.getElementById("modal").style.display = "none";
}


window.onclick = function(event) {
  const modal = document.getElementById("modal");
  if (event.target === modal) {
    closeResume();
  }
};
