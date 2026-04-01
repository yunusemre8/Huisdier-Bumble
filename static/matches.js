// bron: https://www.w3schools.com/html/html5_geolocation.asp & 
const id = document.body.dataset.userId;
const locationButton = document.getElementById("locationButton");
const isLocation = document.getElementById("isLocation");

locationButton.addEventListener("click", getLocation);

function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(showPosition, showError);
  } else {
    isLocation.textContent = "Geolocation is not supported by this browser.";
  }
}

async function showPosition(position) {
  const lat = position.coords.latitude;
  const lng = position.coords.longitude;

  isLocation.innerHTML = `Latitude: ${lat}<br>Longitude: ${lng}`;

  try {
    const response = await fetch("/save-location", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ id, lat, lng })
    });

    const data = await response.json();

    if (data.success) {
      isLocation.innerHTML += "<br>Location saved in MongoDB.";
    } else {
      isLocation.innerHTML += `<br>${data.message}`;
    }
  } catch (error) {
    console.error(error);
    isLocation.innerHTML += "<br>Could not save location.";
  }
}

function showError() {
  alert("No position available.");
}