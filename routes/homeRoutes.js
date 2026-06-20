const express = require('express')
const router = express.Router()

router.get('/', (req,res) => {
  if(req.session.userId) {
    return res.redirect(`/profile/${req.session.userId}`)
  }
  res.render('home')
})

module.exports = router