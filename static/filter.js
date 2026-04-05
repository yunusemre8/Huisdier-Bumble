
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
    });
});

document.querySelectorAll('.multi-chip').forEach(chip => {
    chip.addEventListener('click', () => {
        chip.classList.toggle('active');
    });
});

document.querySelectorAll('.single-chip').forEach(chip => {
    chip.addEventListener('click', () => {
        document.querySelectorAll('.single-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
    });
});


function getFilters() {
    const typeBtn = document.querySelector('.type-button.active');
    const sizeChip = document.querySelector('.single-chip.active');
    const activeBreeds = [...document.querySelectorAll('.multi-chip.active')]
        .map(c => c.textContent.trim());

    return {
        petType: typeBtn ? typeBtn.dataset.type : null,
        size: sizeChip ? sizeChip.textContent.trim().toLowerCase() : null,
        breeds: activeBreeds
    };
}

function renderResults(pets) {
    const results = document.querySelector('.cards');

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
}

document.getElementById('apply-button').addEventListener('click', async () => {
    const { petType, size, breeds } = getFilters();

    const params = new URLSearchParams();
    if (petType) params.append('petType', petType);
    if (size) params.append('size', size);
    if (breeds.length > 0) params.append('breeds', breeds.join(','));

    const response = await fetch(`/api/pets?${params}`);
    const pets = await response.json();

    renderResults(pets);
    document.getElementById('sidebar').classList.remove('open');
});

