const mongoose = require("mongoose");
const { Schema } = mongoose;

const categorySchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String },
    subcategory: [{ type: Schema.Types.ObjectId, ref: "Subcategory" }],
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Category", categorySchema);
