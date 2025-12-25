const nodemailer = require('nodemailer');
const crypto = require('crypto');
const User = require('../../models/user/userSchema');
const bcrypt = require('bcryptjs');
const { error } = require('console');
const { PerformanceObserverEntryList } = require('perf_hooks');
const { HttpStatus } = require('../../enums/app.enums');


let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    service: 'Gmail',
    auth: {
        user: process.env.MY_EMAIL,
        pass: process.env.MY_PASSWORD
    }
});

exports.loadForgotPassword = async (req, res) => {
    try {
        const user = await User.findById(req.session.user_id)
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
            res.render('user/forgetPassword', { message: 'User with this email does not exist.' });
        
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

        res.render('user/forgetPassword', { message: "Password reset link sent to your email." })
       

    } catch (error) {

        console.log(error);
       
        res.render('user/forgetPassword', { message: 'Error sending reset link.' })
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
            return res.status(HttpStatus.BAD_REQUEST).send('Password reset token is invalid or has expired.');
        }

        res.render('user/resetPassword', { token }); // Render the reset password form
    } catch (error) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).send('Error loading reset password page.');
    }
};

exports.postResetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password, confirmPassword } = req.body;

        if (password !== confirmPassword) {
            return res.status(HttpStatus.BAD_REQUEST).send('Passwords do not match.');
        }

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(HttpStatus.BAD_REQUEST).send('Password reset token is invalid or has expired.');
        }

        // Update password and clear reset token
        user.password = await bcrypt.hash(password, 10); // Use bcrypt to hash password
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save();

        
        req.flash('success_msg', 'Password has been reset. You can now log in.');
        return res.redirect('/login');

    } catch (error) {
        console.log(error);
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).send('Error resetting password.');
    }
};

exports.getChangePass = async (req, res) => {
    try {
        res.render('user/changePassword')
    } catch (error) {
        console.log(`Error from getChangePassword ${error}`)
    }
}
exports.postChangePass = async (req, res) => {
    try {
        // Get form data
        const currentPassword = req.body['current-password'];
        const newPassword = req.body['new-password'];
        const confirmPassword = req.body['confirm-password'];

        // Find user

        const user = await User.findById(req.session.user_id)
        console.log(`user is ${user}`)
        if (!user) {
            req.flash('error_msg', 'User not found');
            return res.redirect('/change-password');
        }

        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);

        // If current password is wrong
        if (!isCurrentPasswordValid) {
            req.flash('error_msg', 'Current password is incorrect');
            return res.redirect('/change-password');
        }

        // Check if new passwords match
        if (newPassword !== confirmPassword) {
            req.flash('error_msg', 'New passwords do not match');
            return res.redirect('/change-password');
        }

        // Hash and save new password
        const saltRounds = 10;
        const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

        await User.findByIdAndUpdate(req.session.user_id, {
            password: hashedNewPassword
        });

        req.flash('success_msg', 'Password updated successfully');
        return res.redirect('/change-password');

    } catch (error) {
        console.log(`Error from postChangePassword: ${error}`);
        req.flash('error_msg', 'An error occurred while changing password');
        return res.redirect('/change-password');
    }
}