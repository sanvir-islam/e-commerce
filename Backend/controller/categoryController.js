const categorySchema = require("../model/categorySchema");

async function createCategie(req, res) {
  try {
    const { name, description } = req.body;

    const newCategory = new categorySchema({
      name,
      description,
      createdBy: req.user,
    });
    await newCategory.save();

    res.status(201).json({
      success: true,
      data: categories,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

async function getCategies(req, res) {
  try {
    const categories = await categorySchema.find();
    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
}

// async function updateCategory(req, res) {
//   try {
//     // const {name , description , }
//     const categories = await categorySchema.find();
//     res.status(200).json({
//       success: true,
//       data: categories,
//     });
//   } catch (err) {
//     res.status(500).json({
//       success: false,
//       message: err.message,
//     });
//   }
// }

module.exports = { getCategies, createCategie };
