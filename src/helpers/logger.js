const fs = require('fs');
const path = require('path');

// Define log levels
const levels = {
    error: 'ERROR',
    warn: 'WARN',
    info: 'INFO',
    debug: 'DEBUG'
};

// Define the log file path
const logFilePath = path.join(__dirname, '../../public/logger/app.log');

// Helper to format the log message
function formatMessage(level, message) {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] ${level}: ${message}`;
}

// Logger function
const logger = {
    log: (level, message) => {
        if (!levels[level]) {
            throw new Error(`Invalid log level: ${level}`);
        }

        const formattedMessage = formatMessage(levels[level], message);

        // Log to the console
        console.log(formattedMessage);

        // Append to the log file
        fs.appendFile(logFilePath, formattedMessage + '\n', (err) => {
            if (err) console.error('Failed to write to log file:', err);
        });
    },

    error: (message) => logger.log('error', message),
    warn: (message) => logger.log('warn', message),
    info: (message) => logger.log('info', message),
    debug: (message) => logger.log('debug', message)
};

module.exports = logger;