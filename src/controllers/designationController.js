const { Designation, Benefit } = require('../models');
const moment = require('moment');
const mongoose = require('mongoose');

exports.create = async (req, res) => {
    try {
        const { name } = req.body;
        const designation = await Designation.create({ name });

        return res.successInsert(designation);
    } catch (error) {
        return res.someThingWentWrong(error);
    }
};



exports.update = async (req, res) => {
    try {
        let designation = await Designation.findOne({ _id: new mongoose.Types.ObjectId(`${req.params.id}`), deletedAt: null });
        if (!designation) return res.noRecords();

        const { name } = req.body;
        await designation.updateOne({ name });

        return res.successUpdate(designation);
    } catch (error) {
        return res.someThingWentWrong(error);
    }
};

exports.delete = async (req, res) => {
    try {
        const designation = await Designation.findOne({ _id: new mongoose.Types.ObjectId(`${req.params.id}`), deletedAt: null });
        if (!designation) return res.noRecords();

        await designation.updateOne({ deletedAt: moment().toISOString() });
        return res.successDelete(designation);
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
            filter.name = { $regex: query, $options: 'i' };
        }

        const results = await Designation.find(filter)
            .sort({ createdAt: -1 })
            .limit(limit)
            .skip((pageNo - 1) * limit);
        const total_count = await Designation.countDocuments(filter);

        if (results.length > 0) {
            return res.pagination(results, total_count, limit, pageNo);
        } else {
            return res.datatableNoRecords();
        }
    } catch (error) {
        return res.someThingWentWrong(error);
    }
};

exports.getSingle = async (req, res) => {
    try {
        const designation = await Designation.findOne({ _id: new mongoose.Types.ObjectId(`${req.params.id}`), deletedAt: null });
        if (!designation) return res.noRecords();

        return res.success(designation);
    } catch (error) {
        return res.someThingWentWrong(error);
    }
};

