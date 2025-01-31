
const dotenv = require("dotenv")
dotenv.config()
var allowlist = [process.env.ORIGIN]

exports.corsOptionsDelegate = function (req, callback) {
    let corsOptions = { origin: false };
    if (allowlist.indexOf(req.header('Origin')) !== -1) {
        corsOptions = { origin: true }
        callback(null, corsOptions)
    }
    else {
        const err = 'Not allowed by CORS';
        callback(err, corsOptions);
    }
}