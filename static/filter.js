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
        document.querySelectorAll('.single-chip').forEach(chip => chip.classList.remove('active'));
        chip.classList.add('active');
    });
});