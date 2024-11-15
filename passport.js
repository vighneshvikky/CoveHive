const passport = require('passport');
//const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy
require('dotenv').config();
const User = require('./models/user/userSchema')


passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID, // Replace with your Google Client ID
  clientSecret: process.env.GOOGLE_CLIENT_SECRET, // Replace with your Google Client Secret
  callbackURL: process.env.GOOGLE_CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Find or create user in the database
    let user = await User.findOne({ googleId: profile.id });
    if (!user) {
      user = await User.create({
        googleId: profile.id,
        fullName: profile.displayName,
        email: profile._json.email,
        is_varified: 1 // Set as verified when created through Google
      });
    }
    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

// Serialize and deserialize user to manage sessions
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

