document.addEventListener("DOMContentLoaded", () => {

    // ===== SWIPE =====
    const cardsContainer = document.querySelector(".cards")
  
    async function saveSwipe(toUserId, action) {
      const fromUserId = document.body.dataset.userId
      if (!fromUserId || !toUserId) return
  
      try {
        const response = await fetch("/swipe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fromUserId, toUserId, action })
        })
        const data = await response.json()
        if (data.isMatch) alert("It's a match!")
      } catch (error) {
        console.error("Fout bij swipe opslaan:", error)
      }
    }
  
    window.updateStack = function() {
      const activeCards = document.querySelectorAll(".card:not(.swiped)")
      activeCards.forEach((card, index) => {
        const scale = Math.max(0.9, 1 - index * 0.03)
        const offset = Math.min(index * 8, 24)
        card.style.zIndex = activeCards.length - index
        if (!card.classList.contains("dragging")) {
          card.style.transform = `scale(${scale}) translateY(${offset}px)`
        }
        card.style.opacity = "1"
      })
    }
  
    window.activateTopCard = function() {
      const topCard = document.querySelector(".card:not(.swiped)")
      if (!topCard) return
  
      function swipeCard(card, direction) {
        if (!card || card.classList.contains("swiped")) return
        const toUserId = card.dataset.ownerId
        const action = direction === "right" ? "like" : "dislike"
        saveSwipe(toUserId, action)
        card.classList.add("swiped")
        card.style.transition = "transform 0.3s ease, opacity 0.3s ease"
        card.style.transform = direction === "right"
          ? "translateX(150vw) rotate(25deg)"
          : "translateX(-150vw) rotate(-25deg)"
        card.style.opacity = "0"
        setTimeout(() => {
          card.remove()
          updateStack()
          activateTopCard()
        }, 300)
      }
  
      let startX = 0
      let isDragging = false
  
      topCard.onmousedown = (e) => {
        if (e.target.closest(".likebtn") || e.target.closest(".dislikebtn")) return
        isDragging = true
        startX = e.clientX
        topCard.style.transition = "none"
        topCard.classList.add("dragging")
      }
  
      document.onmousemove = (e) => {
        if (!isDragging) return
        const moveX = e.clientX - startX
        topCard.style.transform = `translateX(${moveX}px) rotate(${moveX * 0.1}deg)`
      }
  
      document.onmouseup = (e) => {
        if (!isDragging) return
        isDragging = false
        topCard.classList.remove("dragging")
        const moveX = e.clientX - startX
        topCard.style.transition = "transform 0.3s ease, opacity 0.3s ease"
        if (moveX > 100) swipeCard(topCard, "right")
        else if (moveX < -100) swipeCard(topCard, "left")
        else updateStack()
      }
  
      const likeBtn = topCard.querySelector(".likebtn")
      const dislikeBtn = topCard.querySelector(".dislikebtn")
      if (likeBtn) likeBtn.onclick = (e) => { e.stopPropagation(); swipeCard(topCard, "right") }
      if (dislikeBtn) dislikeBtn.onclick = (e) => { e.stopPropagation(); swipeCard(topCard, "left") }
  
      topCard.ondblclick = (e) => {
        if (e.target.closest(".likebtn") || e.target.closest(".dislikebtn")) return
        topCard.classList.toggle("flipped")
      }
    }
  
    if (cardsContainer) {
      updateStack()
      activateTopCard()
    }
  
    // ===== SWIPE HINT =====
    const hint = document.getElementById("swipeHint")
    if (hint) {
      hint.addEventListener("click", () => {
        hint.style.transition = "opacity 0.3s"
        hint.style.opacity = "0"
        hint.style.pointerEvents = "none"
      })
    }
  
    // ===== LOCATION =====
    const locationBtn = document.getElementById("locationBtn")
    if (locationBtn) {
      locationBtn.addEventListener("click", () => {
        if (!navigator.geolocation) {
          alert("Geolocatie wordt niet ondersteund.")
          return
        }
        navigator.geolocation.getCurrentPosition(async (pos) => {
          const { latitude: lat, longitude: lng } = pos.coords
          const userId = document.body.dataset.userId
          const res = await fetch("/save-location", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: userId, lat, lng })
          })
          const data = await res.json()
          alert(data.success ? "📍 Locatie opgeslagen!" : "Fout: " + data.message)
        }, () => {
          alert("Kon locatie niet ophalen.")
        })
      })
    }
  
    // ===== FILTER SIDEBAR =====
    const breeds = {
      dog: ["Labrador Retriever", "Labradoodle", "Golden Retriever", "Chihuahua", "Pomeranian", "French Bulldog", "Mix/Other"],
      cat: ["British Shorthair", "European Shorthair", "Ragdoll", "Maine", "Domestic", "Persian", "Mix/Other"]
    }
  
    function updateBreedChips(type) {
      const chipGroup = document.getElementById("breed-chips")
      if (!chipGroup) return
      chipGroup.innerHTML = ""
      if (!type || !breeds[type]) return
      breeds[type].forEach(breed => {
        const btn = document.createElement("button")
        btn.className = "multi-chip"
        btn.textContent = breed
        btn.addEventListener("click", () => btn.classList.toggle("active"))
        chipGroup.appendChild(btn)
      })
    }
  
    const openBtn = document.getElementById("open-button")
    const closeBtn = document.getElementById("close-button")
    const sidebar = document.getElementById("sidebar")
  
    if (openBtn) openBtn.addEventListener("click", () => sidebar.classList.add("open"))
    if (closeBtn) closeBtn.addEventListener("click", () => sidebar.classList.remove("open"))
  
    document.querySelectorAll(".type-button").forEach(button => {
      button.addEventListener("click", () => {
        document.querySelectorAll(".type-button").forEach(btn => btn.classList.remove("active"))
        button.classList.add("active")
        updateBreedChips(button.dataset.type)
      })
    })
  
    document.querySelectorAll(".single-chip").forEach(chip => {
      chip.addEventListener("click", () => {
        if (chip.classList.contains("active")) chip.classList.remove("active")
        else {
          document.querySelectorAll(".single-chip").forEach(c => c.classList.remove("active"))
          chip.classList.add("active")
        }
      })
    })
  
    document.querySelectorAll(".frequency-chip").forEach(chip => {
      chip.addEventListener("click", () => {
        if (chip.classList.contains("active")) chip.classList.remove("active")
        else {
          document.querySelectorAll(".frequency-chip").forEach(c => c.classList.remove("active"))
          chip.classList.add("active")
        }
      })
    })
  
    document.querySelectorAll(".place-chip").forEach(chip => {
      chip.addEventListener("click", () => {
        if (chip.classList.contains("active")) chip.classList.remove("active")
        else {
          document.querySelectorAll(".place-chip").forEach(c => c.classList.remove("active"))
          chip.classList.add("active")
        }
      })
    })
  
    function getFilters() {
      const typeBtn = document.querySelector(".type-button.active")
      const sizeChip = document.querySelector(".single-chip.active")
      const frequencyChip = document.querySelector(".frequency-chip.active")
      const placeChip = document.querySelector(".place-chip.active")
      const cityInput = document.getElementById("city-input")
      const activeBreeds = [...document.querySelectorAll(".multi-chip.active")].map(c => c.textContent.trim())
      return {
        petType: typeBtn ? typeBtn.dataset.type : null,
        size: sizeChip ? sizeChip.dataset.size : null,
        frequency: frequencyChip ? frequencyChip.dataset.frequency : null,
        place: placeChip ? placeChip.dataset.place : null,
        city: cityInput ? cityInput.value.trim() : null,
        breeds: activeBreeds
      }
    }
  
    function renderResults(pets) {
      const results = document.getElementById("results")
      if (pets.length === 0) {
        results.innerHTML = "<p>No pets found.</p>"
        return
      }
      results.innerHTML = pets.map(pet => `
        <article class="card" data-owner-id="${pet._id}">
          <div class="card-inner">
            <div class="card-front">
              <img class="matchingimages" src="/upload/${pet.cover}" alt="${pet.petName || "Animal"}">
              <button class="dislikebtn" type="button">
                <img src="/images/trashcan.png" alt="Delete button">
              </button>
              <button class="likebtn" type="button">
                <img src="/images/yellowheart.png" alt="Heart button">
              </button>
            </div>
            <div class="card-back">
              <h2>${pet.petName || "Naam onbekend"}</h2>
              <p><strong>Soort:</strong> ${pet.petType || "Onbekend"}</p>
              <p><strong>Ras:</strong> ${pet.petBreed || "Onbekend"}</p>
              <p><strong>Gewicht:</strong> ${pet.petWeight || "Onbekend"}</p>
            </div>
          </div>
        </article>
      `).join("")
      if (window.updateStack) window.updateStack()
      if (window.activateTopCard) window.activateTopCard()
    }
  
    const applyBtn = document.getElementById("apply-button")
    if (applyBtn) {
      applyBtn.addEventListener("click", async () => {
        const { petType, size, breeds: selectedBreeds, frequency, place, city } = getFilters()
        const params = new URLSearchParams()
        if (petType) params.append("petType", petType)
        if (size) params.append("size", size)
        if (selectedBreeds.length > 0) params.append("breeds", selectedBreeds.join(","))
        if (frequency) params.append("frequency", frequency)
        if (place) params.append("place", place)
        if (city) params.append("city", city)
        const response = await fetch(`/api/pets?${params}`)
        const pets = await response.json()
        renderResults(pets)
        sidebar.classList.remove("open")
      })
    }
  
    const resetBtn = document.getElementById("reset-button")
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        document.querySelectorAll(".type-button, .single-chip, .multi-chip, .frequency-chip, .place-chip")
          .forEach(c => c.classList.remove("active"))
        const breedChips = document.getElementById("breed-chips")
        if (breedChips) breedChips.innerHTML = ""
        const cityInput = document.getElementById("city-input")
        if (cityInput) cityInput.value = ""
      })
    }
  
  })