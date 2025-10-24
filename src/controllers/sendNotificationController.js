const { default: mongoose } = require("mongoose");
const { Notification } = require("../models");

exports.send = async (req, res) => {
    try {
        let vData = req.getBody(['is_all', 'heading', 'message', 'type', 'users', 'link']);
        vData.user = vData.users
        if (req.file && req.file.location) vData.attachment = req.file.location;
        let notifications = null
        if(vData.is_all){            
            notifications = await Notification.create(vData)          
            req.io.sockets.in(notifications.user.toString()).emit("notifications", {
                _id: notifications._id,
                heading: notifications.heading,
                message: notifications.message,
                type: notifications.type,
                link: notifications.link,
                attachment: notifications.attachment,
                createdAt: notifications.createdAt
            });
        }else{           
             notifications = await Notification.insertMany(req.body.users.map(row => ({ ...vData, user: new mongoose.Types.ObjectId(`${row.value}`) })), { returnDocument: 'after' });
             notifications.forEach(function (notification) {
                req.io.sockets.in(notification.user.toString()).emit("notification", {
                    _id: notification._id,
                    heading: notification.heading,
                    message: notification.message,
                    type: notification.type,
                    link: notification.link,
                    attachment: notification.attachment,
                    createdAt: notification.createdAt
                });
            });    
        }       
        return res.successInsert(notifications);
    } catch (error) {
        console.log(error)
        return res.someThingWentWrong(error);
    }
};
exports.list = async (req, res) => {
    try {
        let { limit, pageNo, query } = req.query;

        limit = limit ? parseInt(limit) : 10;
        pageNo = pageNo ? parseInt(pageNo) : 1;

        var extraFilters = {}
        if (query && query !== "") {
            extraFilters["$or"] = [
                { heading: { $regex: new RegExp(query, "i") } },
                { message: { $regex: new RegExp(query, "i") } },
                { employeeId: { $regex: new RegExp(query, "i") } },
                { fullName: { $regex: new RegExp(query, "i") } },
                { email: { $regex: new RegExp(query, "i") } },
            ];
        }
        const pipeline = [
            { $match: { deletedAt: null } },
            {
                
                $lookup: {
                    from: "users",
                    localField: "user",
                    foreignField: "_id",
                    as: "user",
                }
            },
            {
                $project: {
                    _id: 1, heading: 1, message: 1, type: 1, link: 1, attachment: 1, is_read: 1,
                    employeeId: { $arrayElemAt: ["$user.employeeId", 0] },
                    fullName: { $arrayElemAt: ["$user.fullName", 0] },
                    email: { $arrayElemAt: ["$user.email", 0] },
                }
            },
            { $match: extraFilters },
        ];
        // Clone the pipeline and append `$count` for total count
        const totalCountPipeline = [...pipeline, { $count: "total_count" }];
        // Query to get paginated results
        const resultsPipeline = [
            ...pipeline,
            { $sort: { createdAt: -1 } },
            { $skip: (pageNo - 1) * limit },
            { $limit: limit }
        ];
        // Execute both pipelines
        const [results, totalCount] = await Promise.all([
            Notification.aggregate(resultsPipeline),
            Notification.aggregate(totalCountPipeline),
        ]);
        const total_count = totalCount.length > 0 ? totalCount[0].total_count : 0;
        if (results.length > 0) {
            return res.pagination(results, total_count, limit, pageNo);
        } else {
            return res.datatableNoRecords();
        }
    } catch (error) {
        return res.someThingWentWrong(error);
    }
}
exports.notificationDelete = async (req, res) => {
    try {
        const { id } = req.params;
        // Check if ID is provided
        if (!id) {
            return res.validationError("Notification ID is required.");
        }
        const notification = await Notification.findOneAndUpdate(
            { _id: id, deletedAt: null },
            { $set: { deletedAt: new Date() } },
            { new: true }
        );       
        if (!notification) {
            return res.notFound("Notification not found or already deleted.");
        }
        return res.successUpdate(notification, "Notification deleted successfully.");
    } catch (error) {
        console.log(error);
        return res.someThingWentWrong(error);
    }
};







 

















// exports.createNotification = async (req, res) => {
//     try {
//       const { is_all, user, heading, message, type, link } = req.body;
  
//       const files = req.files ? req.files.map((file) => file.filename) : [];
  
//       const newNotification = new Notification({
//         is_all,
//         user: is_all === "true" ? undefined : user,
//         heading,
//         message,
//         type,
//         link,
//         files,
//       });
  
//       await newNotification.save();
  
//       res.status(201).json({
//         status: true,
//         message: "Notification created successfully",
//         data: newNotification,
//       });
//     } catch (error) {
//       console.error("Create notification error:", error);
//       res.status(500).json({
//         status: false,
//         message: "Failed to create notification",
//         error,
//       });
//     }
// };
  