const express = require("express");
const multer = require("multer");
const { ObjectId } = require("mongodb");
const bcrypt = require("bcrypt");

const router = express.Router();
const upload = multer({ dest: "static/upload/" });

const dogBreeds = ["Labrador", "Golden Retriever", "Poodle", "Border Collie", "Beagle", "French Bulldog"];
const catBreeds = ["Persian", "Maine Coon", "Siamese", "Ragdoll", "Bengal", "Scottish Fold"];

const userValidate = (req, res, next) => {
  if (!req.session) req.session = {};
  next();
};

router.get("/matchesPage/:id", userValidate, async (req, res) => {
  try {
    const user = await req.db.collection("users").findOne({ _id: new ObjectId(req.params.id) });
    const animals = await req.db.collection("animals").find({}).toArray();
    
    res.render("matchesPage", { 
      user: user || { _id: req.params.id, userName: "Test" }, 
      animals: animals 
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Matches page couldn't load.");
  }
});

router.get("/api/pets", async (req, res) => {
  try {
    const { petType, breeds, size, frequency, place, city } = req.query;
    let query = {};

    if (petType) query.petType = petType;
    
    if (breeds) {
      const breedArray = breeds.split(",");
      query.petBreed = { $in: breedArray };
    }

    if (city) {
      const usersInCity = await req.db.collection("users")
        .find({ userCity: { $regex: city, $options: "i" } })
        .toArray();
      
      const userIds = [];
      usersInCity.forEach(user => {
        userIds.push(user._id);
        userIds.push(user._id.toString());
      });
      
      query.ownerId = { $in: userIds };
    }

    const pets = await req.db.collection("animals").find(query).toArray();
    res.json(pets);
  } catch (error) {
    console.error("Filter error:", error);
    res.status(500).json({ error: "An error occurred while filtering." });
  }
});

router.get("/profile/:id", userValidate, async (req, res) => {
  try {
    const userId = new ObjectId(req.params.id);
    const user = await req.db.collection("users").findOne({ _id: userId });
    
    const animals = await req.db.collection("animals").find({ ownerId: userId }).toArray();
    
    res.render("profile", { user: user, animals: animals });

  } catch (error) {
    console.error("Profile loading error:", error);
    res.status(500).send("An error occurred while loading the profile.");
  }
});

router.get("/select-pet-edit/:id", userValidate, async (req, res) => {
  try {
    const userId = new ObjectId(req.params.id);
    const user = await req.db.collection("users").findOne({ _id: userId });
    const animals = await req.db.collection("animals").find({ ownerId: userId }).toArray();
    
    res.render("select-pet", { user, animals });
  } catch (error) {
    console.error(error);
    res.status(500).send("Animal selecting page couldn't load.");
  }
});

router.get("/edit-profile/:userId/:petId", userValidate, async (req, res) => {
  try {
    const user = await req.db.collection("users").findOne({ _id: new ObjectId(req.params.userId) });
    const animal = await req.db.collection("animals").findOne({ _id: new ObjectId(req.params.petId) });
    
    res.render("edit-profile", { user, animal });
  } catch (error) {
    console.error(error);
    res.status(500).send("Edit profile page couldn't load.");
  }
});

router.post("/edit-profile/:userId/:petId", upload.single("cover"), async (req, res) => {
  try {
    const userId = new ObjectId(req.params.userId);
    const petId = new ObjectId(req.params.petId);
    
    const { userName, userCity, userPhone, isFrequency, preferPlace, petName, petType, isBreed, isKilo } = req.body;

    await req.db.collection("users").updateOne(
      { _id: userId },
      { $set: { userName, userCity, userPhone, isFrequency, preferPlace } }
    );

    const petData = { petName, petType, petBreed: isBreed, petWeight: isKilo };
    if (req.file) {
      petData.cover = req.file.filename;
    }

    await req.db.collection("animals").updateOne(
      { _id: petId },
      { $set: petData }
    );

    res.redirect(`/profile/${userId}`);
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while updating the profile.");
  }
});

router.get("/add-pet/:id", userValidate, (req, res) => {
  res.render("add-pet", { userId: req.params.id });
});

router.post("/add-pet/:id", upload.single("cover"), async (req, res) => {
  try {
    const userId = new ObjectId(req.params.id);
    const { petName, petType, isBreed, isKilo } = req.body;

    const newPet = {
      petName,
      petType,
      petBreed: isBreed,
      petWeight: isKilo,
      cover: req.file ? req.file.filename : "default.png",
      ownerId: userId
    };

    await req.db.collection("animals").insertOne(newPet);
    res.redirect(`/profile/${req.params.id}`);
  } catch (error) {
    res.status(500).send("An error occurred while adding the pet.");
  }
});

router.post("/delete-pet/:userId/:petId", async (req, res) => {
  try {
    const userId = new ObjectId(req.params.userId);
    const petId = new ObjectId(req.params.petId);

    await req.db.collection("animals").deleteOne({ 
      _id: petId, 
      ownerId: userId 
    });

    res.redirect(`/profile/${req.params.userId}`);
  } catch (error) {
    console.error("Error while deleting pet:", error);
    res.status(500).send("An error occurred while deleting the pet.");
  }
});

router.post("/save-location", async (req, res) => {
  try {
    const { id, lat, lng } = req.body;
    await req.db.collection("users").updateOne(
      { _id: new ObjectId(id) },
      { $set: { location: { lat, lng } } }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;