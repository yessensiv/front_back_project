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
    role: "Backend Разработчик",
    about: "",
    skills: [],
    experience: "",
    contacts: "Telegram:  | Email: "
  },
  {
    name: "Әмірхан Асылхан",
    role: "",
    about: "",
    skills: [""],
    experience: "",
    contacts: "Telegram: | Email: "
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
