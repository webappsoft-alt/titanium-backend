const Support = require("../models/Support");
const sendEncryptedResponse = require("../utils/sendEncryptedResponse");
// const { sendNotification } = require("./notificationCreateService");

exports.create = async (req, res) => {
  try {
    const { name, email, company, msg } = req.body;

    const support = new Support({
      // user:userId,
      name,
      email, company,
      msg
    });

    await support.save();

    sendEncryptedResponse(res, { success: true, message: 'Message has sent successfully', });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.getAdminnotifications = async (req, res) => {
  const lastId = parseInt(req.params.id) || 1;

  // Check if lastId is a valid number
  if (isNaN(lastId) || lastId < 0) {
    return res.status(400).json({ error: 'Invalid last_id' });
  }

  let query = {};
  if (req.params.search) {
    query.name = { $regex: new RegExp(req.params.search, 'i') };
  }

  const pageSize = 10;

  const skip = Math.max(0, (lastId - 1)) * pageSize;
  try {
    const categories = await Support.find(query)
      .skip(skip).sort({ _id: -1 })
      .limit(pageSize)
      .lean();

    const totalCount = await Support.find(query);
    const totalPages = Math.ceil(totalCount.length / pageSize);

    if (categories.length > 0) {
      sendEncryptedResponse(res, { success: true, support: categories, count: { totalPage: totalPages, currentPageSize: categories.length } });
    } else {
      sendEncryptedResponse(res, { success: false, message: 'No more support found', support: categories, count: { totalPage: totalPages, currentPageSize: 0 } });
    }
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
};


exports.attendTheSupport = async (req, res) => {
  try {
    const serviceId = req.params.id;
    const service = await Support.findOneAndUpdate(
      { _id: serviceId },
      {
        attended: true,
      },
      { new: true }
    )

    if (service == null) {
      return res.status(404).json({ message: 'Support not found' });
    }

    // await sendNotification({
    //   user: userId,
    //   to_id: service.user._id,
    //   description: description,
    //   type: "support",
    //   title: title,
    //   fcmtoken: service.user.fcmtoken,
    // });

    sendEncryptedResponse(res, { message: `Support Attended successfully`, service: service, success: true });

  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

