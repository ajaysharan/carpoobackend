const Client = require('./Client');
const User = require('./User');
const Admin = require('./Admin');
const Setting = require('./Setting');
const Department = require('./Department');
const Designation = require('./Designation');
const Role = require('./Role');
const Notification = require('./Notification');
const Feedback = require('./Feedback');
// const CompanyPolicie = require('./CompanyPolicie');
const Testimonial = require('./Testimonial');

module.exports = {
    Client,
    Admin,
    // CompanyPolicie,
    Testimonial,
    Feedback,
    Department,
    Designation,
    Notification,
    User,
    Setting,
    Role,
};
