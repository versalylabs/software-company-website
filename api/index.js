/**
 * Vercel Serverless Function entry point for versaly API.
 * Delegates incoming requests to the unified requestHandler in server.js.
 */
const { requestHandler } = require('../server.js');

module.exports = (req, res) => {
    return requestHandler(req, res);
};

module.exports.config = {
    api: {
        bodyParser: false,
    },
};
