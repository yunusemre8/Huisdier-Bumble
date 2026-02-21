require('dotenv').config()

const express = require("express")
const app = express(); 
app.use(express.urlencoded({extended: true}))
const { MongoClient, ServerApiVersion } = require("mongodb")

// MongoDB setup
const uri = process.env.URI
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

let db

// Connectie functie
async function connectDB() {
    try {
        await client.connect()
        db = client.db("users") 
        console.log("✅ Connected to MongoDB!")
    } catch (error) {
        console.error("❌ MongoDB connection error:", error)
        process.exit(1)
    }
}

async function loginPost(req, res) {
  const postData = req.body; 

  try {
      const logUser = await db.collection("users").insertOne(postData);
      
      console.log("User saved with ID:", logUser.insertedId);
      res.send("User is saved!");
  } catch (error) {
      console.log("Error saving:", error);
  }
}

// Middleware
app.use(express.static('public'))
app.use(express.json())

app.set("view engine", "ejs")

// Routes
app.get('/', home)
app.get('/login', login)
app.post('/login', loginPost) 

// Route handlers
function home(req, res) {
  res.send('Hello Friend')
}

function login(req, res) {
  res.render('login')
}


// 404 fallback
app.use((req, res) => {
  res.status(404).send('404 - Not Found Error')
})

// Start server NA database connectie
connectDB().then(() => {
  app.listen(4000, () => {
      console.log("Server running on http://localhost:4000")
  })
})
