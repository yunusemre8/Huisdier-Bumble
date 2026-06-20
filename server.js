const express = require("express");
const session = require("express-session");
const dotenv = require("dotenv");
const { MongoClient } = require("mongodb");

// Middleware ve Routes
const userValidate = require('./middleware/userValidate');
const messageMiddleware = require('./middleware/message');
const authRoutes = require('./routes/authRoutes');
const passwordRoutes = require('./routes/passwordRoutes');
const homeRoutes = require('./routes/homeRoutes');
const profileRoutes = require("./routes/profileRoutes");

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

// Temel Ayarlar
app.set("view engine", "ejs");
app.set("views", "views");
app.use(express.static("static"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session Ayarları
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
);

// Veritabanı ve Middleware
let db;
app.use((req, res, next) => {
  req.db = db;
  next();
});

// Route'lar
app.use('/', homeRoutes);
app.use('/', authRoutes);
app.use('/', passwordRoutes);
app.use('/', profileRoutes);
app.use(messageMiddleware);

// Server ve DB Bağlantısı
async function startServer() {
  try {
    const client = new MongoClient(process.env.MONGO_URI || "mongodb://localhost:27017/huisdier-bumble");
    await client.connect();
    
    db = client.db(process.env.DB_NAME || "huisdier-bumble");
    console.log("Database connected successfully 🐾");

    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error("DB connection error:", error.message);
    process.exit(1);
  }
}

startServer();