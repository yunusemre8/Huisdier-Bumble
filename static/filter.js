// document.getElementById('open-button').addEventListener('click', () => {
//     document.getElementById('sidebar').classList.add('open');
//   });
  
//   document.getElementById('close-button').addEventListener('click', () => {
//     document.getElementById('sidebar').classList.remove('open');
//   });

// document.querySelectorAll('.type-button').forEach(button => {
//     button.addEventListener('click', () => {
//         document.querySelectorAll('.type-button').forEach(btn => btn.classList.remove('active'));
//         button.classList.add('active');
//     });
// });

// document.querySelectorAll('.multi-chip').forEach(chip => {
//     chip.addEventListener('click', () => {
//         chip.classList.toggle('active'); 
//     });
// });

// document.querySelectorAll('.single-chip').forEach(chip => {
//     chip.addEventListener('click', () => {
//         document.querySelectorAll('.single-chip').forEach(chip => chip.classList.remove('active'));
//         chip.classList.add('active');
//     });
// });

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

// --- YENI EKLENENLER ---

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
    const results = document.getElementById('results');

    if (pets.length === 0) {
        results.innerHTML = '<p>No pets found.</p>';
        return;
    }

    results.innerHTML = pets.map(pet => `
        <div class="card">
            <img src="/upload/${pet.cover}" alt="${pet.petName}">
            <h3>${pet.petName}</h3>
            <p>${pet.petBreed}</p>
            <p>${pet.petWeight} kg</p>
        </div>
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

// Sayfa açılınca tüm hayvanları getir
fetch('/api/pets')
    .then(r => r.json())
    .then(renderResults);