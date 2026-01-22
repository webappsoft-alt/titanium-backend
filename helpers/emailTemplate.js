const moment = require("moment/moment");
const header = () => (`<div style="">
                      <img src="http://cdn.mcauto-images-production.sendgrid.net/dfd94235f1718d83/e69b2833-f1f9-4aa1-9805-6173d9b57e5b/685x128.png" alt="Company Logo" style="max-width: 100%; margin-bottom: 5px;">
                  </div>
                <h1 style="color: #003366; margin-bottom: 0px; margin-top: 10px; " >Welcome to Titanium Industries</h1>
                <h2 style="color: #003366; margin-bottom: 0px; margin-top: 10px; ">Global Metal Supply & Distribution Company</h2>
                  `)
const header2 = () => (`<div style="">
                      <img src="http://cdn.mcauto-images-production.sendgrid.net/dfd94235f1718d83/e69b2833-f1f9-4aa1-9805-6173d9b57e5b/685x128.png" alt="Company Logo" style="max-width: 100%; margin-bottom: 5px;">
                  </div>
                  `)
function footer() {
    return `
            <hr>
            <!-- Call to Action -->
            <p style="margin: 10px 0;"><a href="https://www.titanium.com" style="font-weight: bold; color: #007BFF; text-decoration: none;">Click here to visit our site.</a></p>
            <p style="margin: 10px 0;"><a href="https://shop.titanium.com/shop/discounted_products" style="font-weight: bold; color: #007BFF; text-decoration: none;">Shop our discounted products.</a></p>
        
            <!-- Navigation links -->
            <p style="margin: 10px 0;">
              <a href="https://www.titanium.com/contact-us" style="color: #007BFF; text-decoration: none;">Contact Us</a>
              |
              <a href="https://titanium.com/shop/quick-quote" style="color: #007BFF; text-decoration: none;">Create Quote</a>
              |
              <a href="https://www.titanium.com/submit-rfq" style="color: #007BFF; text-decoration: none;">Submit RFQ</a>
              |
              <a href="https://titanium.com/titanium-about-us/terms-conditions/" style="color: #007BFF; text-decoration: none;">Terms and Conditions</a>
            </p>
        
            <!-- Contact information -->
            <p style="margin: 10px 0;">Call Toll Free: <strong>1-888-482-6486</strong> | <a href="mailto:sales@titanium.com" style="color: #007BFF; text-decoration: none;">sales@titanium.com</a></p>
        
            <!-- FAQs link -->
            <p style="margin: 10px 0;">Questions? <a href="https://www.titanium.com/faq" style="color: #007BFF; text-decoration: none;">See our FAQ’s</a></p>
        
            <!-- Social media follow links -->
            <p style="margin: 10px 0;">Follow us on social media:</p>
            <div>
              <a href="https://www.facebook.com/Titanium-Industries-119077081500702/?fref=ts" style="display: inline-block;">
                <img src="http://cdn.mcauto-images-production.sendgrid.net/dfd94235f1718d83/b67e463f-fd21-4745-9581-f8ade7b46600/55x52.png" alt="Facebook" style="max-width: 100%; height: auto; width: 32px; margin-right: 10px;">
              </a>
              <a href="https://www.instagram.com/titaniumindustries/" style="display: inline-block;">
                <img src="http://cdn.mcauto-images-production.sendgrid.net/dfd94235f1718d83/73414fea-f20a-45d3-832b-afcd8f03bdfb/51x52.png" alt="Instagram" style="max-width: 100%; height: auto; width: 32px; margin-right: 10px;">
              </a>
              <a href="https://x.com/TI_Industries" style="display: inline-block;">
                <img src="http://cdn.mcauto-images-production.sendgrid.net/dfd94235f1718d83/8cc92a5b-d686-4e03-b84e-60b6bf40d432/49x52.png" alt="Twitter" style="max-width: 100%; height: auto; width: 32px; margin-right: 10px;">
              </a>
              <a href="https://www.linkedin.com/company/titanium-industries-inc-?trk=top_nav_home" style="display: inline-block;">
                <img src="http://cdn.mcauto-images-production.sendgrid.net/dfd94235f1718d83/57414d56-2f3b-47d7-8c3a-5a4ec60f742f/50x52.png" alt="LinkedIn" style="max-width: 100%; height: auto; width: 32px; margin-right: 10px;">
              </a>
              <a href="https://www.youtube.com/@TitaniumIndustries" style="display: inline-block;">
                <img src="http://cdn.mcauto-images-production.sendgrid.net/dfd94235f1718d83/67ffafd7-59f4-4342-bfb8-8fe6754fc694/50x52.png" alt="YouTube" style="max-width: 100%; height: auto; width: 32px; margin-right: 10px;">
              </a>
            </div>
        `;
}

