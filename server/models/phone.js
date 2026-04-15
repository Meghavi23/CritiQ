const mongoose = require("mongoose");

const phoneSchema = new mongoose.Schema(
  {
    phone: { type: String },
    id: { type: Number },
    sid: { type: Number },
    verified: { type: Boolean },
  },
  { timestamps: true }
);

const PhoneModel = mongoose.models.Phone || mongoose.model('Phone', phoneSchema);
module.exports = PhoneModel;
