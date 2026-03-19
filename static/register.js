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
const button4 = document.getElementById("button4")

firstQuestionsBox.style.display = "block";
secondQuestionsBox.style.display = "none";
thirdQuestionsBox.style.display = "none";
fourthQuestionsBox.style.display = "none";
fifthQuestionsBox.style.display = "none";
submitButton.style.display = "none";

const form = document.querySelector("form")

backButton1.addEventListener("click", function () {
  secondQuestionsBox.style.display = "none";
  firstQuestionsBox.style.display = "block";
});
backButton2.addEventListener("click", function () {
  thirdQuestionsBox.style.display = "none";
  secondQuestionsBox.style.display = "block";
});

backButton3.addEventListener("click", function () {
  fourthQuestionsBox.style.display = "none";
  thirdQuestionsBox.style.display = "block";
});

backButton4.addEventListener("click", function () {
  fifthQuestionsBox.style.display = "none";
  fourthQuestionsBox.style.display = "block";
})

button1.addEventListener("click", function () {
  firstQuestionsBox.style.display = "none";
  secondQuestionsBox.style.display = "block";
});

button2.addEventListener("click", function () {
  secondQuestionsBox.style.display = "none";
  thirdQuestionsBox.style.display = "block";
});
button3.addEventListener("click", function () {
  thirdQuestionsBox.style.display = "none";
  fourthQuestionsBox.style.display = "block";
});

button4.addEventListener("click", function () {
  fourthQuestionsBox.style.display = "none";
  fifthQuestionsBox.style.display = "block";
  submitButton.style.display = "block";
})

//breeds

const breeds = {
  cat: ["British Shorthair", "European Shorthair", "Ragdoll", "Maine", "Domestic", "Persian", "Mix/ Other"],
  dog: ["Labrador Retriever", "Labradoodle", "Golden Retriever", "Chihuahua", "Pomeranian", "French Bulldog", "Mix/Other"]
}

const petTypeSelect = document.getElementById("petType")
const breedSelect = document.getElementById("isBreed")

const updateBreeds = type => {
  breedSelect.innerHTML = ""

  if (!type) return

  breeds[type].forEach(breed => {
    const option = document.createElement("option")
    option.value = breed
    option.textContent = breed
    breedSelect.appendChild(option)
  })
}

// arrow boven function updateBreeds (type){
//   breedSelect.innerHTML = ""
//   if(!type) return breeds [type].forEach(function(breed) {

// })
// }

petTypeSelect.addEventListener("change", () => {
  updateBreeds(petTypeSelect.value)
})

updateBreeds(petTypeSelect.value)

//User age calculate
const userBirthDate = document.getElementById("userAge")

userBirthDate.addEventListener("input", function(){
  const selectedAge = new Date(userBirthDate.value)
  const age= calculateAge(selectedAge)
})


function calculateAge(userBirthDate) {
  const isToday = new Date()
  let age = isToday.getFullYear() - userBirthDate.getFullYear()

  const calculateMonth = isToday.getMonth() - userBirthDate.getMonth()

  if (calculateMonth < 0 ||
    (calculateMonth === 0 && isToday.getDate() < userBirthDate.getDate())
  ) {
    age--;
  }
  return age
}

form.addEventListener("submit", function (event) {

  const selectedDate = new Date(userBirthDate.value)
  const age = calculateAge(selectedDate)

  if(age<18){
   event.preventDefault()
   document.getElementById("ageError").textContent = "Pet Playdates is for users aged 18+ only."
  }
  console.log("Birth Date:", user.value)
  console.log("Calculated age:", age)

})