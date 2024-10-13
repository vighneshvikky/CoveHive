const dotenv = require('dotenv');
const User = require('../../models/user/userSchema');

dotenv.config();

exports.loadUserProfile = async (req,res) => {
    try {
        const user = await User.findById(req.session.user_id).populate('orders');
        res.render('user/userProfile',{user});

    } catch (error) {
        console.log(error.message);
    }
}

exports.editProfile = async (req,res) => {
    try {
        const {fullName,phone} = req.body;
         await User.findByIdAndUpdate(req.session.user_id,{fullName,phone});
         res.redirect('/profile');
    } catch (error) {
      console.log(error.message)  
    }
}

exports.loadAddress = async (req,res) => {
    const user = await User.findById(req.session.user_id)
    try {
        res.render('user/userAddress',{user})
    } catch (error) {
       console.log(error.message) 
    }
}

exports.loadAddAddress = async (req,res) => {
    try {
        const user = await User.findById(req.session.user_id)
        res.render('user/addAddress',{user})
    } catch (error) {
       console.log(error.message) 
    }
}

exports.postAddAddress = async (req,res) => {
    try {
        const { fullName,street, city, pincode, state, country } = req.body;
        const user = await User.findById(req.session.user_id);
        const newAddress = {
            fullName,
            street,
            city,
            pincode,
            state,
            country
        };
        user.addresses.push(newAddress)
        await user.save();
        console.log(`user is ${user}`);
        res.redirect('/user-address')    
    } catch (error) {
       console.log(error.message) 
    }
}


exports.editAddress = async (req,res) => { 
    const addressId = req.params.id
    const user = await User.findById(req.session.user_id);
    const address =  user.addresses.id(addressId)
    console.log(`user is ${user}`)
    try {
        res.render('user/editAddress',{address,user})

    } catch (error) {
       console.log(error.message) 
    }
}

exports.postEditAddress =  async (req,res) => {
    try {
       const addressId = req.params.id;
       const user  = await User.findById(req.session.user_id);
       const address = user.addresses.id(addressId);

       address.fullName = req.body.fullName;
       address.street = req.body.street;
       address.city = req.body.city;
       address.pincode = req.body.pincode;
       address.state = req.body.state;
       address.country = req.body.country;

       await user.save();

    res.redirect('/user-address')
    } catch (error) {
       console.log(error.message) 
    }
}

exports.loadOrders = async (req,res) => {
    try {
        const user = await User.findById(req.session.user_id).populate('orders')
        res.render('user/userOrder',{user})
    } catch (error) {
        console.log(error.message)
    }
}