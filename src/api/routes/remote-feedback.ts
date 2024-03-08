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
const config_var= process.env;

remoteFeedbackRouter.post("/feedbackForm", async (req: Request, res: Response) => {
    try {

         //Content from remote feedback webform
         let  data = req.body;
         let wasThisPageHelpful = sanitizeHtml( data.was_this_page_helpful);
         var emailOption = '';
         let emailComment = '';
	 let emailVariable = data.email_variable; 
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
        const emailHost = config_var.SMTP_SERVER;
        const emailPort: string = config_var.SMTP_PORT!;
        const emailFrom = config_var.EMAIL_FROM;
        const nameFrom = config_var.NAME_FROM;
        const subject = config_var.EMAIL_SUBJECT;

	
        let emailTo = config_var.EMAIL_DEFAULT;
	if(config_var[emailVariable]){
		emailTo = config_var[emailVariable];
	}



	const emailPass = config_var.SMTP_PASS;
        const selfSignedConfig = {
            host: emailHost,
            port: parseInt(emailPort),
	    requireTLS: false,
            secure: false,
            auth: {
                user: emailFrom,
                pass: emailPass,
            }
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
		 res.send( {
        	    status: 400,
                     message: 'Request could not be processed'
	        });

            } else {
                res.send({ data: 'Sent' });
            }
        });





    } catch (error) {
        console.log(error);
    }
});

