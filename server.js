const express = require('express');
const app = express();

const dogBreeds = ['Labrador', 'Golden Retriever', 'Poodle', 'Border Collie', 'Beagle', 'French Bulldog'];
const catBreeds = ['Persian', 'Maine Coon', 'Siamese', 'Ragdoll', 'Bengal', 'Scottish Fold'];

app.get('/', (req, res) => {
  res.render('filter', {
    isPageTitle: 'Huisdier Bumble',
    dogBreeds,
    catBreeds
  });
});

app.get('/filter', (req, res) => {
  const filters = req.query;
  console.log(filters);

  res.render('filter', {
    isPageTitle: 'Huisdier Bumble',
    dogBreeds,
    catBreeds,
    filters
  });
});

app.set('view engine', 'ejs');
app.set('views', './views');
app.use(express.static('static'));


app.get('/', (req, res) => {
  res.render('filter', {
    isPageTitle: 'Huisdier Bumble'
  });
});

app.get('/filter', (req, res) => {
  const filters = req.query; // { petType: 'dog', ... }
  console.log(filters);

  res.render('filter', {
    isPageTitle: 'Huisdier Bumble',
    filters
  });
});

app.listen(3000, () => console.log('Running on http://localhost:3000'));