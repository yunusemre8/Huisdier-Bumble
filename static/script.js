const form = document.querySelector("form");

const welcomeBox = document.querySelector(".welcome");
const firstQuestionsBox = document.querySelector(".firstQuestionsBox");
const secondQuestionsBox = document.querySelector(".secondQuestionsBox");
const thirdQuestionsBox = document.querySelector(".thirdQuestionsBox");
const fourthQuestionsBox = document.querySelector(".fourthQuestionsBox");
const fifthQuestionsBox = document.querySelector(".fifthQuestionsBox");

const backButton1 = document.getElementById("button21");
const backButton2 = document.getElementById("button31");
const backButton3 = document.getElementById("button41");
const backButton4 = document.getElementById("button51");

const button1 = document.getElementById("button1");
const button2 = document.getElementById("button2");
const button3 = document.getElementById("button3");
const button4 = document.getElementById("button4");

const progressFill = document.getElementById("progressFill");
const userBirthDate = document.getElementById("userAge");

function hideAll() {
  if (welcomeBox) welcomeBox.classList.add("hidden");
  if (firstQuestionsBox) firstQuestionsBox.classList.add("hidden");
  if (secondQuestionsBox) secondQuestionsBox.classList.add("hidden");
  if (thirdQuestionsBox) thirdQuestionsBox.classList.add("hidden");
  if (fourthQuestionsBox) fourthQuestionsBox.classList.add("hidden");
  if (fifthQuestionsBox) fifthQuestionsBox.classList.add("hidden");
}

function updateProgress(step) {
  const totalSteps = 5;
  const percent = (step / totalSteps) * 100;
  progressFill.style.width = `${percent}%`;
}

function showStep(step) {
  hideAll();

  if (step === 1) {
    welcomeBox.classList.remove("hidden");
    firstQuestionsBox.classList.remove("hidden");
  } else if (step === 2) {
    secondQuestionsBox.classList.remove("hidden");
  } else if (step === 3) {
    thirdQuestionsBox.classList.remove("hidden");
  } else if (step === 4) {
    fourthQuestionsBox.classList.remove("hidden");
  } else if (step === 5) {
    fifthQuestionsBox.classList.remove("hidden");
  }

  updateProgress(step);
}


function calculateAge(userBirthDate) {
  const today = new Date();
  let age = today.getFullYear() - userBirthDate.getFullYear();

  const calculateMonth = today.getMonth() - userBirthDate.getMonth();

  if (
    calculateMonth < 0 ||
    (calculateMonth === 0 && today.getDate() < userBirthDate.getDate())
  ) {
    age--;
  }
  return age;
}
if (button1) {
  button1.addEventListener("click", () => {
    const ageWarning = document.getElementById("ageWarning");
    const ageError = document.getElementById("ageError");

    if (!userBirthDate.value) {
      if (ageWarning) {
        ageWarning.classList.remove("error-active");
      }
      if (ageError) {
        ageError.textContent = "Please choose your birthday.";
      }
      return;
    }

    const selectedDate = new Date(userBirthDate.value);
    const age = calculateAge(selectedDate);

    if (age < 18) {
      if (ageWarning) {
        ageWarning.classList.add("error-active");
      }
      if (ageError) {
        ageError.textContent = "Pet Playdates is for users aged 18+ only.";
      }
      return;
    }

    if (ageWarning) { ageWarning.classList.remove("error-active"); }
    if (ageError) {
      ageError.textContent = "";
    }

    showStep(2);
  });
}

if (form) {
  form.addEventListener("submit", function (event) {
    const ageError = document.getElementById("ageError");

    if (!userBirthDate.value) {
      event.preventDefault();
      if (ageError) {
        ageError.textContent = "Please choose your birthday.";
      }
      showStep(1);
      return;
    }

    const selectedDate = new Date(userBirthDate.value);
    const age = calculateAge(selectedDate);

    if (age < 18) {
      event.preventDefault();
      if (ageError) {
        ageError.textContent = "Pet Playdates is for users aged 18+ only.";
      }
      showStep(1);
    }
  });
}

if (button2) {
  button2.addEventListener("click", () => showStep(3));
}
if (button3) {
  button3.addEventListener("click", () => showStep(4));
}
if (button4) {
  button4.addEventListener("click", () => showStep(5));
}
if (backButton1) {
  backButton1.addEventListener("click", () => showStep(1));
}
if (backButton2) {
  backButton2.addEventListener("click", () => showStep(2));
}
if (backButton3) {
  backButton3.addEventListener("click", () => showStep(3));

}
if (backButton4) {
  backButton4.addEventListener("click", () => showStep(4));
}

if (welcomeBox && firstQuestionsBox && progressFill) {
  showStep(1);
}


const breeds = {
  cat: [
    "British Shorthair",
    "European Shorthair",
    "Ragdoll",
    "Maine",
    "Domestic",
    "Persian",
    "Mix/ Other"
  ],
  dog: [
    "Labrador Retriever",
    "Labradoodle",
    "Golden Retriever",
    "Chihuahua",
    "Pomeranian",
    "French Bulldog",
    "Mix/Other"
  ]
};

const petTypeSelect = document.getElementById("petType");
const breedSelect = document.getElementById("isBreed");

const updateBreeds = (type) => {
  if (!breedSelect) return;

  breedSelect.innerHTML = "";

  if (!type || !breeds[type]) return;

  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "Select a breed";
  defaultOption.disabled = true;
  defaultOption.selected = true;
  breedSelect.appendChild(defaultOption);

  breeds[type].forEach((breed) => {
    const option = document.createElement("option");
    option.value = breed;
    option.textContent = breed;
    breedSelect.appendChild(option);
  });
};

if (petTypeSelect) {
  petTypeSelect.addEventListener("change", () => {
    updateBreeds(petTypeSelect.value);
  });

  updateBreeds(petTypeSelect.value);
}


const selectedWhatsapp = document.getElementById("isWhatsapp");
const selectedEmail = document.getElementById("preferEmail");
const isPhone = document.getElementById("isPhone");
const phoneInput = document.getElementById("userPhone");

if (isPhone && phoneInput) {
  isPhone.style.display = "none";
  phoneInput.required = false;
}

function togglePhoneField() {
  if (!selectedWhatsapp || !isPhone || !phoneInput) return;

  if (selectedWhatsapp.checked) {
    isPhone.style.display = "block";
    phoneInput.required = true;
  } else {
    isPhone.style.display = "none";
    phoneInput.required = false;
    phoneInput.value = "";
  }
}

if (selectedWhatsapp) {
  selectedWhatsapp.addEventListener("change", togglePhoneField);
}
if (selectedEmail) {
  selectedEmail.addEventListener("change", togglePhoneField);
}

const password = document.getElementById("isPassword");
const checkPass = document.getElementById("checkPassword");
const matchText = document.getElementById("passwordMatch");

function checkPasswords() {
  if (!password || !checkPass || !matchText) return;

  if (checkPass) {
    checkPass.addEventListener("input", checkPasswords);
  }
  if (password) {
    password.addEventListener("input", checkPasswords);
  }
}
const btn = document.getElementById('createAccountBtn');

if (btn) {
  btn.closest('form').addEventListener('submit', (e) => {
    if (btn.classList.contains('loading')) {
      e.preventDefault();
      return;
    }
    btn.classList.add('loading');
    btn.disabled = true;
  });
}