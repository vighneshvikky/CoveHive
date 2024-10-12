const nodemailer = require('nodemailer');
const crypto = require('crypto');
const User = require('../../models/user/userSchema');
const bcrypt = require('bcrypt')


let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    service: 'Gmail',
    auth: {
        user:process.env.MY_EMAIL,
       pass:process.env.MY_PASSWORD
    }
});

exports.loadForgotPassword = async (req,res) => {
    try {
        res.render('user/forgetPassword')
    } catch (error) {
      console.log(error.message)  
    }
}

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).send('User with this email does not exist.');
        }

        // Generate a reset token
        const token = crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        // Save the user without validating the password
        await user.save({ validateBeforeSave: false });

        // Send email with reset link
        const resetUrl = `http://${req.headers.host}/reset-password/${token}`;
        const mailOptions = {
            to: user.email,
            from: 'your-email@gmail.com',
            subject: 'Password Reset',
            text: `Click the following link to reset your password: ${resetUrl}`
        };

        await transporter.sendMail(mailOptions);

        res.status(200).send('Password reset link sent to your email.');
    } catch (error) {
        console.log(error);
        res.status(500).send('Error sending reset link.');
    }
};


exports.getResetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() } // Token should not be expired
        });

        if (!user) {
            return res.status(400).send('Password reset token is invalid or has expired.');
        }

        res.render('user/resetPassword', { token }); // Render the reset password form
    } catch (error) {
        res.status(500).send('Error loading reset password page.');
    }
};

exports.postResetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password, confirmPassword } = req.body;

        if (password !== confirmPassword) {
            return res.status(400).send('Passwords do not match.');
        }

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).send('Password reset token is invalid or has expired.');
        }

        // Update password and clear reset token
        user.password = await bcrypt.hash(password, 10); // Use bcrypt to hash password
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        res.status(200).send('Password has been reset. You can now log in.');
    } catch (error) {
        console.log(error);
        res.status(500).send('Error resetting password.');
    }
};