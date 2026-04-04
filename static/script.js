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

  function updateStack() {
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

  function activateTopCard() {
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
        card.style.display = "none";
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
});