import express, { Request, Response } from "express";
import { body, param } from "express-validator";
import * as dotenv from "dotenv";
import nodemailer from "nodemailer";


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
        //Content from client
        let feedbackContentSubject = sanitizeHtml(req.body.emailSubject);
        let feedbackFormContent = sanitizeHtml(req.body.emailBody);
        let emailDate = new Date();;
        let pageUrl = sanitizeHtml(req.body.pageUrl)

        const bodyContentFormatted =
            `<p><strong>Submited on:</strong> ${emailDate.toLocaleString()}</p>
        <p><strong>${feedbackContentSubject} :</strong> ${feedbackFormContent}</p> 
        <p<strong>URL:</strong> <a href="${pageUrl}">${pageUrl}</a></p>`;

        const sanitizedBody = sanitizeHtml(bodyContentFormatted)
        const emailHost = process.env.SMTP_SERVER;
        const emailPort: string = process.env.SMTP_PORT!;
        const emailFrom = process.env.EMAIL_FROM;
        const nameFrom = process.env.NAME_FROM;
        const subject = process.env.EMAIL_SUBJECT;
        const selfSignedConfig = {
            host: emailHost,
            port: parseInt(emailPort)
        };
        var transporter = nodemailer.createTransport(selfSignedConfig);
        const info = await transporter.sendMail({
            from: nameFrom + ' ' + emailFrom,
            to: process.env.EMAIL_TO,
            subject: subject,
            html: sanitizedBody,
        });
        res.send({ data: 'Sent' });
    } catch (error) {
        console.log(error);
    }
});
