const { Testimonial } = require('../models');
const moment = require('moment');
const mongoose = require('mongoose');

exports.create = async (req, res) => {
    try {
        const { userId, message, status } = req.body;
        const testimonial = await Testimonial.create({ userId, message, status });

        return res.successInsert(testimonial);
    } catch (error) {
        return res.someThingWentWrong(error);
    }
};

exports.update = async (req, res) => {
    try {
        let testimonial = await Testimonial.findOne({ _id: new mongoose.Types.ObjectId(`${req.params.id}`), deletedAt: null });
        if (!testimonial) return res.noRecords();

        const { userId, message, status } = req.body;
        await Testimonial.updateOne({ _id: testimonial._id }, { userId, message, status });

        return res.successUpdate(testimonial);
    } catch (error) {
        return res.someThingWentWrong(error);
    }
};

exports.delete = async (req, res) => {
    try {
        const testimonial = await Testimonial.findOne({ _id: new mongoose.Types.ObjectId(`${req.params.id}`), deletedAt: null });
        if (!testimonial) return res.noRecords();

        await testimonial.updateOne({ deletedAt: moment().toISOString() });
        return res.successDelete(testimonial);
    } catch (error) {
        return res.someThingWentWrong(error);
    }
};

exports.get = async (req, res) => {
    try {
        let { limit, pageNo, query } = req.query;

        limit = limit ? parseInt(limit) : 10;
        pageNo = pageNo ? parseInt(pageNo) : 1;

        var extraFilters = {};
        if (query && query !== '') {
            extraFilters['$or'] = [{ userName: { $regex: new RegExp(query, 'i') } }, { message: { $regex: new RegExp(query, 'i') } }];
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
                    userId: 1,
                    status: { $ifNull: ['$status', 1] },
                    userName: { $arrayElemAt: ['$user.fullName', 0] },
                    message: 1,
                    createdAt: 1
                }
            },
            { $match: extraFilters }
        ];

        // Clone the pipeline and append `$count` for total count
        const totalCountPipeline = [...pipeline, { $count: 'total_count' }];

        // Query to get paginated results
        const resultsPipeline = [...pipeline, { $sort: { createdAt: -1 } }, { $skip: (pageNo - 1) * limit }, { $limit: limit }];

        // Execute both pipelines
        const [results, totalCount] = await Promise.all([Testimonial.aggregate(resultsPipeline), Testimonial.aggregate(totalCountPipeline)]);

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
