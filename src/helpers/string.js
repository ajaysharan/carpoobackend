exports.arrayColumn = (array, column) => array.map(item => item[column]);

exports.parseBool = data => data.toLowerCase() == 'true';

exports.clean = obj => {
    for (var propName in obj) {
        if (obj[propName] === null || obj[propName] === undefined || obj[propName] === '') {
            delete obj[propName];
        }
    }
    return obj;
};

exports.generateOTP = (limit = 6) => {
    var digits = '1234567890';
    var otp = '';
    for (i = 0; i < limit; i++) {
        otp += digits[Math.floor(Math.random() * 10)];
    }
    return otp;
};

exports.randomInt = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1) + min);
};

exports.convertToSlug = text => {
    return text
        .toLowerCase()
        .replace(/ /g, '-')
        .replace(/[^\w-]+/g, '');
};

exports.getFilePath = (value, path, returnType = true) => {
    if (['', null].includes(value)) {
        return returnType ? `${process.env.BASE_URL}uploads/avatar.png` : null;
    } else {
        return `${process.env.BASE_URL}uploads/${path}/${value}`;
    }
};

exports.makeid = (length, withNumber = true) => {
    let result = '';

    let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    if (withNumber) characters += '0123456789';

    const charactersLength = characters.length;
    let counter = 0;
    while (counter < length) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
        counter += 1;
    }

    return result;
};

exports.orderId = (a, prefix = 'ORD', len = 10) => {
    var x = len - (typeof a == 'string' ? a.length : a.toString().length);
    for (let i = 1; i <= x; i++) {
        a = '0' + a;
    }
    return prefix + a;
};

exports.getNameFromNumber = num => {
    const numeric = (num - 1) % 26;
    const letter = String.fromCharCode(65 + numeric);
    const num2 = Math.floor((num - 1) / 26);
    if (num2 > 0) {
        return getNameFromNumber(num2) + letter;
    } else {
        return letter;
    }
};

exports.getErrorMessages = ({ path, message, inner }) => {
    if (inner && inner.length) {
        return inner.reduce((acc, { path, message }) => {
            acc[path] = message;
            return acc;
        }, {});
    }
    return { [path]: message };
};

exports.generateSQLQuery = (table, params) => {
    if (!table) throw new Error('Table name is required');

    const selectFields = params.select && Array.isArray(params.select) ? params.select.join(', ') : '*';

    let whereClause = '';
    const whereParams = params.where || {};

    if (Object.keys(whereParams).length > 0) {
        const conditions = Object.entries(whereParams)
            .map(([key, value]) => {
                if (typeof value === 'string') {
                    return `${key} = '${value}'`;
                } else if (typeof value === 'number') {
                    return `${key} = ${value}`;
                } else if (Array.isArray(value)) {
                    return `${key} IN (${value.map(v => `'${v}'`).join(', ')})`;
                } else if (typeof value === 'object' && value?.like) {
                    return `${key} LIKE '%${value.like}%'`;
                } else if (typeof value === 'object' && value?.startLike) {
                    return `${key} LIKE '${value.startLike}%'`;
                } else if (typeof value === 'object' && value?.endLike) {
                    return `${key} LIKE '%${value.endLike}'`;
                }
                return '';
            })
            .filter(Boolean);

        whereClause = conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : '';
    }

    let orderByClause = '';
    if (params.orderBy && Array.isArray(params.orderBy)) {
        orderByClause = ` ORDER BY ${params.orderBy.join(', ')}`;
    }

    let limitClause = '';
    if (params.limit && Number.isInteger(params.limit)) {
        limitClause = ` LIMIT ${params.limit}`;
    }

    return `SELECT ${selectFields} FROM ${table}${whereClause}${orderByClause}${limitClause};`;
};

exports.enumerateDaysBetweenDates = (startDate, endDate, format = null) => {
    if (startDate.isAfter(endDate)) {
        throw new Error('End date should be greater than start date..!!');
    }

    if (endDate.diff(startDate, 'days') > 100) {
        throw new Error('start and end date difference should not be greater than 100 days...!!');
    }

    const date = [];
    const current = startDate.clone();
    while (current.isSameOrBefore(endDate, 'day') && date.length < 100) {
        if (format) {
            date.push(current.clone().format(format));
        } else {
            date.push(current.clone());
        }
        current.add(1, 'days');
    }
    return date;
};
