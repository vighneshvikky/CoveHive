const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const dotenv = require('dotenv');
const adminRoutes = require('./routes/admin/adminRoutes')
const userRoutes = require('./routes/user/userRoutes')  
const nocache = require('nocache');
const flash = require('connect-flash')
const passport = require('passport');
require('./passport');

dotenv.config()
const app = express();
const multer = require('multer');
const path = require('path');

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: false 
  }
}));

app.use(flash())  
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static('uploads'));


app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  next();
});
// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('MongoDB connected'))
.catch((err) => console.error('MongoDB connection error:', err));

// Set up session management
//app.use(nocache());



//intializing passport
app.use(passport.initialize());
app.use(passport.session());

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/uploads', express.static('uploads'));  

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
// Admin routes
app.use('/admin',adminRoutes);
// User routes
app.use('/',userRoutes);


// Start server
const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Server running on port http://localhost:${PORT}`));

