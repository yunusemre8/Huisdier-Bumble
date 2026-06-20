const express = require('express')
const { MongoClient } = require("mongodb")
const session = require('express-session')

const userValidate = require('./middleware/userValidate')
const messageMiddleware = require('./middleware/message')
const authRoutes = require('./routes/authRoutes')
const passwordRoutes = require('./routes/passwordRoutes')
const homeRoutes = require('./routes/homeRoutes')
const profileRoutes = require("./routes/profileRoutes");

require('dotenv').config()

const app = express()
const port = process.env.PORT || 3000;

let db


app.use(express.static("static"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET || "default_secret_key",
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

app.use(messageMiddleware)
app.set('view engine', 'ejs')

app.use('/', homeRoutes)
app.use('/', authRoutes)
app.use('/', passwordRoutes)
app.use("/", profileRoutes);


async function startServer() {
  try {
    const client = new MongoClient(process.env.MONGO_URI)
    await client.connect()

    db = client.db(process.env.DB_NAME)

    console.log("Database is connected")

    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`)
    })
  } catch (error) {
    console.error("DB couldn't be connected", error.message)
    process.exit(1)
  }
}

startServer()