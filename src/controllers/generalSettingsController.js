const { clean } = require("../helpers/string");
const GeneralSetting = require("../models/Setting");
const Storage = require("../helpers/Storage");
const { default: mongoose } = require("mongoose"); 

exports.getGeneralSetting = async (req, res) => {
    try {

        var setting = await GeneralSetting.find({ setting_type: { $in: req.params.type.split(',').map(r => parseInt(r)) } });

        const setting_arr = setting.reduce((obj, item) => {
          const value = item.field_name === "logo" ? process.env.BASE_URL+'uploads/settings/' + item.field_value : item.field_value;
          return Object.assign(obj, { [item.field_name]: value });
        }, {});

        if (setting.length > 0) {
            return res.success(setting_arr);
        } else {
            return res.noRecords();
        }
    } catch (error) {
        return res.someThingWentWrong(error);
    }
}
exports.createGeneralSetting = async (req, res) => {
  try {
    const data = clean(req.body);

    const requiredFields = [
      "setting_name",
      "field_label",
      "field_name",
      "field_value",
    ];
    for (const field of requiredFields) {
      if (!data[field]) {
        return res.status(400).json({
          status: false,
          message: `${field} is required`,
        });
      }
    }

    const existing = await GeneralSetting.findOne({
      field_name: data.field_name,
    });
    if (existing) {
      return res.status(409).json({
        status: false,
        message: "Setting with this field_name already exists",
      });
    }

    const newSetting = new GeneralSetting(data);
    await newSetting.save();

    return res.status(201).json({
      status: true,
      message: "Setting created successfully",
      data: newSetting,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Something went wrong",
      error: error.message || error,
    });
  }
};
exports.deleteGeneralSetting = async (req, res) => {
  try {
    const settingId = req.params.id;
    const deleted = await GeneralSetting.findByIdAndDelete(settingId);

    if (!deleted) {
      return res.notFound("Setting not found");
    }

    return res.successDelete("Setting deleted successfully");
  } catch (error) {
    return res.someThingWentWrong(error);
  }
};
exports.getGeneralSettings = async (req, res) => {
  try {
    const { limit = 10, pageNo = 1, query = "" } = req.query;

    // Ensure numeric values
    const pageLimit = parseInt(limit);
    const page = parseInt(pageNo);

    const searchQuery = query
      ? {
          $or: [
            { setting_name: { $regex: query, $options: "i" } },
            { field_label: { $regex: query, $options: "i" } },
            { field_name: { $regex: query, $options: "i" } },
            { field_value: { $regex: query, $options: "i" } },
          ],
        }
      : {};

    const totalRecords = await GeneralSetting.countDocuments(searchQuery);
    const records = await GeneralSetting.find(searchQuery)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageLimit)
      .limit(pageLimit);

    res.status(200).json({
      status: true,
      message: "Success",
      data: {
        record: records,
        pagination: {
          total: totalRecords,
          page: page,
          limit: pageLimit,
        },
      },
    });
  } catch (err) {
    console.error("Error in getGeneralSettings:", err.message);
    res.status(500).json({
      status: false,
      message: err.message || "Server Error",
      data: [err.stack],
    });
  }
};
exports.listGeneralSetting = async (req, res) => {
  try {
    console.log(req.params.type)
    var setting = await GeneralSetting.find({ setting_type: parseInt(req.params.type) },
      "-createdAt -updatedAt"
    ).sort("_id");
    if (setting.length > 0) {
      return res.success(setting.map((row) => row.toObject({ getters: true })));
    } else {
      return res.noRecords();
    }
  } catch (error) {
    console.log(error)
    return res.someThingWentWrong(error);
  }
};
exports.updateGeneralSetting = async (req, res) => {
    try {
        var data = clean(req.body)
        var type = clean(req.query.type)
        delete data.favicon;
        data?.footer_logo ?? delete data.footer_logo;
        data?.logo ? delete data.logo: "";

        // Files Upload
        const { logo = null, footer_logo = null, favicon = null } = req.files || {};
        console.log(req.files)
        
        if (logo || footer_logo || favicon) {

            var setting = await GeneralSetting.find({ setting_name: ['favicon', 'footer_logo', 'logo'] });
            var setting_arr = setting.reduce((obj, item) => Object.assign(obj, { [item.field_name]: item.field_value }), {});

            if (logo != undefined) {
                Storage.deleteFile(`setting/${setting_arr?.logo}`);
                data.logo = logo[0].filename
            }

            if (footer_logo != undefined) {
                Storage.deleteFile(`setting/${setting_arr?.footer_logo}`);
                data.footer_logo = footer_logo[0].filename
            }

            if (favicon != undefined) {
                Storage.deleteFile(`setting/${setting_arr?.favicon}`);
                data.favicon = favicon[0].filename
            }
        }
    
        for (var key in data) {
            await GeneralSetting.updateOne({ field_name: key, setting_type: type }, { field_value: data[key] });
        }

        return res.successUpdate();
    } catch (error) {
      console.log(error)
        return res.someThingWentWrong(error);
    }
}
exports.toggleStatus = async (req, res) => {
    try {

        var record = await mongoose.connection.db.collection(req.params.table).findOne({ _id: new mongoose.Types.ObjectId(req.params.id) });
        if (record) {
            let status =  record.status == 1 ? 2 : 1;
            await mongoose.connection.db.collection(req.params.table).updateOne({ _id: new mongoose.Types.ObjectId(req.params.id) }, { $set: { status: status } });
            return res.success(record);
        } else {
            return res.noRecords();
        }
    } catch (error) {
        return res.someThingWentWrong(error);
    }
}
exports.delete = async (req, res) => {
    try {

        var record = await mongoose.connection.db.collection(req.params.table).findOne({ _id: new mongoose.Types.ObjectId(req.params.id) });
        if (record) {
            await mongoose.connection.db.collection(req.params.table).updateOne({ _id: new mongoose.Types.ObjectId(req.params.id) }, { $set: { deletedAt: new Date()} });
            return res.success(record);
        } else {
            return res.noRecords();
        }
    } catch (error) {
        return res.someThingWentWrong(error);
    }
}
