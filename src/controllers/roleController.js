const { Role } = require("../models");
const RolePermissionModel = require("../models/RolePermissions");
const moment = require("moment");
const language = require("../languages/english");
const mongoose = require("mongoose");

exports.createRole = async (req, res) => {
  try {
    const { name, status } = req.body;
    const role = await Role.create({ name, status });

    return res.successInsert(role);
  } catch (error) {
    return res.someThingWentWrong(error);
  }
};

exports.updateRole = async (req, res) => {
  try {
    let role = await Role.findOne({
      _id: new mongoose.Types.ObjectId(req.params.id),
      deletedAt: null,
    });
    if (!role) return res.noRecords();

    const { name, status } = req.body;
    await Role.updateOne({ _id: role._id }, { name, status });

    return res.successUpdate(role);
  } catch (error) {
    return res.someThingWentWrong(error);
  }
};

exports.deleteRole = async (req, res) => {
  try {
    const role = await Role.findOne({
      _id: new mongoose.Types.ObjectId(req.params.id),
      deletedAt: null,
    }); 
    if (!role) return res.noRecords();

    await role.updateOne({ deletedAt: moment().toISOString() });
    return res.successDelete(role);
  } catch (error) {
    return res.someThingWentWrong(error);
  }
};

exports.getRole = async (req, res) => {
  try {
    const { limit = 10, pageNo = 1, query = "", status, orderBy = "createdAt", orderDirection = 'desc' } = req.query;
    
    const sortDirection = orderDirection.toLowerCase() === "asc" ? 1 : -1;
    const sort = { [orderBy]: sortDirection };

    const parsedLimit = Math.max(parseInt(limit), 1);   // Ensure limit is at least 1
    const parsedPageNo = Math.max(parseInt(pageNo), 1); // Ensure pageNo is at least 1

    // Build the filter object
    const filter = { deletedAt: null };

    if (query?.trim()) {
      filter.name = { $regex: query.trim(), $options: "i" };
    }

    // Only include status if it's a valid boolean or number
    if (status !== undefined && status !== "") {
      filter.status = status === "true" || status === true || status === "1" || status === 1;
    }

    const results = await Role.find(filter)
        .sort(sort)
        .limit(parsedLimit)
        .skip((parsedPageNo - 1) * parsedLimit);

    const totalCount = await Role.countDocuments(filter)
    return res.pagination(results, totalCount, parsedLimit, parsedPageNo);
  } catch (error) {
    console.error("Error in getRole:", error); // Helpful for debugging in logs
    return res.someThingWentWrong(error);
  }
};


exports.addPermission = async (req, res) => {
  try {
    let role = await Role.findOne({
      _id: new mongoose.Types.ObjectId(req.params.id),
      deletedAt: null,
    });
    if (!role) return res.noRecords();

    if (req.body.permission === undefined || req.body.permission.length === 0) {
      throw new Error("Permissions is required..!!");
    }

    await Role.updateOne(
      { _id: role._id },
      { permission: req.body.permission }
    );
    return res.successUpdate(role);
  } catch (error) {
    return res.someThingWentWrong(error);
  }
};

exports.role_permission = async (req, res) => {
  try {
    let where = { roleId: new mongoose.Types.ObjectId(req.params.id) };
    const rolePermission = await RolePermissionModel.find(where);

    if (rolePermission.length === 0) {
      return res.noRecords(); // Assuming this method sends an appropriate "no records" response
    }

    const modifiedRolePermission = rolePermission.reduce((acc, item) => {
      acc[item.module] = item;
      return acc;
    }, {});

    return res.success({
      status: true,
      message: "Permission data fetched successfully.",
      data: modifiedRolePermission,
    });
  } catch (error) {
    return res.someThingWentWrong(error);
  }
};

exports.updateRolePermission = async (req, res) => {
  try {
    const { id } = req.params;
    const { module, permissions } = req.body;

    const where = { roleId: new mongoose.Types.ObjectId(id), module };
    let rolePermission = await RolePermissionModel.findOne(where);
    if (rolePermission) {
      rolePermission = await RolePermissionModel.updateOne(
        where,
        {
          $set: {
            all: permissions.all,
            can_add: permissions.can_add,
            can_edit: permissions.can_edit,
            can_delete: permissions.can_delete,
            can_view: permissions.can_view,
            can_export: permissions.can_export,
            can_import: permissions.can_import,
            description: permissions.description,
          },
        },
        { new: true }
      );
    } else {
      rolePermission = await RolePermissionModel.create({
        roleId: id,
        module,
        ...permissions,
      });
    }

    return res.successUpdate(
      rolePermission,
      language.PERMISSION_UPDATEDED_SUCCESSFULLY
    );
  } catch (error) {
    return res.someThingWentWrong(error);
  }
};

exports.getSingleRole = async (req, res) => {
  try {
    const role = await Role.findOne({
      _id: new mongoose.Types.ObjectId(req.params.id),
      deletedAt: null,
    });
    if (!role) return res.noRecords();

    return res.success(role);
  } catch (error) {
    return res.someThingWentWrong(error);
  }
};
