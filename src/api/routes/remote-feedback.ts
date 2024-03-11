import express, { Request, Response } from "express";
import { body, param } from "express-validator";
import * as dotenv from "dotenv";
import nodemailer from "nodemailer";
import ejs from 'ejs';
import fs from 'fs';
import sanitizeHtml from 'sanitize-html';

dotenv.config();

const emailTemplate = fs.readFileSync('./template/feedbackEmail.ejs', 'utf-8');

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_SERVER,
    port: parseInt(process.env.SMTP_PORT!),
    requireTLS: false,
    secure: false,
    auth: {
        user: process.env.EMAIL_FROM,
        pass: process.env.SMTP_PASS,
    }
});

export const remoteFeedbackRouter = express.Router();

remoteFeedbackRouter.post("/send-email", async (req: Request, res: Response) => {
    try {
        const data = req.body;
        const wasThisPageHelpful = sanitizeHtml(data.was_this_page_helpful);
        let emailOption = '';
        let emailComment = '';

        if (wasThisPageHelpful === 'Yes') {
            emailOption = 'How did this page help you?';
            emailComment = sanitizeHtml(data.how_did_this_page_help_you);
        } else {
            emailOption = 'How can we improve this page?';
            emailComment = sanitizeHtml(data.how_can_we_improve_this_page);
        }

        const pageUrl = data.current_page_url ?  data.current_page_url : '';
        let domain = data.domain ?  data.domain : '';
        domain = domain.replace(/\/.*$/, "");
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

        const html = ejs.render(emailTemplate, emailData);

        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: domain ? (process.env[domain] ?  process.env[domain] : process.env.EMAIL_DEFAULT) : process.env.EMAIL_DEFAULT,
            subject: process.env.EMAIL_SUBJECT,
            html: html
        };

        const info = await transporter.sendMail(mailOptions);

        res.send({ status: 200, data: 'Sent' });
    } catch (error) {
        console.log('Error sending email:', error);
        res.status(400).send({ status: 400, message: 'Request could not be processed' });
    }
});
