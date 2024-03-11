"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const healthCheck_1 = require("./utils/healthCheck");
const config = __importStar(require("./config"));
const routes_1 = require("./routes");
const app = (0, express_1.default)();
const sufixPath = '/index.html';
app.use(express_1.default.json()); // for parsing application/json
app.use(express_1.default.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(helmet_1.default.contentSecurityPolicy({
    directives: {
        'default-src': ["'self'"],
        'base-uri': ["'self'"],
        'block-all-mixed-content': [],
        'font-src': ["'self'", 'https:', 'data:'],
        'frame-ancestors': ["'self'"],
        'img-src': [
            "'self'",
            'data:',
            'https://a.tile.openstreetmap.org',
            'https://b.tile.openstreetmap.org',
            'https://c.tile.openstreetmap.org',
        ],
        'object-src': ["'none'"],
        'script-src': ["'self'"],
        'script-src-attr': ["'none'"],
        'style-src': ["'self'", 'https:', "'unsafe-inline'"],
        'worker-src': ["'self'", 'blob:'],
        'connect-src': [
            "'self'",
            'https://eservices.gov.yk.ca',
        ],
    },
}));
app.get("/api/healthCheck", (req, res) => {
    (0, healthCheck_1.doHealthCheck)(res);
});
app.use("/api/remote-feedback", routes_1.remoteFeedbackRouter);
// set up rate limiter: maximum of five requests per minute
var RateLimit = require('express-rate-limit');
var limiter = RateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 5000
});
// apply rate limiter to all requests
app.use(limiter);
app.listen(config.API_PORT, () => {
    console.log(`API listenting on port ${config.API_PORT}`);
});
