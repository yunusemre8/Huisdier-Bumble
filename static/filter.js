const breeds = {
    dog: ['Labrador Retriever', 'Labradoodle', 'Golden Retriever', 'Chihuahua', 'Pomeranian', 'French Bulldog', 'Mix/Other'],
    cat: ['British Shorthair', 'European Shorthair', 'Ragdoll', 'Maine', 'Domestic', 'Persian', 'Mix/Other']
}

function updateBreedChips(type) {
    const chipGroup = document.getElementById('breed-chips');
    chipGroup.innerHTML = '';
    if (!type || !breeds[type]) return;
    breeds[type].forEach(breed => {
        const btn = document.createElement('button');
        btn.className = 'multi-chip';
        btn.textContent = breed;
        btn.addEventListener('click', () => btn.classList.toggle('active'));
        chipGroup.appendChild(btn);
    });
}

document.getElementById('open-button').addEventListener('click', () => {
    document.getElementById('sidebar').classList.add('open');
});

document.getElementById('close-button').addEventListener('click', () => {
    document.getElementById('sidebar').classList.remove('open');
});

document.querySelectorAll('.type-button').forEach(button => {
    button.addEventListener('click', () => {
        document.querySelectorAll('.type-button').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        updateBreedChips(button.dataset.type);
    });
});

document.querySelectorAll('.single-chip').forEach(chip => {
    chip.addEventListener('click', () => {
        if (chip.classList.contains('active')) {
            chip.classList.remove('active');
        } else {
            document.querySelectorAll('.single-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
        }
    });
});

document.querySelectorAll('.frequency-chip').forEach(chip => {
    chip.addEventListener('click', () => {
        if (chip.classList.contains('active')) {
            chip.classList.remove('active');
        } else {
            document.querySelectorAll('.frequency-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
        }
    });
});

document.querySelectorAll('.place-chip').forEach(chip => {
    chip.addEventListener('click', () => {
        if (chip.classList.contains('active')) {
            chip.classList.remove('active');
        } else {
            document.querySelectorAll('.place-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
        }
    });
});

function getFilters() {
    const typeBtn = document.querySelector('.type-button.active');
    const sizeChip = document.querySelector('.single-chip.active');
    const frequencyChip = document.querySelector('.frequency-chip.active');
    const placeChip = document.querySelector('.place-chip.active');
    const cityInput = document.getElementById('city-input');
    const activeBreeds = [...document.querySelectorAll('.multi-chip.active')]
        .map(c => c.textContent.trim());

    return {
        petType: typeBtn ? typeBtn.dataset.type : null,
        size: sizeChip ? sizeChip.dataset.size : null,
        frequency: frequencyChip ? frequencyChip.dataset.frequency : null,
        place: placeChip ? placeChip.dataset.place : null,
        city: cityInput ? cityInput.value.trim() : null,
        breeds: activeBreeds
    };
}

function renderResults(pets) {
    const results = document.getElementById('results');

    if (pets.length === 0) {
        results.innerHTML = '<p>No pets found.</p>';
        return;
    }

    results.innerHTML = pets.map(pet => `
        <article class="card" data-owner-id="${pet._id}">
            <div class="card-inner">
                <div class="card-front">
                    <img class="matchingimages" src="/upload/${pet.cover}" alt="${pet.petName || 'Animal'}">
                    <button class="dislikebtn" type="button">
                        <img src="/images/trashcan.png" alt="Delete button">
                    </button>
                    <button class="likebtn" type="button">
                        <img src="/images/yellowheart.png" alt="Heart button">
                    </button>
                </div>
                <div class="card-back">
                    <h2>${pet.petName || 'Naam onbekend'}</h2>
                    <p><strong>Soort:</strong> ${pet.petType || 'Onbekend'}</p>
                    <p><strong>Ras:</strong> ${pet.petBreed || 'Onbekend'}</p>
                    <p><strong>Gewicht:</strong> ${pet.petWeight || 'Onbekend'}</p>
                </div>
            </div>
        </article>
    `).join('');

    if (window.updateStack) window.updateStack();
    if (window.activateTopCard) window.activateTopCard();
}

document.getElementById('apply-button').addEventListener('click', async () => {
    const { petType, size, breeds, frequency, place, city } = getFilters();

    const params = new URLSearchParams();
    if (petType) params.append('petType', petType);
    if (size) params.append('size', size);
    if (breeds.length > 0) params.append('breeds', breeds.join(','));
    if (frequency) params.append('frequency', frequency);
    if (place) params.append('place', place);
    if (city) params.append('city', city);

    const response = await fetch(`/api/pets?${params}`);
    const pets = await response.json();

    renderResults(pets);
    document.getElementById('sidebar').classList.remove('open');
});

document.getElementById('reset-button').addEventListener('click', () => {
    document.querySelectorAll('.type-button, .single-chip, .multi-chip, .frequency-chip, .place-chip')
        .forEach(c => c.classList.remove('active'));
    document.getElementById('breed-chips').innerHTML = '';
    document.getElementById('city-input').value = '';
});