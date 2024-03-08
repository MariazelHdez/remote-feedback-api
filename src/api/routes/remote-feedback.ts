import express, { Request, Response } from "express";
import { body, param } from "express-validator";
import * as dotenv from "dotenv";
import nodemailer from "nodemailer";

const ejs = require('ejs');
const fs = require('fs');
const sanitizeHtml = require('sanitize-html');

let path;
switch (process.env.NODE_ENV) {
    case "test":
      path = `.env.test`;
      break;
    case "production":
      path = `.env`;
      break;
    default:
      path = `.env.development`;
  }
dotenv.config({ path: path });

export const remoteFeedbackRouter = express.Router();


remoteFeedbackRouter.post("/feedbackForm", async (req: Request, res: Response) => {
    try {

         //Content from remote feedback webform
         let  data = req.body;
         let wasThisPageHelpful = sanitizeHtml( data.was_this_page_helpful);
         var emailOption = '';
         let emailComment = '';
         if (wasThisPageHelpful === 'Yes') {
             emailOption = 'How did this page help you?';
             emailComment =  sanitizeHtml(data.how_did_this_page_help_you);
         } else{
             emailOption = 'How can we improve this page?';
             emailComment =  sanitizeHtml(data.how_can_we_improve_this_page);
        } 

        //Content from client
        let pageUrl = data.current_page_url;
        let domain = data.domain;
        let submission_timestamp = data.submission_timestamp;
        let langcode = data.langcode;


        // Load the content of the HTML template
        const emailTemplate = fs.readFileSync('./template/feedbackEmail.ejs', 'utf-8');


        // Data to personalize the email
        const emailData = {
            submitedOn: submission_timestamp,
            site : domain,
            lang: langcode,
            emailLabel: emailOption,
            emailContent: emailComment,
            urlFrom : pageUrl
        };

        // Render the HTML template using EJS
        const html = ejs.render(emailTemplate, emailData);
        const emailHost = process.env.SMTP_SERVER;
        const emailPort: string = process.env.SMTP_PORT!;
        const emailFrom = process.env.EMAIL_FROM;
        const nameFrom = process.env.NAME_FROM;
        const subject = process.env.EMAIL_SUBJECT;
        const emailTo = process.env.EMAIL_TO;
        const selfSignedConfig = {
            host: emailHost,
            port: parseInt(emailPort)
        };
        var transporter = nodemailer.createTransport(selfSignedConfig);

        // Configure the email
        const mailOptions = {
            from: emailFrom,
            to: emailTo,
            subject: subject,
            html: html
        };

        const info = await transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log('Error sending email:', error);
            } else {
                res.send({ data: 'Sent' });
            }
        });





    } catch (error) {
        console.log(error);
    }
});

