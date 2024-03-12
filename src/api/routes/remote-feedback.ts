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
// Define the route for sending feedback emails
remoteFeedbackRouter.post("/send-email", async (req: Request, res: Response) => {
    try {
         // Get the data from the request body
        const data = req.body;

        // Validate the input data
        // If any required field is missing, return a 400 status code with an error message
        if (!data.domain || !data.was_this_page_helpful || !data.submission_timestamp || !data.current_page_url) {
            return res.status(400).send({ status: 400, message: 'Missing required fields' });
        }

        // Sanitize the 'was_this_page_helpful' field and determine the email option and comment based on its value
        const wasThisPageHelpful = sanitizeHtml(data.was_this_page_helpful);
        const emailOption = wasThisPageHelpful === 'Yes' ? 'How did this page help you?' : 'How can we improve this page?';
        const emailComment = sanitizeHtml(wasThisPageHelpful === 'Yes' ? data.how_did_this_page_help_you : data.how_can_we_improve_this_page);

        // Get the page URL and domain from the data, or use default values if they are not provided
        const pageUrl = data.current_page_url || '';
        const domain = (data.domain || '').replace(/\/.*$/, "");

        // Convert the submission timestamp to a Date object and adjust the time zone
        const submissionTimestamp = new Date(data.submission_timestamp);
        submissionTimestamp.setUTCHours(submissionTimestamp.getUTCHours() - 7);
        // Define the options for formatting the timestamp
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
        // Format the timestamp
        const formattedTimestamp = submissionTimestamp.toLocaleString('en-US', options);

        // Get the language code from the data, or use 'English' as the default
        let langcode = data.langcode || 'English';
        // Convert the language code to a full language name
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

        // Prepare the data for the email template
        const emailData = {
            submittedOn: formattedTimestamp,
            site: domain,
            lang: langcode,
            emailLabel: emailOption,
            emailContent: emailComment,
            urlFrom: pageUrl
        };
        // Render the email template with the data
        const html = ejs.render(emailTemplate, emailData);

        // Determine the recipient of the email based on the domain
        const recipientEmail = domain && process.env[domain] ? process.env[domain] : process.env.EMAIL_DEFAULT;

        if (!recipientEmail) {
            return res.status(400).send({ status: 400, message: 'Recipient email not found' });
        }
        // Prepare the email options
        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: recipientEmail,
            subject: process.env.EMAIL_SUBJECT,
            html: html
        };

        // Send the email
        const info = await transporter.sendMail(mailOptions);

        // If the email was sent successfully, return a 200 status code with a success message
        res.send({ status: 200, data: 'Feedback sent' });
    } catch (error) {
        // If there was an error, log it and return a 400 status code with an error message
        console.log('Error sending email:', error);
        res.status(400).send({ status: 400, message: 'Request could not be processed' });
    }
});
