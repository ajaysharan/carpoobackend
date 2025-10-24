const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

module.exports = async (req, res, next) => {
    try {
        if ((token = req.cookies.token)) {
            const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET_TOKEN_KEY_EMPLOYEE);
            filter = { _id: new mongoose.Types.ObjectId(`${decoded.userId}`) };
        } else if (mongoose.isValidObjectId(req.query.user)) {
            filter = { _id: new mongoose.Types.ObjectId(`${req.query.user}`) };
        } else {
            if (!req.isAuthenticated()) return res.json({ status: false, message: 'Unauthorized' });
            filter = { email: req.user._json.email };
        }

        const user = await User.aggregate([
            {
                $match: filter
            },
            {
                $lookup: {
                    from: 'departments',
                    localField: 'department',
                    foreignField: '_id',
                    as: 'department_data'
                }
            },
            {
                $lookup: {
                    from: 'designations',
                    localField: 'designation',
                    foreignField: '_id',
                    as: 'designation_data'
                }
            },
            {
                $lookup: {
                    from: 'notifications',
                    localField: '_id',
                    foreignField: 'user',
                    as: 'notifications',
                    pipeline: [
                        { $match: { deletedAt: null } },
                        { $sort: { createdAt: -1 } },
                        { $limit: 10 },
                        { $project: { heading: 1, message: 1, type: 1, link: 1, is_read: 1, attachment: 1, createdAt: 1 } }
                    ]
                }
            },
            {
                $project: {
                    _id: 1,
                    employeeId: 1,
                    fullName: 1,
                    email: 1,
                    jobTitle: 1,
                    department: 1,
                    status: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    designation: 1,
                    department_name: { $arrayElemAt: ['$department_data.name', 0] },
                    designation_name: { $arrayElemAt: ['$designation_data.name', 0] },
                    notifications: 1
                }
            }
        ]);

        if (user.length === 0) {
            req.logout();
            return res.json({ status: false, message: 'Unauthorized' });
        }

        req.user_data = user[0];
        next();
    } catch (error) {
        return res.json({ status: false, message: 'Unauthorized' });
    }
};
