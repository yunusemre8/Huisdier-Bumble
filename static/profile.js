const hint = document.getElementById('swipeHint');
if (hint) {
    hint.addEventListener('click', () => {
        hint.style.transition = 'opacity 0.3s';
        hint.style.opacity = '0';
        hint.style.pointerEvents = 'none';
    });
}

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



document.getElementById('settingsBtn').addEventListener('click', () => {
    document.getElementById('settingsMenu').classList.toggle('open');
});

document.getElementById('deleteAccountBtn').addEventListener('click', async () => {
    const bevestig = confirm('Weet je zeker dat je je account wilt verwijderen?')
    if (!bevestig) return

    const userId = window.location.pathname.split('/').pop()

    await fetch(`/delete-account/${userId}`, { method: 'POST' })
    window.location.href = '/register'
})