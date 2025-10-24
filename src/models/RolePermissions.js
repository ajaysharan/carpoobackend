const mongoose = require("mongoose");
const { Schema } = mongoose;

const RolePermissionSchema = new Schema(
  {
    roleId: { type: Schema.Types.ObjectId, trim: true, index: true },
    moduleId: { type: String, default: "", index: true },
    module: { type: String, trim: true, default: "" },
    all: { type: Boolean, default: false },
    can_add: { type: Boolean, default: false },
    can_edit: { type: Boolean, default: false },
    can_delete: { type: Boolean, default: false },
    can_view: { type: Boolean, default: false },
    can_export: { type: Boolean, default: false },
    can_import: { type: Boolean, default: false },
    description: { type: String, default: "" },
  },
  { 
    timestamps: true,
    toObject: { getters: true },
    toJSON: { getters: true },
  }
);

module.exports = mongoose.model("RolePermission", RolePermissionSchema);
