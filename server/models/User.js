const mongoose = require("mongoose");
const CONSTANTS = require("../lib/contants");

const userSchema = new mongoose.Schema(
  {

    name: { type: String, required: true },

    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    imageUrl: { type: String, required: true },
    description: { type: String, required: true },
    walletAddress: { type: String, required: true, unique: true },

    role: {
      type: String,
      enum: Object.values(CONSTANTS.USER_ROLE),
      default: CONSTANTS.USER_ROLE.COMPANY
    },

    type: {
      type: String,
      default: CONSTANTS.USER_ROLE.COMPANY,
      required: true,
    },
  },
  { timestamps: true }
);

const UserModel = mongoose.model("User", userSchema);

module.exports = UserModel;
