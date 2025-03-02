const mongoose = require('mongoose');

const applicantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
//   resume: {
//     type: String // URL or path to the resume
//   },
  appliedAt: {
    type: Date,
    default: Date.now
  },
  applicantId: { type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    // jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' }
});

module.exports = mongoose.model('Applicant', applicantSchema);
