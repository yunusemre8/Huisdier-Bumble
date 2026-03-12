const zeroQuestionsBox = document.querySelector(".zeroQuestionsBox");
const firstQuestionsBox = document.querySelector(".firstQuestionsBox");
const secondQuestionsBox = document.querySelector(".secondQuestionsBox");
const thirdQuestionsBox = document.querySelector(".thirdQuestionsBox");
const fourthQuestionsBox = document.querySelector(".fourthQuestionsBox");
const submitButton = document.querySelector('input[type="submit"]');

const button1 = document.getElementById("button1");
const button2 = document.getElementById("button2");
const button3 = document.getElementById("button3");
const button4 = document.getElementById("button4");

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
  submitButton.style.display = "block";
});