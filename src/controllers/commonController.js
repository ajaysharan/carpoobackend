const {  Designation, Department,  Feedback, CompanyPolicie } = require('../models');
const moment = require('moment');
const mongoose = require('mongoose');

exports.dashboard = async (req, res) => {
    try {
        const projects = 0;
        const projectCount = 0;
        const avatarCount = 0;
        const ThemeCount = 0; 
        const sessionCount = 0;

        return res.success({ avatarCount, projectCount, sessionCount, projects, ThemeCount });
    } catch (error) {
        return res.someThingWentWrong(error);
    }
};

exports.departments = async (req, res) => {
    try {
        const department = await Department.find({ deletedAt: null }).sort({ name: 1 });
        return res.success(department);
    } catch (error) {
        return res.someThingWentWrong(error);
    }
};

exports.designations = async (req, res) => {
    try {
        const designations = await Designation.find({ deletedAt: null }).sort({ name: 1 });
        return res.success(designations);
    } catch (error) {
        return res.someThingWentWrong(error);
    }
};

exports.companyPolicies = async (req, res) => {
    try {
        const filters = { deletedAt: null };
        const { query } = req.query;
        if (query) {
            filters['$or'] = [{ label: { $regex: new RegExp(query, 'i') } }, { description: { $regex: new RegExp(query, 'i') } }];
        }

        const policie = await CompanyPolicie.find(filters).sort({ label: 1, description: 1, link: 1 });
        return res.success(policie);
    } catch (error) {
        return res.someThingWentWrong(error);
    }
};

exports.listFeedback = async (req, res) => {
    try {
        let { limit, pageNo, query, sessionId } = req.query;

        limit = limit ? parseInt(limit) : 10;
        pageNo = pageNo ? parseInt(pageNo) : 1;

        var extraFilters = { employeeId: { $ne: null } };
        if (query && query !== '') {
            extraFilters['$or'] = [{ employeeId: { $regex: new RegExp(query, 'i') } }, { fullName: { $regex: new RegExp(query, 'i') } }, { email: { $regex: new RegExp(query, 'i') } }];
        }

        if (sessionId && sessionId !== '') {
            extraFilters.sessionId = sessionId;
        }

        const pipeline = [
            { $match: { deletedAt: null } },
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $project: {
                    _id: 1,
                    rating: 1,
                    message: 1,
                    sessionId: 1,
                    tags: 1,
                    employeeId: { $arrayElemAt: ['$user.employeeId', 0] },
                    fullName: { $arrayElemAt: ['$user.fullName', 0] },
                    email: { $arrayElemAt: ['$user.email', 0] }
                }
            },
            { $match: extraFilters }
        ];

        // Clone the pipeline and append `$count` for total count
        const totalCountPipeline = [...pipeline, { $count: 'total_count' }];

        // Query to get paginated results
        const resultsPipeline = [...pipeline, { $sort: { createdAt: -1 } }, { $skip: (pageNo - 1) * limit }, { $limit: limit }];

        // Execute both pipelines
        const [results, totalCount] = await Promise.all([Feedback.aggregate(resultsPipeline), Feedback.aggregate(totalCountPipeline)]);

        const total_count = totalCount.length > 0 ? totalCount[0].total_count : 0;
        if (results.length > 0) {
            return res.pagination(results, total_count, limit, pageNo);
        } else {
            return res.datatableNoRecords();
        }
    } catch (error) {
        return res.someThingWentWrong(error);
    }
};

exports.deleteFeedback = async (req, res) => {
    try {
        const feedback = await Feedback.findOne({ _id: new mongoose.Types.ObjectId(req.params.id), deletedAt: null });
        if (!feedback) return res.status(404).json({ error: 'Feedback not found' });

        await feedback.updateOne({ deletedAt: moment().toISOString() });
        return res.successDelete(feedback);
    } catch (error) {
        return res.someThingWentWrong(error);
    }
};



