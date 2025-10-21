const FooterStaticPage = require("../models/footerStaticPage");

exports.create_ = async (req, res) => {
  try {
    const { detail, faqs, type } = req.body;

    if (!type) {
      return res.status(400).json({ success: false, message: "Type is required." });
    }

    if (type === 'faqs') {
      // Count the number of existing FAQs to determine the next `orderIndex`
      const orderIndex = await FooterStaticPage.countDocuments({ type });

      // Create a new FAQ entry with the incremented `orderIndex`
      const staticPage = new FooterStaticPage({
        faqs,
        type,
        orderIndex: orderIndex + 1,
      });

      await staticPage.save();

      return res.status(200).json({
        success: true,
        message: `${type} created successfully.`,
        staticPage,
      });
    }

    // For other types, update or create the document
    const staticPage = await FooterStaticPage.findOneAndUpdate(
      { type },
      { detail, faqs, type },
      {
        new: true,      // Return the updated document
        upsert: true,   // Create a new document if none exists
        setDefaultsOnInsert: true, // Apply default values if a new document is created
      }
    );

    const message = staticPage.isNew
      ? `${type} created successfully.`
      : `${type} updated successfully.`;

    res.status(200).json({
      success: true,
      message,
      staticPage,
    });
  } catch (error) {
    console.error("Error in create_:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.updateIndexOrder = async (req, res) => {
  try {
    const { staticPageData } = req.body;

    if (!Array.isArray(staticPageData)) {
      return res.status(400).json({ success: false, message: "Invalid data format." });
    }

    // Update each item in the database
    for (const item of staticPageData) {
      await FooterStaticPage.findByIdAndUpdate(
        item._id,
        { orderIndex: item.orderIndex },
        { new: true }
      );
    }

    res.status(200).json({
      success: true,
      message: "Order updated successfully.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.edit_ = async (req, res) => {
  try {
    const {
      detail, faqs, type,
    } = req.body;
    const staticPageId = req.params.id;

    let updateFields = Object.fromEntries(
      Object.entries({
        detail, faqs, type
      }).filter(([key, value]) => value !== undefined)
    );

    // Check if there are any fields to update
    if (Object.keys(updateFields).length === 0) {
      return res
        .status(400)
        .send({
          success: false,
          message: "No valid fields provided for update.",
        });
    }

    const staticPage = await FooterStaticPage.findOneAndUpdate(
      { _id: staticPageId },
      updateFields,
      { new: true }
    );

    if (!staticPage)
      return res
        .status(404)
        .send({
          success: false,
          message: `The ${type} with the given ID was not found.`,
        });

    res.send({
      success: true,
      message: `${type} updated successfully`,
      staticPage: staticPage,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal server error", error: error.message });
  }
};
exports.getAll = async (req, res) => {
  let query = {};
  const validStatus = ['faqs', 'terms-condition']
  if (!validStatus.includes(req.params.type)) {
    return res.status(400).json({ message: 'Invalid Status' })
  }
  query.type = req.params.type

  const staticPage = req.params.type == 'faqs' ? await FooterStaticPage.find(query).sort({ orderIndex: 1 }) : await FooterStaticPage.findOne(query).sort({ _id: -1 })
  res.send({
    success: staticPage?.length > 0 ? true : !!staticPage,
    staticPage: staticPage,
  });
};
exports.getAdmin = async (req, res) => {

  let query = {};
  const validStatus = ['faqs', 'terms-condition']
  if (!validStatus.includes(req.params.type)) {
    return res.status(400).json({ message: 'Invalid Status' })
  }
  query.type = req.params.type
  const staticPage = req.params.type == 'faqs' ? await FooterStaticPage.find(query).sort({ orderIndex: 1 }) : await FooterStaticPage.findOne(query).sort({ _id: -1 })
  res.send({
    success: staticPage?.length > 0 ? true : !!staticPage,
    staticPage: staticPage,
  });
};
exports.getById = async (req, res) => {
  const id = req.params.id
  let query = {};

  query._id = id

  const staticPage = await FooterStaticPage.findOne(query).sort({ _id: -1 })
  res.send({
    success: !!staticPage,
    staticPage: staticPage,
  });
};
exports.delete_ = async (req, res) => {
  try {
    const postId = req.params.id;

    const deletedFooterStaticPage = await FooterStaticPage.findOneAndDelete({ _id: postId });

    if (!deletedFooterStaticPage) {
      return res
        .status(404)
        .json({
          message:
            "Footer Static Page not found or user does not have permission to delete it",
        });
    }

    res.status(200).json({ success: true, message: "Footer Static Page deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};
