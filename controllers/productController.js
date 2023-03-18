const User = require("../models/userModel");
const Product = require("../models/poductsModel");
const Category = require("../models/categoryModel");
const fs = require("fs");
const path = require("path");

const category = async (req, res, next) => {
  try {
    const categories = await Category.find({ active: true });
    res.render("category", { category: categories });
  } catch (error) {
    next(error);
  }
};

const addCategory = async (req, res, next) => {
  try {
    res.render("addcategory");
  } catch (error) {
    next(error);
  }
};

const saveCategory = async (req, res, next) => {
  try {
    if (
      req.file.mimetype === "image/png" ||
      req.file.mimetype === "image/jpg" ||
      req.file.mimetype === "image/jpeg" ||
      req.file.mimetype === "image/webp"
    ) {
      const newCategory = req.body.category;
      const image = req.file.filename;
      const categoryData = await Category.find({
        name: newCategory.toUpperCase(),
        active: true,
      });

      if (categoryData.length === 0) {
        const category = new Category({
          name: newCategory.toUpperCase(),
          image: image,
        });
        const save = await category.save();
        if (save) {
          res.redirect("/admin/category");
        }
      } else {
        res.render("addcategory", { message: "Already Exist" });
      }
    } else {
      res.render("addcategory", {
        message: "Only png,jpg,jpeg and webp are allowed",
      });
    }
  } catch (error) {
    next(error);
  }
};

const editCategory = async (req, res, next) => {
  try {
    const id = req.query.id;
    const categoryData = await Category.findById({ _id: id, active: true });
    res.render("categoryedit", { categoryData });
  } catch (error) {
    next(error);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const existData = await Category.findOne({
      name: req.body.category.toUpperCase(),
      active: true,
    });
    if (!existData) {
      if (req.file) {
        const updatedData = await Category.findByIdAndUpdate(
          { _id: req.body.id },
          {
            $set: {
              name: req.body.category.toUpperCase(),
              image: req.file.filename,
            },
          }
        );
        res.json({ success: true });
      } else {
        const updatedData = await Category.findByIdAndUpdate(
          { _id: req.body.id },
          {
            $set: {
              name: req.body.category.toUpperCase(),
            },
          }
        );
        res.json({ success: true });
      }
    } else {
      res.json({ message: "Category already exist" });
    }
  } catch (error) {
    next(error);
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    const id = req.params.categoryId;
    const productCheck = await Product.find({ category: id, active: true });
    if (productCheck.length < 1) {
      await Category.findByIdAndUpdate(
        { _id: id },
        { $set: { active: false } }
      );
      const success = true;
      res.json({ success });
    } else {
      const success = false;
      res.json({ success });
    }
  } catch (error) {
    next(error);
  }
};

const products = async (req, res, next) => {
  try {
    const productData = await Product.find({
      active: true,
    }).populate("category");
    res.render("products", { products: productData });
  } catch (error) {
    next(error);
  }
};

const productInfo = async (req, res, next) => {
  try {
    const id = req.query.id;
    const productData = await Product.findById({ _id: id }).populate(
      "category"
    );
    res.render("productinfo", { product: productData });
  } catch (error) {
    next(error);
  }
};

const addProducts = async (req, res, next) => {
  try {
    const Categories = await Category.find({ active: true });
    res.render("addproducts", { categories: Categories });
  } catch (error) {
    next(error);
  }
};

const saveProduct = async (req, res, next) => {
  try {
    const name = req.body.product;
    const gp = req.body.gp;
    const op = req.body.op;
    const image = req.files;
    const size = req.body.size;
    const brand = req.body.brand;
    const stock = req.body.stock;
    const ds = req.body.Description;
    const ct = req.body.category;

    let imageId = [];

    for (let i = 0; i < image.length; i++) {
      imageId[i] = image[i].filename;
    }

    const product = new Product({
      name: name,
      gross_price: gp,
      offer_price: op,
      image: imageId,
      size: size,
      brand: brand,
      stocks: stock,
      description: ds,
      category: ct,
    });

    const productData = await product.save();
    if (productData) {
      res.redirect("/admin/products");
    } else {
      res.render("addproducts", { message: "Not valid data" });
    }
  } catch (error) {
    next(error);
  }
};

const editProduct = async (req, res, next) => {
  try {
    const id = req.query.id;
    const productData = await Product.findById({ _id: id });

    const Categories = await Category.find({ __v: 0 });
    const category_name = await Category.findById({
      _id: productData.category,
    });
    res.render("productedit", {
      product: productData,
      categories: Categories,
      category_name,
    });
  } catch (error) {
    next(error);
  }
};

const updatedProduct = async (req, res, next) => {
  try {
    let img1 = null;
    let img2 = null;
    let img3 = null;

    const productData = {
      name: req.body.product,
      offer_price: req.body.op,
      gross_price: req.body.gp,
      brand: req.body.brand,
      size: req.body.size,
      category: req.body.category,
      stocks: req.body.stock,
      description: req.body.Description,
    };

    const updatedData = await Product.findByIdAndUpdate(
      { _id: req.body.id },
      { $set: productData }
    );
    // update the product with the uploaded images at positions

    // Check if each image was uploaded and assign it to the appropriate variable

    if (
      req.files &&
      req.files.image1 &&
      req.files.image1[0].fieldname === "image1"
    ) {
      img1 = req.files.image1[0].filename;
      const data = await Product.findById({ _id: req.body.id });
      // Delete the old image file (optional)
      const imagePath = path.join(
        __dirname,
        "../public/productimg",
        data.image[0]
      );
      fs.unlinkSync(imagePath);
      data.image[0] = img1;
      const img = await Product.replaceOne({ _id: req.body.id }, data);
    }
    if (
      req.files &&
      req.files.image2 &&
      req.files.image2[0].fieldname === "image2"
    ) {
      img2 = req.files.image2[0].filename;
      const data = await Product.findById({ _id: req.body.id });
      // Delete the old image file (optional)
      const imagePath = path.join(
        __dirname,
        "../public/productimg",
        data.image[1]
      );
      fs.unlinkSync(imagePath);
      data.image[1] = img2;
      const img = await Product.replaceOne({ _id: req.body.id }, data);
    }
    if (
      req.files &&
      req.files.image3 &&
      req.files.image3[0].fieldname === "image3"
    ) {
      img3 = req.files.image3[0].filename;
      const data = await Product.findById({ _id: req.body.id });
      // Delete the old image file (optional)
      const imagePath = path.join(
        __dirname,
        "../public/productimg",
        data.image[2]
      );
      fs.unlinkSync(imagePath);
      data.image[2] = img3;
      const img = await Product.replaceOne({ _id: req.body.id }, data);
    }
    res.redirect("/admin/products");
  } catch (error) {
    next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const id = req.query.id;
    await Product.findByIdAndUpdate({ _id: id }, { $set: { active: false } });
    res.redirect("/admin/products");
  } catch (error) {
    next(error);
  }
};

module.exports = {
  products,
  addProducts,
  saveProduct,
  deleteProduct,
  category,
  addCategory,
  saveCategory,
  deleteCategory,
  productInfo,
  editProduct,
  updatedProduct,
  editCategory,
  updateCategory,
};
