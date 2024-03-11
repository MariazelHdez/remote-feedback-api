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
exports.remoteFeedbackRouter = void 0;
const express_1 = __importDefault(require("express"));
const dotenv = __importStar(require("dotenv"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const ejs_1 = __importDefault(require("ejs"));
const fs_1 = __importDefault(require("fs"));
const sanitize_html_1 = __importDefault(require("sanitize-html"));
dotenv.config();
const emailTemplate = fs_1.default.readFileSync('./template/feedbackEmail.ejs', 'utf-8');
const transporter = nodemailer_1.default.createTransport({
    host: process.env.SMTP_SERVER,
    port: parseInt(process.env.SMTP_PORT),
    requireTLS: false,
    secure: false,
    auth: {
        user: process.env.EMAIL_FROM,
        pass: process.env.SMTP_PASS,
    }
});
exports.remoteFeedbackRouter = express_1.default.Router();
exports.remoteFeedbackRouter.post("/feedbackForm", async (req, res) => {
    try {
        const data = req.body;
        const wasThisPageHelpful = (0, sanitize_html_1.default)(data.was_this_page_helpful);
        let emailOption = '';
        let emailComment = '';
        if (wasThisPageHelpful === 'Yes') {
            emailOption = 'How did this page help you?';
            emailComment = (0, sanitize_html_1.default)(data.how_did_this_page_help_you);
        }
        else {
            emailOption = 'How can we improve this page?';
            emailComment = (0, sanitize_html_1.default)(data.how_can_we_improve_this_page);
        }
        const pageUrl = data.current_page_url;
        const domain = data.domain;
        const submissionTimestamp = data.submission_timestamp;
        const langcode = data.langcode;
        const emailData = {
            submittedOn: submissionTimestamp,
            site: domain,
            lang: langcode,
            emailLabel: emailOption,
            emailContent: emailComment,
            urlFrom: pageUrl
        };
        const html = ejs_1.default.render(emailTemplate, emailData);
        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: domain ? (process.env[domain] ? process.env[domain] : process.env.EMAIL_DEFAULT) : process.env.EMAIL_DEFAULT,
            subject: process.env.EMAIL_SUBJECT,
            html: html
        };
        const info = await transporter.sendMail(mailOptions);
        res.send({ status: 200, data: 'Sent' });
    }
    catch (error) {
        console.log('Error sending email:', error);
        res.status(400).send({ status: 400, message: 'Request could not be processed' });
    }
});
