
const form = document.querySelector("form");

const welcomeBox = document.querySelector(".welcome");
const firstQuestionsBox = document.querySelector(".firstQuestionsBox");
const secondQuestionsBox = document.querySelector(".secondQuestionsBox");
const thirdQuestionsBox = document.querySelector(".thirdQuestionsBox");
const fourthQuestionsBox = document.querySelector(".fourthQuestionsBox");
const fifthQuestionsBox = document.querySelector(".fifthQuestionsBox");
const submitButton = document.querySelector('input[type="submit"]');

const backButton1 = document.getElementById("button21");
const backButton2 = document.getElementById("button31");
const backButton3 = document.getElementById("button41");
const backButton4 = document.getElementById("button51");

const button1 = document.getElementById("button1");
const button2 = document.getElementById("button2");
const button3 = document.getElementById("button3");
const button4 = document.getElementById("button4");
const button5 = document.getElementById("button5");

const cardsContainer = document.querySelector(".cards");

async function saveSwipe(toUserId, action) {
  const fromUserId = document.body.dataset.userId;

  if (!fromUserId || !toUserId) {
    console.error("fromUserId of toUserId ontbreekt");
    return;
  }

  try {
    const response = await fetch("/swipe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        fromUserId,
        toUserId,
        action
      })
    });

    const data = await response.json();
    console.log("Swipe opgeslagen:", data);

    if (data.isMatch) {
      alert("It's a match!");
    }
  } catch (error) {
    console.error("Fout bij swipe opslaan:", error);
  }
}

window.updateStack = function () {
  const activeCards = document.querySelectorAll(".card:not(.swiped)");

  activeCards.forEach((card, index) => {
    const scale = Math.max(0.9, 1 - index * 0.03);
    const offset = Math.min(index * 8, 24);

    card.style.zIndex = activeCards.length - index;

    if (!card.classList.contains("dragging")) {
      card.style.transform = `scale(${scale}) translateY(${offset}px)`;
    }

    card.style.opacity = "1";
  });
}

window.activateTopCard = function () {
  const topCard = document.querySelector(".card:not(.swiped)");
  if (!topCard) return;

  function swipeCard(card, direction) {
    if (!card || card.classList.contains("swiped")) return;

    const toUserId = card.dataset.ownerId;
    const action = direction === "right" ? "like" : "dislike";

    saveSwipe(toUserId, action);

    card.classList.add("swiped");
    card.style.transition = "transform 0.3s ease, opacity 0.3s ease";

    if (direction === "right") {
      card.style.transform = "translateX(150vw) rotate(25deg)";
    } else {
      card.style.transform = "translateX(-150vw) rotate(-25deg)";
    }

    card.style.opacity = "0";

    setTimeout(() => {
      card.remove();
      updateStack();
      activateTopCard();
    }, 300);
  }

  let startX = 0;
  let isDragging = false;

  topCard.onmousedown = (e) => {
    if (e.target.closest(".likebtn") || e.target.closest(".dislikebtn")) return;

    isDragging = true;
    startX = e.clientX;
    topCard.style.transition = "none";
    topCard.classList.add("dragging");
  };

  document.onmousemove = (e) => {
    if (!isDragging) return;

    const moveX = e.clientX - startX;
    const rotate = moveX * 0.1;

    topCard.style.transform = `translateX(${moveX}px) rotate(${rotate}deg)`;
  };

  document.onmouseup = (e) => {
    if (!isDragging) return;

    isDragging = false;
    topCard.classList.remove("dragging");

    const moveX = e.clientX - startX;

    topCard.style.transition = "transform 0.3s ease, opacity 0.3s ease";

    if (moveX > 100) {
      swipeCard(topCard, "right");
    } else if (moveX < -100) {
      swipeCard(topCard, "left");
    } else {
      updateStack();
    }
  };

  const likeBtn = topCard.querySelector(".likebtn");
  const dislikeBtn = topCard.querySelector(".dislikebtn");

  if (likeBtn) {
    likeBtn.onclick = (e) => {
      e.stopPropagation();
      swipeCard(topCard, "right");
    };
  }

  if (dislikeBtn) {
    dislikeBtn.onclick = (e) => {
      e.stopPropagation();
      swipeCard(topCard, "left");
    };
  }

  topCard.ondblclick = (e) => {
    if (e.target.closest(".likebtn") || e.target.closest(".dislikebtn")) return;
    topCard.classList.toggle("flipped");
  };
}

