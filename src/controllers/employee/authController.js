const { User, Testimonial } = require('../../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const base64url = require('base64url');
const { mailer, generateEmailTemplate } = require('../../helpers/mail');
const mongoose = require('mongoose');

   
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        let user = await User.findOne({ email, deletedAt: null });
        if (!user) return res.json({ status: false, message: 'Invalid credentials..!!' });

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.json({ status: false, message: 'Invalid credentials..!!' });

        if (!user.status)
            return res.status(401).json({
                status: false,
                message: 'Profile disabled.. Please contact admin..!!'
            });

        const token = await user.generateToken();
        res.cookie('token', token, { maxAge: 24 * 60 * 60 * 1000, httpOnly: true });
        res.status(200).json({
            status: true,
            message: 'Login Successfully..!!',
            data: { _id: user._id, fullName: user.fullName, email: user.email, employeeId: user.employeeId }
        });
    } catch (error) {
        return res.someThingWentWrong(error);
    }
};

exports.forgetPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email, deletedAt: null });
        if (!user) return res.send({ status: false, message: 'Email not found..!!' });

        const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET_TOKEN_KEY, { expiresIn: '1h' });
        const safeToken = base64url(token);

        const resetPasswordLink = `${process.env.CLIENT_BASE_URL}reset-password/${user._id}/${safeToken}`;
        const emailType = 'reset';
        const recipientName = user.fullName;
        const actionLink = resetPasswordLink;

        const emailTemplate = generateEmailTemplate(emailType, recipientName, actionLink);

        const resp = await mailer.sendMail({
            from: process.env.EMAIL,
            to: user.email,
            subject: emailTemplate.subject,
            html: emailTemplate.html
        });

        console.log(resp);
        return res.success();
    } catch (error) {
        return res.someThingWentWrong(error);
    }
};

exports.resetPassword = async (req, res) => {
    const { id, token, password } = req.body;

    try {
        const decodedToken = base64url.decode(token);
        const decoded = jwt.verify(decodedToken, process.env.JWT_SECRET_TOKEN_KEY);
        if (decoded.id !== id) throw new Error('Invalid Token..!!');

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.findOneAndUpdate({ _id: new mongoose.Types.ObjectId(id), deletedAt: null }, { password: hashedPassword }, { new: true });
        if (!user) throw new Error('Invalid Token..!!');

        return res.success([], 'Password updated successfully..!!');
    } catch (error) {
        return res.someThingWentWrong(error);
    }
};

exports.profile = async (req, res) => {
    try {
        let user = req.user;
        if (!user) return res.json({ status: false, message: 'User is Unauthorized..!!' }, 401);

        return res.success(user);
    } catch (error) {
        return res.someThingWentWrong(error);
    }
};

exports.logout = async (req, res) => {
    try {
        res.clearCookie('token');
        return res.success();
    } catch (error) {
        return res.someThingWentWrong(error);
    }
};

exports.testimonials = async (req, res) => {
    try {
        const testimonials = await Testimonial.aggregate([
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $lookup: {
                    from: 'designations',
                    localField: 'user.designation',
                    foreignField: '_id',
                    as: 'designation'
                }
            },
            {
                $project: {
                    message: 1,
                    userId: { $arrayElemAt: ['$user._id', 0] },
                    userName: { $arrayElemAt: ['$user.fullName', 0] },
                    designationName: { $arrayElemAt: ['$designation.name', 0] }
                }
            }
        ]);

        return res.success(testimonials);
    } catch (error) {
        return res.someThingWentWrong(error);
    }
};


