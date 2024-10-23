const dotenv = require('dotenv');
const User = require('../../models/user/userSchema');
const Address = require('../../models/addressSchema')

dotenv.config();

exports.loadUserProfile = async (req,res) => {
    try {
        const user = await User.findById(req.session.user_id).populate('orders');
        res.render('user/userProfile',{user,currentRoute:'/home'});

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

exports.loadAddAddress = async (req,res) => {
    try {
        req.session.source = null
        const user = await User.findById(req.session.user_id)
        res.render('user/addAddress',{user,currentRoute:'/home'})
    } catch (error) {
       console.log(error.message) 
    }
}

exports.loadAddress = async (req,res) => {
    const user = await User.findById(req.session.user_id).populate('addresses')
    try {
        const addresses = user.addresses || [];
        console.log(`addresses = ${addresses}`)
        res.render('user/userAddress',{user,currentRoute:'/home',addresses})
        
    } catch (error) {
       console.log(error.message) 
    }
}


// exports.postAddAddress = async (req,res) => {
//     try {
//         const { fullName,street, city, pincode, state, country } = req.body;
//         const user = await User.findById(req.session.user_id);
//         const newAddress = {
//             fullName,
//             street,
//             city,
//             pincode,
//             state,
//             country
//         };
//         user.addresses.push(newAddress)
//         await user.save();
//         console.log(`user is ${user}`);
//         res.redirect('/user-address')    
//     } catch (error) {
//        console.log(error.message) 
//     }
// }
exports.postAddAddress = async (req,res) => {
    try {
        const userId = req.session.user_id;
        if(!userId)return res.redirect('/login');

        const {fullName,street,city,pincode,state,country,isDefault} = req.body;

        const newAddress = new Address({
            fullName,
            street,
            city,
            state,
            country,
            pincode,
            isDefault:isDefault||false
        });
        const savedAddress = await newAddress.save();
      console.log(`savedAddress = ${savedAddress}`)
        const user = await User.findById(req.session.user_id);
        if(!user) {
            return res.status(404).send('User not found')
        }
        console.log(`user = ${user}`)
           // If the new address is marked as default, update the previous default address to false
        if(isDefault){
            await Address.updateMany({_id:{$in :user.addresses},isDefault:true},{$set:{isDefault:false}});
        }
        user.addresses.push(savedAddress._id);
        // user.addresses.push(savedAddress._id)

        await user.save();
        if(req.session.source =='checkout'){
           res.redirect('/checkout')
        }else{
            res.redirect('/user-address')
        }
       
    } catch (error) {
       console.log(error.message) 
    }
}
exports.editAddress = async (req, res) => {
    try {
        const addressId = req.params.id;
        const user = await User.findById(req.session.user_id).populate('addresses');
        
        // Find the specific address in the addresses array
        const address = user.addresses.find(addr => addr._id.toString() === addressId);
        
        if (!address) {
            return res.status(404).send('Address not found');
        }

        // Render the edit address form, passing the address and user details
        res.render('user/editAddress', { address, user, currentRoute: '/home' });
        
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Server Error');
    }
};

 // Ensure you have imported the Address model

 exports.postEditAddress = async (req, res) => {
    try {
        const addressId = req.params.id; // Get the address ID from the request params
        const userId = req.session.user_id; // Get the user ID from the session

        // Find the address by ID and ensure it belongs to the current user
        const address = await Address.findOne({ _id: addressId });

        if (!address) {
            return res.status(404).send('Address not found or does not belong to the user');
        }

        // Update the address fields
        address.fullName = req.body.fullName;
        address.street = req.body.street;
        address.city = req.body.city;
        address.pincode = req.body.pincode;
        address.state = req.body.state;
        address.country = req.body.country;

        // Check if the address is marked as default
        const isDefault = req.body.isDefault === 'on'; // Assuming 'on' is sent from a checkbox

        if (isDefault) {
            // If this address is marked as default, update all other addresses' isDefault to false
            await Address.updateMany({ user: userId, _id: { $ne: addressId } }, { isDefault: false });
        }

        address.isDefault = isDefault; // Set the default status of the current address

        // Save the updated address
        await address.save();

        // Redirect to the user addresses page
        res.redirect('/user-address');
    } catch (error) {
        console.log(error.message);
        res.status(500).send('Server Error');
    }
};



exports.loadOrders = async (req,res) => {
    try {
        const user = await User.findById(req.session.user_id).populate('orders')
        res.render('user/userOrder',{user,currentRoute:'/home'})
    } catch (error) {
        console.log(error.message)
    }
}

exports.removeAddress = async (req,res) => {
    const addressId = req.params.id; // Get the address ID from the request parameters
    const user = await User.findById(req.session.user_id); // Find the user by session ID
    
    if (!user) {
        return res.status(404).send('User not found');
    }
    
    // Find the index of the address by its ID
    const addressIndex = user.addresses.findIndex(address => address._id.toString() === addressId);
    
    if (addressIndex === -1) {
        return res.status(404).send('Address not found');
    }
    
    // Remove the address from the addresses array
    user.addresses.splice(addressIndex, 1);
    
    // Save the user and handle any errors
    try {
        await user.save();
        res.redirect('/user-address'); // Redirect after successful deletion
    }

    catch (error) {
      console.log(error.message)  
    }
}

