/**
 * Procedure Schema Definition for MongoDB
 * Handles procedure management and assignments
 */

const mongoose = require('mongoose');

const procedureSchema = new mongoose.Schema({
  procedureId: {
    type: Number,
    unique: true,
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    enum: ['medical', 'training', 'administrative', 'security'],
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  requirements: [String],
  estimatedDuration: Number,
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Procedure', procedureSchema);