if (cardsContainer) {
  updateStack();
  activateTopCard();
}

const locationBtn = document.getElementById('locationBtn');
if (locationBtn) {
  locationBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
      alert('Geolocatie wordt niet ondersteund.');
      return;
    }

    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude: lat, longitude: lng } = pos.coords;
      const userId = document.body.dataset.userId;

      const res = await fetch('/save-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, lat, lng })
      });

      const data = await res.json();
      alert(data.success ? '📍 Locatie opgeslagen!' : 'Fout: ' + data.message);
    }, () => {
      alert('Kon locatie niet ophalen.');
    });
  });
}

const progressFill = document.getElementById("progressFill");
const userBirthDate = document.getElementById("userAge");

function hideAll() {
  welcomeBox.classList.add("hidden");
  firstQuestionsBox.classList.add("hidden");
  secondQuestionsBox.classList.add("hidden");
  thirdQuestionsBox.classList.add("hidden");
  fourthQuestionsBox.classList.add("hidden");
  fifthQuestionsBox.classList.add("hidden");
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

// User age calculate
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

button1.addEventListener("click", () => {
  const ageWarning = document.getElementById("ageWarning");
  const ageError = document.getElementById("ageError");

  if (!userBirthDate.value) {
    ageWarning.classList.remove("error-active");
    if (ageError) {
      ageError.textContent = "Please choose your birthday.";
    }
    return;
  }

  const selectedDate = new Date(userBirthDate.value);
  const age = calculateAge(selectedDate);

  if (age < 18) {
    ageWarning.classList.add("error-active");
    if (ageError) {
      ageError.textContent = "Pet Playdates is for users aged 18+ only.";
    }
    return;
  }

  ageWarning.classList.remove("error-active");
  if (ageError) {
    ageError.textContent = "";
  }

  showStep(2);
});

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

  console.log("Birth Date:", userBirthDate.value);
  console.log("Calculated age:", age);
});

button2.addEventListener("click", () => showStep(3));
button3.addEventListener("click", () => showStep(4));
button4.addEventListener("click", () => showStep(5));

backButton1.addEventListener("click", () => showStep(1));
backButton2.addEventListener("click", () => showStep(2));
backButton3.addEventListener("click", () => showStep(3));
backButton4.addEventListener("click", () => showStep(4));

showStep(1);


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

petTypeSelect.addEventListener("change", () => {
  updateBreeds(petTypeSelect.value);
});

updateBreeds(petTypeSelect.value);

// phone number display & required
const selectedWhatsapp = document.getElementById("isWhatsapp");
const selectedEmail = document.getElementById("preferEmail");
const isPhone = document.getElementById("isPhone");
const phoneInput = document.getElementById("userPhone");

isPhone.style.display = "none";
phoneInput.required = false;

function togglePhoneField() {
  console.log("see that?");
  if (selectedWhatsapp.checked) {
    isPhone.style.display = "block";
    phoneInput.required = true;
  } else {
    isPhone.style.display = "none";
    phoneInput.required = false;
    phoneInput.value = "";
  }
}

selectedWhatsapp.addEventListener("change", togglePhoneField);
selectedEmail.addEventListener("change", togglePhoneField);


const password = document.getElementById("isPassword");
const checkPass = document.getElementById("checkPassword");
const matchText = document.getElementById("passwordMatch");

function checkPasswords() {
  if (checkPass.value === "") {
    matchText.textContent = "";
    return;
  }

  if (password.value === checkPass.value) {
    matchText.textContent = "Passwords match";
    matchText.style.color = "green";
  } else {
    matchText.textContent = "Passwords do not match";
    matchText.style.color = "red";
  }
}

checkPass.addEventListener("input", checkPasswords);
password.addEventListener("input", checkPasswords);

const btn = document.getElementById('createAccountBtn');

btn.closest('form').addEventListener('submit', (e) => {
    if (btn.classList.contains('loading')) {
        e.preventDefault();
        return;
    }
    btn.classList.add('loading');
    btn.disabled = true;
});