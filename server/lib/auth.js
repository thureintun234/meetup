const passport = require('passport')
const localStrategy = require('passport-local').Strategy
const UserModel = require('../models/UserModel')

passport.use(new localStrategy({ usernameField: 'email' }, async (username, userPassword, done) => {
  try {
    const user = await UserModel.findOne({ email: username }).exec()
    if (!user) {
      return done(null, false, { message: 'Invalid username or password' })
    }
    const password = await user.comparePassword(userPassword)
    if (!password) {
      return done(null, false, { message: 'Invalid username or password' })
    }
    return done(null, user)
  } catch (error) {
    return done(error)
  }
}))

passport.serializeUser((user, done) => {
  return done(null, user._id)
})

passport.deserializeUser(async (id, done) => {
  try {
    const user = await UserModel.findById(id).exec()
    return done(null, user)
  } catch (error) {
    return done(error)
  }
})

module.exports = {
  initialize: passport.initialize(),
  session: passport.session(),
  setUser: (req, res, next) => {
    res.locals.user = req.user
    return next()
  }
}