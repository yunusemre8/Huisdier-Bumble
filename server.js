const express = require('express')
const multer = require('multer')
const bcrypt = require('bcrypt')
const { MongoClient, ObjectId } = require("mongodb");

const upload = multer({ dest: 'static/upload/' })
const app = express()
const port = 3000

let db
require('dotenv').config()

app.use(express.static('static'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.set('view engine','ejs')

async function connectMongo() {
  try {
    const client = new MongoClient(process.env.MONGO_URI)
    await client.connect()

    db = client.db(process.env.DB_NAME)

    console.log("Database is connected")
  } catch (error) {
    console.error("DB couldn't be connected", error.message)
    process.exit(1)
  }
}

app.get('/register', register)

app.post("/register", upload.single("cover"), async(req, res) => {
  const existingUser = await db.collection('users').findOne({
    userEmail: req.body.userEmail
  })
  if (existingUser) {
    return res.send('Email already registered')
  }

  if (req.body.isPassword !== req.body.checkPassword) {
    return res.status(400).send("Passwords do not match");
  }

  //age warning
  const userBirthDate = new Date(req.body.userAge)
  const age = calculateAge(userBirthDate)

  if (age < 18) {
    return res.status(400).send('Pet Playdates is for users aged 18+ only.');
  }

  const passwordHash = await createPasswordHash(req.body.isPassword)
  const newUser = {
    userName: req.body.userName,
    userBirthDate: userBirthDate,
    userAge: age,
    userCity: req.body.userCity,
    userEmail: req.body.userEmail,
    passwordHash: passwordHash,
    userPhone: req.body.userPhone || null,
    preferContact: req.body.preferContact,
    isFrequency: req.body.isFrequency,
    preferPlace: req.body.preferPlace,
    createdAt: new Date(),
    location: null,
  }

  const userResult = await db.collection('users').insertOne(newUser)
  const userId = userResult.insertedId

  const newAnimal = {
    ownerId: userId,
    petName: req.body.petName,
    petType: req.body.petType,
    petBreed: req.body.isBreed,
    petWeight: Number(req.body.isKilo),
    petBirthYear: Number(req.body.petBirthYear),
    petBirthMonth: Number(req.body.petBirthMonth),
    isVaccinated: req.body.isVaccinated,
    isCastrated: req.body.isCastrated,
    cover: req.file ? req.file.filename : null,
    createdAt: new Date(),
  }
  await db.collection('animals').insertOne(newAnimal)

  res.redirect(`/profile/${userId}`)

});


function register(req, res) {
  res.render("register");
}

// password hash
async function createPasswordHash(password) {
  const salt = await bcrypt.genSalt(10)
  return await bcrypt.hash(password, salt)
}
//age control
function calculateAge(userBirthDate) {
  const today = new Date()
  let age = today.getFullYear - userBirthDate.getFullYear()

  const monthDifference = today.getDate() < userBirthDate.getDate()

  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < userBirthDate.getDate())
  ) {
    age--
  }
  return age
}

//database
async function startServer() {
  await connectMongo()

  app.listen(port, () => {
    console.log('Server running')
  })
}

startServer()





