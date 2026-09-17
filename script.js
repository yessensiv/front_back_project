// Данные программистов
const programmers = [
  {
    name: "Есенсары Нурдаулет",
    role: "",
    about: "",
    skills: ["HTML5", "CSS3"],
    experience: "",
    contacts: "Telegram:  | Email: "
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
