const { MongoClient} = require("mongodb")
let db

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

function getDb(){
    return db
}

module.exports={
    connectMongo, getDb
}
