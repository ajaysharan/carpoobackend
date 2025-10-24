const mongoose = require("mongoose");

// Define schema for CMS Pages
const cmsPageSchema = new mongoose.Schema(
  {
    page_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PageList",
      required: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    }, 
    // SEO-related fields
    seo: {
      metaTitle: { type: String, trim: true },
      metaDescription: { type: String, trim: true },
      metaKeywords: { type: [String], default: [] },
    },

    image: {
      type: String,
      required: true,
      get: (value) => `${process.env.BASE_URL}uploads/cms_pages/${value}`,
    },
    video: { type: String, default: "", get: (value) => `${process.env.BASE_URL}uploads/cms_pages/${value}`},
    status          : { type: Number, default: 1 },
    deletedAt: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
    toObject: { getters: true },
    toJSON: { getters: true },
  }
);

// Create model
const CmsPage = mongoose.model("CmsPage", cmsPageSchema);

module.exports = CmsPage;