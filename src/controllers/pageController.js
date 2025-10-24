const PageList = require("../models/PageList");

exports.page_list = async (req, res) => {
    try {
        const pages = await PageList.find().sort({ ['name']: 1 });
        if (!Array.isArray(pages) || pages.length === 0) return res.noRecords();
        return res.success(pages);
    } catch (error) {
        return res.someThingWentWrong(error);
    }
}  