const express = require('express')
const { MongoClient } = require("mongodb")
const app = express()
const port = 3000

const session = require('express-session')
const userValidate = require('./middleware/userValidate')
const messageMiddleware = require('./middleware/message')
const authRoutes = require('./routes/authRoutes')
const passwordRoutes = require('./routes/passwordRoutes')
const homeRoutes = require('./routes/homeRoutes')

require('dotenv').config()

let db

app.use(express.static('static'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 2,
    },
  })
)

app.use((req, res, next) => {
    req.db = db
    next()
}) 

app.use('/', homeRoutes)
app.use('/', authRoutes)
app.use('/', passwordRoutes)

app.use(messageMiddleware)
app.set('view engine', 'ejs')


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


async function startServer() {
  await connectMongo()

  app.listen(port, () => {
    console.log('Server running')
  })
}

startServer()