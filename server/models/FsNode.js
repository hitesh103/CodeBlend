const mongoose = require('mongoose');

const FsNodeSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
        type: { type: String, required: true, enum: ['folder', 'file'] },
        name: { type: String, required: true },
        parentId: { type: mongoose.Schema.Types.ObjectId, default: null, index: true },
        content: { type: String, default: '' },
    },
    { timestamps: true }
);

FsNodeSchema.index({ userId: 1, parentId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('FsNode', FsNodeSchema);

