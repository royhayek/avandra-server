const nodemailer = require("nodemailer");
const Settings = require("../models/Settings");

// Utility function to generate population options based on model schema
const generatePopulationOptions = (model) => {
  const paths = model.schema.paths;
  let populationOptions = [];

  Object.keys(paths).forEach((path) => {
    // Check if the path ends with 'Id' and is an ObjectId type
    if (paths[path].instance === "ObjectId" && path !== "_id") {
      const refModelName = path.replace(/Id$/, "");
      const capitalizedModelName = refModelName.charAt(0).toUpperCase() + refModelName.slice(1);
      populationOptions.push({ path: path, model: capitalizedModelName });
    }
  });

  return populationOptions;
};

const getMailerTransport = async () => {
  try {
    // Retrieve settings from MongoDB
    const settings = await Settings.findOne();
    if (!settings) throw new Error("SMTP settings not found");
    const { host, port, secure, username, password, fromEmail } = settings?.smtp || {};

    // Create and return a Nodemailer transporter using fetched settings
    return nodemailer.createTransport({
      host: host,
      port: port,
      secure: secure, // true for 465, false for other ports
      auth: {
        user: username,
        pass: password,
      },
      from: fromEmail,
    });
  } catch (error) {
    console.error("Error retrieving mail settings:", error);
    throw error;
  }
};

const sendEmail = async ({ from, to, subject, text, html }) => {
  const transporter = await getMailerTransport();

  const mailOptions = {
    from: from, // Sender address
    to: to, // List of recipients
    subject: subject,
    text: text,
    html: html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Failed to send email:", error);
    throw error; // Or handle error as needed
  }
};

module.exports = {
  generatePopulationOptions,
  sendEmail,
};
