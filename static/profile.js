document.getElementById('locationBtn').addEventListener('click', () => {
    if (!navigator.geolocation) {
        alert('Geolocatie wordt niet ondersteund.');
        return;
    }

    navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;

        const userId = window.location.pathname.split('/').pop();

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