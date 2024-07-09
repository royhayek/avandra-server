const User = require("../models/User");
const Message = require("../models/Message");

const { sendEmail } = require("../helpers");
const methods = require("./crudController");
module.exports = methods.crudController(require("../models/Message"));

module.exports.sendMessage = async (req, res) => {
  try {
    // Creating a new document in the collection
    const { user: userId, type, message } = req.body;

    const result = await new Message(req.body).save();

    const user = await User.findById(userId);

    await sendEmail({
      from: {
        name: user?.name,
        address: "no-reply@avandraapp.com",
      },
      to: "no-reply@avandraapp.com",
      subject: `${type} from ${user?.name}`,
      html: `Hello, you just received a ${type} from ${user?.name}!\n\n<p>Here is its content:</p>\n<p>${message}</p>\n\nReply to this email: <b>${user?.email}</b>`,
      replyTo: user?.email,
    });

    // Returning a successful response
    return res.status(200).json({
      success: true,
      result,
      message: `Message sent successfully, we will reply to you as soon as possible`,
    });
  } catch (err) {
    console.debug("err", err);
    // If an error is thrown by Mongoose due to required validations
    if (err.name == "ValidationError") {
      return res.status(400).json({
        success: false,
        data: null,
        error: err,
        message: "Required fields are not supplied",
      });
    } else {
      // Server Error
      return res.status(500).json({
        success: false,
        data: null,
        message: "Oops, there is an error",
      });
    }
  }
};