function Styles() {
    return `
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }

        .container {
            width: 100%;
            max-width: 600px;
            margin: 0 auto;
            background-color: #fff;
            padding: 20px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        img {
            max-width: 100%;
            height: auto;
        }

        h1,
        h2,
        h3 {
            color: #003366;
            /* Navy Blue */
            margin-top: 10px;
        }

        p {
            margin: 10px 0;
        }

        a {
            color: #007BFF;
            text-decoration: none;
        }

        .social-icons img {
            width: 32px;
            margin-right: 10px;
        }

        .social-icons a {
            display: inline-block;
        }

        @media screen and (max-width: 600px) {
            .container {
                padding: 15px;
            }

            h1,
            h2,
            h3 {
                font-size: 1.2rem;
            }
        }
   `
}

const generateEmailTemplate = (templateType, data) => {
    switch (templateType) {
        case "sales-order":
            return `
                <html>
                 <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Welcome to Titanium Industries</title>
                    <style>${Styles()}</style>
                </head>
               <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4;">
               <div class="container">
                   ${header2()}
                    <h1>Your quote is ready.</h1>
                    <p>Please see the attached pdf for further details.</p>
                    <h3>We look forward to working with you and appreciate your business!</h3>
                    ${footer()}
                </div>          
                </body>
                </html>`;
        case "open-quote":
            return `
                <html>
                 <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Welcome to Titanium Industries</title>
                    <style>${Styles()}</style>
                </head>
               <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4;">
               <div class="container">
                   ${header2()}
                    <h1>You Have An Open Quote</h1>
                    <p>Please see the attached open quote and proceed to finalize your quote with further details. </p>
                    <h3>We look forward to working with you and appreciate your business!</h3>
                    ${footer()}
                </div>          
                </body>
                </html>`;

        case "sales-order-prev":
            return `
                <html>
                <body style="font-family: Arial, sans-serif;">
                   ${header()}
                    <p>Hi,</p>
                    <p>A customer has completed their Sales Order on ${moment(data?.createdAt).format('lll')}.</p>
                    <p>Please refer to the information below and the attached invoice .pdf for further details.</p>
                    <p><strong>Quote #:</strong> ${data?.quoteNo}<br>
                    <strong>Company:</strong> ${data?.company || ''}<br>
                    <strong>Name:</strong> ${data?.fname} ${data?.lname || ''}<br>
                    <strong>Email:</strong> ${data?.email}<br>
                    <strong>Phone:</strong> ${data?.phone || ''}<br>
                    <strong>Country:</strong> ${data?.country || ''}<br>
                    <strong>State:</strong> ${data?.state || ''}</p>
                    <p>Regards,<br>Your Sales Team</p>
                </body>
                </html>`;

        case "new-open-quotation":
            return `
                    <html>
                     <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>New Web Quote Generated - ${data?.company || data?.user?.company || 'N/A'} - Quote #$${data?.quoteNo}</title>
                    <style>${Styles()}</style>
                </head>
               <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4;">
               <div class="container">
                       <p class="greeting" style="margin-top: 0; margin-bottom: 10px;">
                            <strong>Hi, a new Web Quote has been generated on ${moment(data?.createdAt).format('lll')}</strong>
                        </p>
    
                        <p style="margin-top: 0; margin-bottom: 10px;">
                            Please refer to the information below and the attached Quote for further details.
                        </p>
                        <p>
                            <strong>Quote #:</strong> ${data?.quoteNo}<br>
                            <strong>Company:</strong> ${data?.company || data?.user?.company || 'N/A'}<br>
                            <strong>Customer Name:</strong> ${data?.fname} ${data?.lname || ''}<br>
                            <strong>Email:</strong> ${data?.email}<br>
                            <strong>Phone:</strong> ${data?.billing?.phone || data?.shipping?.phone || data?.phone || 'N/A'}<br>
                            <strong>Country:</strong> ${data?.country || data?.billing?.country || data?.shipping?.country || 'N/A'}<br>
                            <strong>State:</strong> ${data?.state || data?.billing?.state || data?.shipping?.state || 'N/A'}
                        </p>
                        </div>
                    </body>
                    </html>`;
        case "new-quotation":
            return `
                    <html>
                     <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>New Sales Order - ${data?.company || 'N/A'} - Quote #$${data?.quoteNo}</title>
                    <style>${Styles()}</style>
                </head>
               <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4;">
               <div class="container">
                       <p class="greeting" style="margin-top: 0; margin-bottom: 10px;">
                            <strong>Hi, a customer has completed their Sales Order on ${moment(data?.createdAt).format('lll')}</strong>
                        </p>
    
                        <p style="margin-top: 0; margin-bottom: 10px;">
                            Please refer to the information below and the attached invoice .pdf for further details.
                        </p>
                        <p>
                            <strong>Quote #:</strong> ${data?.quoteNo}<br>
                            <strong>Company:</strong> ${data?.company || 'N/A'}<br>
                            <strong>Customer Name:</strong> ${data?.fname} ${data?.lname || ''}<br>
                            <strong>Email:</strong> ${data?.email}<br>
                            <strong>Phone:</strong> ${data?.billing?.phone || data?.shipping?.phone || data?.phone || 'N/A'}<br>
                            <strong>Country:</strong> ${data?.country || data?.billing?.country || data?.shipping?.country || 'N/A'}<br>
                            <strong>State:</strong> ${data?.state || data?.billing?.state || data?.shipping?.state || 'N/A'}
                        </p>
                        </div>
                    </body>
                    </html>`;

        case "pending-user":
            return `
                <html>
                  <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>New Pending "T.I. Quick Quote App Account"</title>
                    <style>${Styles()}</style>
                </head>
               <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4;">
               <div class="container">
                   ${header()}
                    <p>Hi, a new user was created and they need an Admins approval before they can create a Quote</p>
                    <p><strong>Company:</strong> ${data?.company || ''}<br>
                    <strong>Name:</strong> ${data?.fname} ${data?.lname || ''}<br>
                    <strong>Email:</strong> ${data?.email}<br>
                    <strong>Phone:</strong> ${data?.phone || ''}<br>
                    <strong>Country:</strong> ${data?.country || ''}<br>
                    <strong>State:</strong> ${data?.state || ''}</p>
                <br>
                <a href="https://qqa.titanium.com/dashboard/customers/edit/${data?._id}">Link to User</a>
               </div>
                </body>
                </html>`;

        case "user-deactivated":
            return `
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Your account has been deactivated! Titanium Industries</title>
                    <style>${Styles()}</style>
                </head>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4;">
               <div class="container">
                        ${header2()}
                        <p>Hi ${data?.fname || ''},</p>
                        <p>We wanted to let you know that your account associated with the email <strong>${data?.email}</strong> has been <strong>deactivated</strong> by an administrator.</p>
                        <p>You will no longer be able to log in or perform any actions within the platform.</p>
                        <p>If you believe this was done in error or you would like to request access again, please contact our support or your administrator directly.</p>
                        <p>Thank you,<br>Your Support Team</p>
                         ${footer()}
                        </div>
                      </body>
                      </html>`;

        case "quote-sales":
            return `
                <html>
                <body style="font-family: Arial, sans-serif;">
                   ${header2()}
                    <p>Hi, a new Web Quote has been generated on ${moment(data?.createdAt).format('lll')}.</p>
                    <p>Please refer to the information below and the attached Quote for further details.</p>
                    <p><strong>Quote #:</strong> ${data?.quoteNo}<br>
                    <strong>Company:</strong> ${data?.company || ''}<br>
                    <strong>Name:</strong> ${data?.fname} ${data?.lname || ''}<br>
                    <strong>Email:</strong> ${data?.email}<br>
                    <strong>Phone:</strong> ${data?.phone || ''}<br>
                    <strong>Country:</strong> ${data?.country || ''}<br>
                    <strong>State:</strong> ${data?.state || ''}</p>
                </body>
                </html>`;

        case "customer-quote":
            return `
                <html>
                 <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Customer Quotation, Titanium Industries</title>
                    <style>${Styles()}</style>
                </head>
               <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4;">
               <div class="container">
                   ${header2()}
                    <p>Your quote is ready.</p>
                    <p>Please see the attached pdf for further details.</p>
                    <p>We look forward to working with you and appreciate your business!</p>
                    <p><a href="https://qqa.titanium.com/">Click here to visit our site.</a></p>
                       ${footer()}
                    </div>
                </body>
                </html>`;

        case "account-approved":
            return `
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Welcome to Titanium Industries</title>
                    <style>${Styles()}</style>
                </head>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4;">
               <div class="container">
                    ${header()}    
                    <p style="margin: 10px 0;">Thank you for requesting access to our Quick Quote App.</p>
                    <p style="margin: 10px 0;">Your application is currently pending; you will receive a welcome letter once approved.</p>
                    <h3 style="color: #003366; margin-top: 10px;">We look forward to working with you and appreciate your business!</h3>
                    ${footer()}
                </div>
                </body>
                </html>`;

        case "user-registration":
            return `
                <html>
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Welcome to Titanium Industries</title>
                    <style>${Styles()}</style>
                </head>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4;">
               <div class="container">
                    ${header()}    
                    <p>Your application is currently pending; you will receive a welcome letter once approved.</p>
                    <h3>We look forward to working with you and appreciate your business!</h3>
                    ${footer()}
                </div>
                </body>
                </html>`;

        case "password-change":
            return `
                <html>
                 <head>
                        <meta charset="UTF-8">
                        <meta http-equiv="X-UA-Compatible" content="IE=edge">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Titanium Industries - Password Changed</title>
                        <style>
                            body {
                                font-family: Arial, sans-serif;
                                background-color: #f9f9f9;
                                color: #333;
                                margin: 0;
                                padding: 0;
                            }
                            .container {
                                max-width: 600px;
                                margin: 10px auto;
                                background-color: #fff;
                                border-radius: 10px;
                                box-shadow: 0 0 10px rgba(0,0,0,0.1);
                                overflow: hidden;
                            }
                            .header {
                                background-color: #03405b;
                                padding: 12px 16px;
                                color: white;
                                text-align: center;
                                border-radius: 0.5rem;
                                color: white;
                                font-size: 24px;
                                font-weight: bold;
                            }
                            .content {
                                padding: 12px;
                                font-size: 16px;
                                line-height: 1.6;
                            }
                            .button {
                                display: block;
                                width: fit-content;
                                margin: 20px auto;
                                padding: 12px 20px;
                                background-color: #03405b;
                                color: #ffffff !important;
                                text-decoration: none;
                                border-radius: 0.5rem;
                                font-weight: bold;
                                text-align: center;
                            }
                            .button:hover {
                                background-color: #011f2d;
                            }
                            .footer {
                                margin-top: 20px;
                                padding: 10px;
                                font-size: 12px;
                                text-align: center;
                                color: #777;
                                background-color: #f1f1f1;
                            }
                            .logo {
                                padding: 15px 12px;
                                text-align: center;
                            }
                            .logo img {
                                height: 50px;
                                object-fit: contain;
                            }
                            ${Styles()}
                        </style>
                    </head>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4;">
                   <div class="content">
                        <p>Dear ${data?.fname} ${data?.lname || ""},</p>
                        <p>Your password was changed.</p>
                        <p><a href="${data?.siteLink}">Click to visit ${data?.websiteName || ''}</a></p>
                    </div>
                </body>
                </html>`;

        case 'reset-password':
            return `<!DOCTYPE html>
                    <html lang="en">
                    <head>
                        <meta charset="UTF-8">
                        <meta http-equiv="X-UA-Compatible" content="IE=edge">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Titanium Industries - Password Reset</title>
                        <style>
                            body {
                                font-family: Arial, sans-serif;
                                background-color: #f9f9f9;
                                color: #333;
                                margin: 0;
                                padding: 0;
                            }
                            .container {
                                max-width: 600px;
                                margin: 10px auto;
                                background-color: #fff;
                                border-radius: 10px;
                                box-shadow: 0 0 10px rgba(0,0,0,0.1);
                                overflow: hidden;
                            }
                            .header {
                                background-color: #03405b;
                                padding: 12px 16px;
                                color: white;
                                text-align: center;
                                border-radius: 0.5rem;
                                color: white;
                                font-size: 24px;
                                font-weight: bold;
                            }
                            .content {
                                padding: 12px;
                                font-size: 16px;
                                line-height: 1.6;
                            }
                            .button {
                                display: block;
                                width: fit-content;
                                margin: 20px auto;
                                padding: 12px 20px;
                                background-color: #03405b;
                                color: #ffffff !important;
                                text-decoration: none;
                                border-radius: 0.5rem;
                                font-weight: bold;
                                text-align: center;
                            }
                            .button:hover {
                                background-color: #011f2d;
                            }
                            .footer {
                                margin-top: 20px;
                                padding: 10px;
                                font-size: 12px;
                                text-align: center;
                                color: #777;
                                background-color: #f1f1f1;
                            }
                            .logo {
                                padding: 15px 12px;
                                text-align: center;
                            }
                            .logo img {
                                height: 50px;
                                object-fit: contain;
                            }
                        </style>
                    </head>
                    <body>
                    <div class="container">
                        ${header2()}
                        <div class="header">
                        Reset Your Password
                        </div>
                        <div class="content">
                        <p>Hi ${data?.fname} ${data?.lname || ""},</p>
                        <p>We received a request to reset your password for <strong>${data?.websiteName}</strong>.</p>
                        <p>To create a new password, click the button below:</p>
                        <a class="button" target="_blank" href="${data?.resetLink}">Create New Password</a>
                        <p>This link will expire soon for security reasons. If you didn't request a password reset, you can safely ignore this email — your account will remain secure.</p>
                        <p>Need help? Our support team is here for you anytime.</p>
                        ${footer()}
                        </div>
                    </div>
                    </body>
                    </html>
                    `;

        case "email-change":
            return `
                <html>
                <body style="font-family: Arial, sans-serif;">
                    <p>Your email was changed.</p>
                    <p><a href="${data?.siteLink}">Click to visit ${data?.company || ''}</a></p>
                </body>
                </html>`;

        default:
            return "No details available for this template.";
    }
};

module.exports = { generateEmailTemplate };