document.addEventListener("DOMContentLoaded", () => {
  // Fieldsets en submit
  const zeroQuestionsBox = document.querySelector(".zeroQuestionsBox");
  const firstQuestionsBox = document.querySelector(".firstQuestionsBox");
  const secondQuestionsBox = document.querySelector(".secondQuestionsBox");
  const thirdQuestionsBox = document.querySelector(".thirdQuestionsBox");
  const fourthQuestionsBox = document.querySelector(".fourthQuestionsBox");
  const fifthQuestionsBox = document.querySelector(".fifthQuestionsBox");
  const submitButton = document.querySelector('input[type="submit"]');

  // Back knoppen
  const backButton1 = document.getElementById("button21");
  const backButton2 = document.getElementById("button31");
  const backButton3 = document.getElementById("button41");
  const backButton4 = document.getElementById("button51");

  // Next knoppen
  const button1 = document.getElementById("button1");
  const button2 = document.getElementById("button2");
  const button3 = document.getElementById("button3");
  const button4 = document.getElementById("button4");
  const button5 = document.getElementById("button5");

  // Kaarten voor de stack
  const cardsContainer = document.querySelector(".cards");

  // Standaard verbergen
zeroQuestionsBox.style.display = "block";
firstQuestionsBox.style.display = "none";
secondQuestionsBox.style.display = "none";
thirdQuestionsBox.style.display = "none";
fourthQuestionsBox.style.display = "none";
fifthQuestionsBox.style.display = "none";
submitButton.style.display = "none";

// BACK knoppen
backButton1.addEventListener("click", function () {
  firstQuestionsBox.style.display = "none";
  zeroQuestionsBox.style.display = "block";
});
backButton2.addEventListener("click", function () {
  secondQuestionsBox.style.display = "none";
  firstQuestionsBox.style.display = "block";
});

backButton3.addEventListener("click", function () {
  thirdQuestionsBox.style.display = "none";
  secondQuestionsBox.style.display = "block";
});

backButton4.addEventListener("click", function () {
  fourthQuestionsBox.style.display = "none";
  thirdQuestionsBox.style.display = "block";
});

// NEXT knoppen
button1.addEventListener("click", function () {
  zeroQuestionsBox.style.display = "none";
  firstQuestionsBox.style.display = "block";
});

button2.addEventListener("click", function () {
  firstQuestionsBox.style.display = "none";
  secondQuestionsBox.style.display = "block";
});
button3.addEventListener("click", function () {
  secondQuestionsBox.style.display = "none";
  thirdQuestionsBox.style.display = "block";
});

button4.addEventListener("click", function () {
  thirdQuestionsBox.style.display = "none";
  fourthQuestionsBox.style.display = "block";
});

button5.addEventListener("click", function () {
  fourthQuestionsBox.style.display = "none";
  fifthQuestionsBox.style.display = "block";
  submitButton.style.display = "block";
});

  // Functie card stack updaten //
  function updateStack() {
    const activeCards = document.querySelectorAll(".card:not(.swiped)");

    activeCards.forEach((card, index) => {
      card.style.zIndex = activeCards.length - index;
      card.style.transform = `scale(${1 - index * 0.05}) translateY(${index * 10}px)`;
      card.style.opacity = "1";
    });
  }

  // Functie kaart swipen //

  function activateTopCard() {
    const topCard = document.querySelector(".card:not(.swiped)");
    if (!topCard) return;
    
  function swipeCard(card, direction) {
  if (!card) return;

  card.classList.add("swiped");

  card.style.transition = "transform 0.3s ease, opacity 0.3s ease";

  if (direction === "right") {
    card.style.transform = "translateX(150vw) rotate(25deg)";
  } else {
    card.style.transform = "translateX(-150vw) rotate(-25deg)";
  }

  card.style.opacity = "0";

  setTimeout(() => {
    card.style.display = "none";
    updateStack();
    activateTopCard();
  }, 300);
}

  // Swipe functionaliteit //

    let startX = 0;
    let isDragging = false;

    topCard.onmousedown = (e) => {
      isDragging = true;
      startX = e.clientX;
      topCard.style.transition = "none";
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
      const moveX = e.clientX - startX;

      topCard.style.transition = "transform 0.3s ease, opacity 0.3s ease";

if (moveX > 100) {
  topCard.classList.add("swiped");
  topCard.style.transform = "translateX(150vw) rotate(25deg)";
  topCard.style.opacity = "0";

  setTimeout(() => {
    topCard.style.display = "none";
    updateStack();
    activateTopCard();
  }, 300);

} else if (moveX < -100) {
  topCard.classList.add("swiped");
  topCard.style.transform = "translateX(-150vw) rotate(-25deg)";
  topCard.style.opacity = "0";

  setTimeout(() => {
    topCard.style.display = "none";
    updateStack();
    activateTopCard();
  }, 300);

} else {
  updateStack();
}
    }

  // Like en dislike knoppen //

const likeBtn = topCard.querySelector(".likebtn");
const dislikeBtn = topCard.querySelector(".dislikebtn");

if (likeBtn) {
  likeBtn.onclick = () => swipeCard(topCard, "right");
}

if (dislikeBtn) {
  dislikeBtn.onclick = () => swipeCard(topCard, "left");
}
  }

  if (cardsContainer) {
    updateStack();
    activateTopCard();
  }
});