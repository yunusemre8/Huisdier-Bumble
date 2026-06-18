const express = require('express')
const router = express.Router()

router.get('/', home)

function home(req, res) {
  res.render('home')
}

module.exports = router