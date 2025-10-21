const File = require('../models/fileDetail');

exports.create = async (req, res) => {
    try {
        const userId = req.user._id
        const { name, size, url, type , uploadedType} = req.body;

        const newFile = await File.create({
            name,
            size,
            url,
            type,
            uploadedType,
            uploadedBy: userId
        });

        res.status(201).json({ message: 'File uploaded successfully', data: newFile, success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error uploading file', error });
    }
};


// Get all files with pagination
exports.getAll = async (req, res) => {
    try {
        const lastId = parseInt(req.params.id) || 1;

        if (isNaN(lastId) || lastId < 1) {
            return res.status(400).json({ error: 'Invalid last_id' });
        }

        const pageSize = 10;
        const skip = (lastId - 1) * pageSize;

        const query = {}; // Add filters if needed, e.g., { type: 'csv' }

        const files = await File.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(pageSize)
            .lean();

        const totalCount = await File.countDocuments(query);
        const totalPages = Math.ceil(totalCount / pageSize);

        res.status(200).json({
            success: true,
            files,
            count: {
                totalPage: totalPages,
                currentPageSize: files.length
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get file by ID
exports.getById = async (req, res) => {
    try {
        const { id } = req.params;
        const file = await File.findById(id);

        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        res.status(200).json({ data: file });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch file', error });
    }
};

// Update file by ID
exports.update = async (req, res) => {
    try {
        const updated = await File.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        if (!updated) return res.status(404).json({ message: 'File not found' });

        res.status(200).json({ message: 'File updated successfully', data: updated });
    } catch (error) {
        res.status(400).json({ message: 'Failed to update file', error });
    }
};

// Delete file by ID
exports.delete_ = async (req, res) => {
    try {
        const deleted = await File.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'File not found' });

        res.status(200).json({ message: 'File deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete file', error });
    }
};
