const CmsPage = require("../models/CmsPage");
const PageList = require("../models/PageList");
const { v4: uuidv4 } = require("uuid");
const Storage = require("../helpers/storage");
const mongoose = require("mongoose");

exports.getAllCMSPages = async (req, res) => {
  try { 
    const {
      limit = 10,
      pageNo = 1,
      query = "",
      orderBy = "order",
      orderDirection = 1,
    } = req.query;

    const skip = (pageNo - 1) * limit;
    const sortOrder = orderDirection === "1" ? 1 : -1;

    const searchFilter = {};
    searchFilter["$and"] = [{ deletedAt: null }];

    if (query) {
      searchFilter["$or"] = [];
      searchFilter["$or"].push(
        { title: { $regex: query, $options: "i" } },
        { content: { $regex: query, $options: "i" } }
      );
    }

    const totalCount = await CmsPage.countDocuments(searchFilter);

    const cmsPage = await CmsPage.find(searchFilter)
      .populate("page_id")
      .skip(skip)
      .limit(Number(limit))
      .sort({ [orderBy]: sortOrder });

    return res.pagination(cmsPage, totalCount, limit, pageNo);
  } catch (error) {
    return res.someThingWentWrong(error);
  }
};

exports.create = async (req, res) => {
  try {
    const { page, title, content, status } = req.body;

    let data = {
      page_id: page,
      title: title,
      content: content,
      status: status,
    };

    const metaTitle = req.body?.seo?.metaTitle?.trim();
    const metaDescription = req.body?.seo?.metaDescription?.trim();
    const metaKeywordsRaw = req.body?.seo?.metaKeywords;
    const metaKeywords =
      typeof metaKeywordsRaw === "string" && metaKeywordsRaw.trim()
        ? metaKeywordsRaw
            .trim()
            .split(",")
            .map((k) => k.trim())
        : [];

    if (metaTitle || metaDescription || metaKeywords.length > 0) {
      data.seo = {
        metaTitle: metaTitle || "",
        metaDescription: metaDescription || "",
        metaKeywords,
      };
    }

    if (req.files) {
      if (
        req.files?.image &&
        req.files?.image?.[0] &&
        req.files?.image?.[0]?.filename
      ) {
        data.image = req.files.image[0].filename;
      }
      if (
        req.files?.video &&
        req.files?.video?.[0] &&
        req.files?.video?.[0]?.filename
      ) {
        data.video = req.files?.video?.[0]?.filename;
      }
    }

    data.slug = uuidv4();

    data.createdBy = req.admin_id;
    data.updatedBy = req.admin_id;

    const newCmsPage = new CmsPage(data);

    const result = await newCmsPage.save();

    return res.successInsert(result);
  } catch (error) {
    console.error("Error creating CMS Page:", error);
    return res.someThingWentWrong(error);
  }
};

exports.getCMSPages = async (req, res) => {

  try {
    
    const { id } = req.params;
      console.log(id)
    const result = await CmsPage.findById(id).populate("page_id");
    if (!result) return res.noRecords();
    return res.success(result);
  } catch (error) {
    console.error("Error fetching CMS Page:", error);
    return res.someThingWentWrong(error);
  }
};

exports.getCMSPageStatusToggle = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const result = await CmsPage.findById(id).populate("page_id");
    if (!result) return res.noRecords();
    const statusUpdate = await CmsPage.findByIdAndUpdate(
      id,
      { $set: { status: status } },
      { new: true }
    );
    return res.success(statusUpdate);
  } catch (error) {
    console.error("Error fetching CMS Page:", error);
    return res.someThingWentWrong(error);
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const existingCmsPage = await CmsPage.findById(id);
    if (!existingCmsPage) return res.noRecords();
    const { page, title, content, status } = req.body;

    let data = {
      page_id: page,
      title: title,
      content: content,
      status: status,
    };

    const metaTitle = req.body?.seo?.metaTitle?.trim();
    const metaDescription = req.body?.seo?.metaDescription?.trim();
    const metaKeywordsRaw = req.body?.seo?.metaKeywords;
    const metaKeywords =
      typeof metaKeywordsRaw === "string" && metaKeywordsRaw.trim()
        ? metaKeywordsRaw
            .trim()
            .split(",")
            .map((k) => k.trim())
        : [];

    if (metaTitle || metaDescription || metaKeywords.length > 0) {
      data.seo = {
        metaTitle: metaTitle || "",
        metaDescription: metaDescription || "",
        metaKeywords,
      };
    }

    if (req.files) {
      if (
        req.files?.image &&
        req.files?.image?.[0] &&
        req.files?.image?.[0]?.filename
      ) {
        Storage.deleteFile(existingCmsPage.image);
        data.image = req.files.image[0].filename;
      }
      if (
        req.files?.video &&
        req.files?.video?.[0] &&
        req.files?.video?.[0]?.filename
      ) {
        Storage.deleteFile(existingCmsPage.image);
        data.video = req.files?.video?.[0]?.filename;
      }
    }

    data.createdBy = req.admin_id;
    data.updatedBy = req.admin_id;

    const result = await CmsPage.findByIdAndUpdate(id, data, { new: true });
    return res.successInsert(result);
  } catch (error) {
    console.error("Error creating CMS Page:", error);
    return res.someThingWentWrong(error);
  }
};

exports.delete = async (req, res) => {
  try {
    const page = await CmsPage.findOne({
      _id: new mongoose.Types.ObjectId(req.params.id),
      deletedAt: null,
    });

    if (!page) return res.status(404).json({ error: "CMS Page  not found" });

    // if (page.image || page.video) {
    //   Storage.deleteFile(page.image);
    //   Storage.deleteFile(page.video);
    //   delete page.image;
    //   delete page.video;
    // }

    page.deletedAt = new Date().toISOString(); //soft delete
    await page.save();
    return res.successDelete(page);
  } catch (error) {
    return res.someThingWentWrong(error);
  }
};

exports.getpageWithCmsContent = async (req, res) => {
  try {
    const { slug } = req.params;
    const result = await PageList.aggregate([
      { $match: { slug } },
      {
        $lookup: {
          from: "cmspages", // collection name of CMS (lowercase plural of your model name)
          localField: "_id", // field in PageList
          foreignField: "page_id", // field in CMS Page
          as: "cmsContent"
        }
      },
      {
        $unwind: {
          path: "$cmsContent",
          preserveNullAndEmptyArrays: true // optional: in case no match is found
        }
      }
    ]);

    if (!result || result.length === 0) return res.noRecords();
    return res.success(result[0]);
  } catch (error) {
    return res.someThingWentWrong(error);
  }
};
