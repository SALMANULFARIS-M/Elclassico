const express = require("express");
const admin_route = express();
const path = require("path");
const fs = require('fs')

//multer
const multer = require("multer");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../public/productimg"));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + file.originalname;
    cb(null, uniqueSuffix);
  },
});


const upload = multer({ storage: storage });

//set views path for admin
admin_route.set("views", "./views/admin");

//session midleware
const auth = require("../middleware/adminauth");
// controllers
const ac = require("../controllers/adminControllers");
const pc = require("../controllers/productController");
const oc = require("../controllers/orderController");

//admin login and dashboard
admin_route.get("/", auth.isLogout, ac.adminLogin);
admin_route.post("/", ac.verifyAdmin);
admin_route.get("/dashboard", auth.isLogin, ac.dashboard);
admin_route.get("/logout", auth.isLogin, ac.logout);

//sales
admin_route.get("/sales", auth.isLogin, ac.loadSales);
admin_route.post("/sales",auth.isLogin,ac.salesByDate);
admin_route.get("/pdfdown",auth.isLogin,ac.downloadPdf);
admin_route.get("/exceldown",auth.isLogin,ac.downloadExcel);

//customers details
admin_route.get("/customers", auth.isLogin, ac.customers);
admin_route.get("/customerinfo", auth.isLogin, ac.customersInfo);
admin_route.get("/block", auth.isLogin, ac.blockCustomer);

//banner
admin_route.get("/banner", auth.isLogin, ac.banner);
admin_route.get("/addbanner", auth.isLogin, ac.addbanner);
admin_route.post("/addbanner",auth.isLogin,upload.single("image"),ac.saveBanner);
admin_route.post("/deletebanner", auth.isLogin, ac.deleteBanner);


//category
admin_route.get("/category", auth.isLogin, pc.category);
admin_route.get("/addcategory", auth.isLogin, pc.addCategory);
admin_route.post("/addcategory",auth.isLogin,upload.single("Image"),pc.saveCategory);
admin_route.get("/deletecategory/:categoryId",auth.isLogin, pc.deleteCategory);
admin_route.get("/editcategory", auth.isLogin, pc.editCategory);
admin_route.post("/editcategory",auth.isLogin,upload.single("Image"),pc.updateCategory);

//products
admin_route.get("/products", auth.isLogin, pc.products);
admin_route.get("/productinfo", auth.isLogin, pc.productInfo);
admin_route.get("/addproducts", auth.isLogin, pc.addProducts);
admin_route.post("/addproducts",auth.isLogin,upload.array("image", 3),pc.saveProduct);
admin_route.get("/editproduct", auth.isLogin, pc.editProduct);
admin_route.post("/editproduct",auth.isLogin,  upload.fields([{ name: "image1" }, { name: "image2" }, { name: "image3" }]),pc.updatedProduct);
admin_route.post("/deleteproduct", auth.isLogin, pc.deleteProduct);

//orders
admin_route.get("/orders", auth.isLogin, oc.loadOrder);
admin_route.get("/vieworder", auth.isLogin, oc.viewOrder);
admin_route.post("/vieworder", auth.isLogin, oc.updateOrder);
admin_route.get("/approvereturn/:orderId",auth.isLogin, oc.returnApprove)

//coupon
admin_route.get("/coupon", auth.isLogin, oc.coupon);
admin_route.get("/addcoupon", auth.isLogin, oc.addCoupon);
admin_route.post("/addcoupon", auth.isLogin, oc.saveCoupon);
admin_route.post("/deletecoupon", auth.isLogin, oc.deleteCoupon);



//back to admin root from any page
admin_route.get("*", function (req, res) {
  res.redirect("/admin");
});

module.exports = admin_route;
