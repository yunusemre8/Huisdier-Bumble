const express = require('express');
const app = express();
const session = require('express-session')
const dotenv = require("dotenv");
const multer = require("multer");
const { MongoClient, ObjectId } = require("mongodb");
const ejs = require('ejs')
dotenv.config();

// const router = express.Router();

const port = process.env.PORT || 3000;


const dogBreeds = ['Labrador', 'Golden Retriever', 'Poodle', 'Border Collie', 'Beagle', 'French Bulldog'];
const catBreeds = ['Persian', 'Maine Coon', 'Siamese', 'Ragdoll', 'Bengal', 'Scottish Fold'];

app.use(express.static('static'))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

app.set('view engine', 'ejs');
app.set('views', './views');



async function connectMongo() {
  try {
      const client = new MongoClient(process.env.MONGO_URI);
      await client.connect();

      db = client.db(process.env.DB_NAME);

      await db.collection("users").createIndex({ location: "2dsphere" });

      console.log("Database is connected");
  } catch (error) {
      console.error("DB couldn't be connected", error.message);
      process.exit(1);
  }
}

app.get('/', (req, res)=>{
  res.send("Root pagina")
})

app.get('/filter', (req, res) => {
  res.render('filter', {
    isPageTitle: 'Huisdier Bumble',
    dogBreeds,
    catBreeds
  });
});


app.get('/register', (req, res) => {
  res.render('register');
});

app.get('/login', (req, res) => {
  res.render('login');
});

async function startServer() {
  await connectMongo();

  app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
  });
}

startServer();
