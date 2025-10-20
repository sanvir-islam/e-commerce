const mongoose = require("mongoose");
const { Schema } = mongoose;

const subcategorySchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Subcategory", subcategorySchema);
