document.getElementById('open-btn').addEventListener('click', () => {
    document.getElementById('sidebar').classList.add('open');
  });
  
  document.getElementById('close-btn').addEventListener('click', () => {
    document.getElementById('sidebar').classList.remove('open');
  });