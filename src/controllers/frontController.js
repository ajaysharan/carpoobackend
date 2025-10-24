const { Client } = require('../models')


exports.createClient = async (req, res) => {
    try {
        let data = req.getBody(['name', 'dob', 'phone', 'email', 'car_name', 'service_coupon', 'country', 'city', 'date_time']);
        let result = await Client.create(data);
        return res.successInsert(result);
    } catch (error) {
        return res.someThingWentWrong(error);
    }
}


exports.getClient = async (req, res) => {
    try {
        let result = await Client.find().sort({ created_at: -1 });
        return res.success(result);
    } catch (error) {
        return res.someThingWentWrong(error);
    }
}

exports.updateClient = async (req, res) => {
    try {

        let record = await Client.findById(req.params.id);
        if (!record) return res.noRecords();

        let data = req.getBody(['name', 'dob', 'phone', 'email', 'car_name', 'service_coupon', 'country', 'city', 'date_time']);
        const result = await record.updateOne(data);
        return res.successUpdate(result);
    } catch (error) {
        return res.someThingWentWrong(error);
    }
}

exports.deleteClient = async (req, res) => {
    try {

        let record = await Client.findById(req.params.id);
        if (!record) return res.noRecords();

        const result = await record.deleteOne();
        return res.successDelete(result);
    } catch (error) {
        return res.someThingWentWrong(error);
    }
}