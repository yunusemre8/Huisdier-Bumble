const express = require("express");
const session = require("express-session");
const dotenv = require("dotenv");
const { MongoClient } = require("mongodb");

// const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profileRoutes");

dotenv.config(); 
const app = express();
const port = process.env.PORT || 3000;

app.use(express.static("static"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET || "default_secret_key",
    resave: false,
    saveUninitialized: false,
  })
);

app.set("view engine", "ejs");
app.set("views", "views");

let db;

app.use((req, res, next) => {
  req.db = db;
  next();
});

// app.use("/", authRoutes);
app.use("/", profileRoutes);

async function startServer() {
  try {
    const uri = process.env.MONGO_URI || "mongodb://localhost:27017/huisdier-bumble";
    const client = new MongoClient(uri);
    
    await client.connect();
    db = client.db(); 
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
