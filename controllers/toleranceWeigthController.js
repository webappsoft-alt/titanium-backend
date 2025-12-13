const ToleranceWeigth = require('../models/toleranceWeigthCal');
const sendEncryptedResponse = require('../utils/sendEncryptedResponse');

exports.create = async (req, res) => {
  try {
    const data = req.body;

    const inserted = await ToleranceWeigth.create(data);

    sendEncryptedResponse(res, {
      message: 'Data inserted successfully',
      data: inserted,
      success: true
    });
  } catch (error) {
    console.error('Insert Error:', error);

    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

// Get all tolerance weights
exports.getAll = async (req, res) => {
  try {
    const lastId = parseInt(req.params.id) || 1;

    if (isNaN(lastId) || lastId < 0) {
      return res.status(400).json({ error: 'Invalid last_id' });
    }

    const pageSize = 10;
    const skip = Math.max(0, (lastId - 1)) * pageSize;

    const data = await ToleranceWeigth.find().sort({ _id: -1 }).skip(skip).limit(pageSize).lean();
    const totalCount = await ToleranceWeigth.countDocuments();

    const totalPages = Math.ceil(totalCount / pageSize);
    sendEncryptedResponse(res, {
      success: data.length > 0,
      data,
      count: { totalPage: totalPages, currentPageSize: data.length }
    });
  } catch (error) {
    console.error('Get All Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
exports.getSelectedToleranceWeigth = async (req, res) => {
  try {
    const { selected, distinctValue, value, label, type, queryItem } = req.query;
    let query = { status: "active" };
    if (type) query.type = type
    if (value && label) query[label] = value
    if (queryItem) {
      query = { ...query, ...queryItem }
    }
    let data;

    if (distinctValue) {
      data = await ToleranceWeigth.distinct(distinctValue, query);
    } else if (selected) {
      data = await ToleranceWeigth.find(query).select(selected);
    } else {
      data = await ToleranceWeigth.find(query);
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "No matching products found.",
      });
    }

    // Return the results
    sendEncryptedResponse(res, { success: true, data });

  } catch (error) {
    console.error("Error in density:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error. Please try again later.",
      error: error.message,
    });
  }
};
// Get single tolerance weight by ID
exports.getById = async (req, res) => {
  try {
    const data = await ToleranceWeigth.findById(req.params.id);
    if (!data) return res.status(404).json({ message: 'Item not found' });

    sendEncryptedResponse(res, data);
  } catch (error) {
    console.error('Get By ID Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update a tolerance weight by ID
exports.update = async (req, res) => {
  try {
    const updated = await ToleranceWeigth.findByIdAndUpdate(req.params.id, req.body, { new: true });

    if (!updated) return res.status(404).json({ message: 'Item not found' });

    sendEncryptedResponse(res, { message: 'Updated successfully', data: updated, success: true });
  } catch (error) {
    console.error('Update Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a tolerance weight by ID
exports.delete_ = async (req, res) => {
  try {
    const deleted = await ToleranceWeigth.findByIdAndDelete(req.params.id);

    if (!deleted) return res.status(404).json({ message: 'Item not found' });

    sendEncryptedResponse(res, { message: 'Deleted successfully', data: deleted, success: true });
  } catch (error) {
    console.error('Delete Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
