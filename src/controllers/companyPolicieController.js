const { CompanyPolicie } = require('../models');
const moment = require('moment');
const mongoose = require('mongoose');

exports.create = async (req, res) => {
    try {
        const vData = req.getBody(['label', 'description']);
        if (req.file && req.file?.location) {
            vData.link = req.file.location;
        } else {
            throw new Error('Please provide document..!!');
        }

        const area = await CompanyPolicie.create(vData);
        return res.successInsert(area);
    } catch (error) { 
        return res.someThingWentWrong(error);
    }
};
exports.update = async (req, res) => {
    try {
        let area = await CompanyPolicie.findOne({ _id: new mongoose.Types.ObjectId(`${req.params.id}`), deletedAt: null });
        if (!area) return res.noRecords();

        const vData = req.getBody(['label', 'description']);
        if (req.file && req.file?.location) {
            vData.link = req.file.location;
        }

        await area.updateOne(vData);
        return res.successUpdate(area);
    } catch (error) {
        return res.someThingWentWrong(error);
    }
};
exports.delete = async (req, res) => {
    try {
        const area = await CompanyPolicie.findOne({ _id: new mongoose.Types.ObjectId(`${req.params.id}`), deletedAt: null });
        if (!area) return res.noRecords();

        await area.updateOne({ deletedAt: moment().toISOString() });
        return res.successDelete(area);
    } catch (error) {
        return res.someThingWentWrong(error);
    }
};
exports.get = async (req, res) => {
    try {
        let { limit, pageNo, query = null } = req.query;

        limit = limit ? parseInt(limit) : 10;
        pageNo = pageNo ? parseInt(pageNo) : 1;

        let filter = { deletedAt: null };
        if (query) {
            filter.label = { $regex: query, $options: 'i' };
        }

        const results = await CompanyPolicie.find(filter)
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip((pageNo - 1) * limit);

        const total_count = await CompanyPolicie.countDocuments(filter);
        if (results.length > 0) {
            return res.pagination(results, total_count, limit, pageNo);
        } else {
            return res.datatableNoRecords();
        }
    } catch (error) {
        return res.someThingWentWrong(error);
    }
};
