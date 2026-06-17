const express = require('express')

const { connectMongo } = require('./database')

const app = express()
const port = 3000

const session = require('express-session')
const userValidate = require('./middleware/userValidate')
const messageMiddleware = require('./middleware/message')
const authRoutes = require('./routes/authRoutes')
const passwordRoutes = require('./routes/passwordRoutes')

require('dotenv').config()

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
app.use(messageMiddleware)

app.use('/', authRoutes)
app.use('/', passwordRoutes)

app.set('view engine', 'ejs')

app.get('/', home)


function home(req, res) {
  res.render('home')
}


//database
async function startServer() {
  await connectMongo()

  app.listen(port, () => {
    console.log('Server running')
  })
}

startServer()