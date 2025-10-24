const Country = require("../models/Country");
const States = require("../models/State");
const City = require("../models/City");
const Storage = require("../helpers/storage"); 
exports.getCountries = async (req, res) => {
  try {
    const {
      limit = 10,
      pageNo = 1,
      query = "",
      orderBy = "name",
      orderDirection = -1,
    } = req.query;
    const skip = (pageNo - 1) * limit;
    const sortOrder = orderDirection === "1" ? 1 : -1;

    const searchFilter = query
      ? {
          $or: [
            { name: { $regex: query, $options: "i" } },
            { country_code: { $regex: query, $options: "i" } },
          ],
        }
      : {};
    const totalCount = await Country.countDocuments(searchFilter);
    const countries = await Country.find(searchFilter)
      .skip(skip)
      .limit(Number(limit))
      .sort({ [orderBy]: sortOrder });

    res.pagination(countries, totalCount, limit, pageNo);
  } catch (error) {
    return res.someThingWentWrong(error);
  }
};

exports.updateCountryData = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    delete data.id;
    const existingCountryData = await Country.findById(id);
    if (!existingCountryData) return res.noRecords();
    if (req.files && Object.keys(req.files).length > 0) {
      if (req.files.flag && req.files.flag[0] && req.files.flag[0].filename) {
        Storage.deleteFile(existingCountryData.flag);
        data.flag = req.files.flag[0].filename;
      }
      if (
        req.files.image &&
        req.files.image[0] &&
        req.files.image[0].filename
      ) {
        Storage.deleteFile(existingCountryData.image);
        data.image = req.files.image[0].filename;
      }
      if (
        req.files.banner &&
        req.files.banner[0] &&
        req.files.banner[0].filename
      ) {
        Storage.deleteFile(existingCountryData.banner);
        data.banner = req.files.banner[0].filename;
      }
    }

    const results = await Country.findByIdAndUpdate(id, data, {
      new: true,
    });
    return res.success(results);
  } catch (error) {
    return res.someThingWentWrong(error);
  }
};

exports.toggleCountryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const update = await Country.findByIdAndUpdate(id, {
      $set: { status: status },
    });
    return res.success(update);
  } catch (error) {
    return res.someThingWentWrong(error);
  }
};

exports.getStates = async (req, res) => {
  try {
    const {
      limit = 10,
      pageNo = 1,
      query = "",
      orderBy = "name",
      orderDirection = -1,
    } = req.query;
    const skip = (pageNo - 1) * limit;
    const sortOrder = orderDirection === "1" ? 1 : -1;

    // Construct a search filter
    const searchFilter = query
      ? {
          $or: [
            { name: { $regex: query, $options: "i" } },
            { country_name: { $regex: query, $options: "i" } },
            { title: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } },
            { state_code: { $regex: query, $options: "i" } },
          ],
        }
      : {};

    const totalCount = await States.countDocuments(searchFilter);
    const states = await States.find(searchFilter)
      .skip(skip)
      .limit(Number(limit))
      .sort({ [orderBy]: sortOrder });
    return res.pagination(states, totalCount, limit, pageNo);
  } catch (error) {
    return res.someThingWentWrong(error);
  }
};

exports.updateStateData = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    delete data.id;
    const existingStateData = await States.findById(id);
    if (!existingStateData) return res.noRecords();
    if (req.files && Object.keys(req.files).length > 0) {
      if (
        req.files.image &&
        req.files.image[0] &&
        req.files.image[0].filename
      ) {
        Storage.deleteFile(existingStateData.image);
        data.image = req.files.image[0].filename;
      }
      if (
        req.files.banner &&
        req.files.banner[0] &&
        req.files.banner[0].filename
      ) {
        Storage.deleteFile(existingStateData.banner);
        data.banner = req.files.banner[0].filename;
      }
    }

    const results = await States.findByIdAndUpdate(id, data, {
      new: true,
    });
    return res.success(results);
  } catch (error) {
    console.log(error);
    return res.someThingWentWrong(error);
  }
};

exports.toggleStateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const update = await States.findByIdAndUpdate(id, {
      $set: { status: status },
    });
    return res.success(update);
  } catch (error) {
    return res.someThingWentWrong(error);
  }
};

exports.getCities = async (req, res) => {
  try {
    const {
      limit = 10,
      pageNo = 1,
      query = "",
      orderBy = "name",
      orderDirection = -1,
    } = req.query;
    const skip = (pageNo - 1) * limit;
    const sortOrder = orderDirection === "1" ? 1 : -1;

    // Construct a search filter
    const searchFilter = query
      ? {
          $or: [
            { name: { $regex: query, $options: "i" } },
            { title: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } },
            { pincode: { $regex: query, $options: "i" } },
          ],
        }
      : {};

    const totalCount = await City.countDocuments(searchFilter);
    const cities = await City.find(searchFilter)
      .skip(skip)
      .limit(Number(limit))
      .sort({ [orderBy]: sortOrder });
    return res.pagination(cities, totalCount, limit, pageNo);
  } catch (error) {
    return res.someThingWentWrong(error);
  }
};

exports.updateCityData = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    delete data.id;
    const existingCityData = await City.findById(id);
    if (!existingCityData) return res.noRecords();
    if (req.files && Object.keys(req.files).length > 0) {
      if (
        req.files.image &&
        req.files.image[0] &&
        req.files.image[0].filename
      ) {
        Storage.deleteFile(existingCityData.image);
        data.image = req.files.image[0].filename;
      }
      if (
        req.files.banner &&
        req.files.banner[0] &&
        req.files.banner[0].filename
      ) {
        Storage.deleteFile(existingCityData.banner);
        data.banner = req.files.banner[0].filename;
      }
    }

    const results = await City.findByIdAndUpdate(id, data, {
      new: true,
    });
    return res.success(results);
  } catch (error) {
    return res.someThingWentWrong(error);
  }
};

exports.toggleCityStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const update = await City.findByIdAndUpdate(id, {
      $set: { status: status },
    });
    return res.success(update);
  } catch (error) {
    return res.someThingWentWrong(error);
  }
};

exports.getStateByCountryId = async (req, res) => {
  try {
    const { country_id } = req.params;

    const results = await States.find({
      country_id: country_id,
    }).sort({
      ["name"]: 1,
    });
    if (!results) return res.noRecords("Invalid Id!");
    return res.success(results);
  } catch (error) {
    return res.someThingWentWrong(error);
  }
};

exports.getCityByStateId = async (req, res) => {
  try {
    const { state_id } = req.params;

    const results = await City.find({ state_id: state_id }).sort({
      ["name"]: 1,
    });
    if (!results) return res.noRecords("Invalid Id!");
    return res.success(results);
  } catch (error) {
    return res.someThingWentWrong(error);
  }
};
