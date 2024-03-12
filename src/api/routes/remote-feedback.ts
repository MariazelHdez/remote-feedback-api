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

        // Validate input data
        if (!data.domain || !data.was_this_page_helpful || !data.submission_timestamp || !data.current_page_url) {
            return res.status(400).send({ status: 400, message: 'Missing required fields' });
        }

        const wasThisPageHelpful = sanitizeHtml(data.was_this_page_helpful);
        const emailOption = wasThisPageHelpful === 'Yes' ? 'How did this page help you?' : 'How can we improve this page?';
        const emailComment = sanitizeHtml(wasThisPageHelpful === 'Yes' ? data.how_did_this_page_help_you : data.how_can_we_improve_this_page);


        const pageUrl = data.current_page_url || '';
        const domain = (data.domain || '').replace(/\/.*$/, "");

        const submissionTimestamp = new Date(data.submission_timestamp);
        submissionTimestamp.setUTCHours(submissionTimestamp.getUTCHours() - 7);

        const options: Intl.DateTimeFormatOptions = { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric', 
            hour: 'numeric', 
            minute: 'numeric', 
            hour12: true, 
            timeZone: 'America/Whitehorse' 
        };

        const formattedTimestamp = submissionTimestamp.toLocaleString('en-US', options);

        let langcode = data.langcode || 'English';
        
        switch (langcode) {
            case 'en':
                langcode = 'English';
                break;
            case 'fr':
                langcode = 'French';
                break;
            default:
                langcode = 'English';
                break;
        }

        const emailData = {
            submittedOn: formattedTimestamp,
            site: domain,
            lang: langcode,
            emailLabel: emailOption,
            emailContent: emailComment,
            urlFrom: pageUrl
        };

        const html = ejs.render(emailTemplate, emailData);
        const recipientEmail = domain && process.env[domain] ? process.env[domain] : process.env.EMAIL_DEFAULT;

        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: recipientEmail,
            subject: process.env.EMAIL_SUBJECT,
            html: html
        };

        const info = await transporter.sendMail(mailOptions);

        res.send({ status: 200, data: 'Feedback sent' });
    } catch (error) {
        console.log('Error sending email:', error);
        res.status(400).send({ status: 400, message: 'Request could not be processed' });
    }
});
