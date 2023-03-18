const Admin = require("../models/adminModel");
const bcrypt = require("bcrypt");
const User = require("../models/userModel");
const Product = require("../models/poductsModel");
const Category = require("../models/categoryModel");
const Banner = require("../models/bannerModel");
const Order = require("../models/orderModel");
const path = require("path");
const fs = require("fs");
const pdf = require("html-pdf");
const ejs = require("ejs");
const excelJS = require("exceljs");

// loading admin login page
const adminLogin = async (req, res, next) => {
  try {
    res.render("login");
  } catch (error) {
    next(error);
  }
};

// checking admin data with database details and verifying admin exist or not
const verifyAdmin = async (req, res, next) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const adminData = await Admin.findOne({ email: email });

    if (adminData) {
      const passwordCheck = await bcrypt.compare(password, adminData.password); //comparing database bycrpt with user typed password
      if (passwordCheck) {
        if (adminData.is_admin === true) {
          req.session.adminId = adminData._id;
          res.json({ success: true });
        } else {
          res.json({ message: "verify Your account" });
        }
      } else {
        res.json({ message: "Password is incorrect" });
      }
    } else {
      res.json({ message: "You Are not a Admin" });
    }
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    req.session.destroy();
    res.redirect("/admin");
  } catch (error) {
    next(error);
  }
};

const dashboard = async (req, res, next) => {
  try {
    const orderData = await Order.find({})
      .populate("userId")
      .sort({ createdAt: -1 })
      .limit(6);

    const userData = await User.find({});
    const productData = await Product.find({});
    const category = await Category.find({ active: true });
    const deliveredCount = await Order.find({
      order_status: "DELIVERED",
    }).count();
    const earnings = await Order.aggregate([
      { $match: { payment_status: "COMPLETED" } },
      { $group: { _id: null, total: { $sum: "$total_price" } } },
      { $project: { _id: 0, total: 1 } },
    ]);

    const cod = await Order.aggregate([
      { $match: { payment_method: "COD", payment_status: "COMPLETED" } },
      { $group: { _id: null, total: { $sum: "$total_price" } } },
      { $project: { _id: 0, total: 1 } },
    ]);

    const razorpay = await Order.aggregate([
      { $match: { payment_method: "Razorpay", payment_status: "COMPLETED" } },
      { $group: { _id: null, total: { $sum: "$total_price" } } },
      { $project: { _id: 0, total: 1 } },
    ]);

    const wallet = await Order.aggregate([
      { $match: { payment_method: "wallet", payment_status: "COMPLETED" } },
      { $group: { _id: null, total: { $sum: "$total_price" } } },
      { $project: { _id: 0, total: 1 } },
    ]);

    const lastMonthEarning = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
          payment_status: "COMPLETED",
        },
      },
      { $group: { _id: null, total: { $sum: "$total_price" } } },
      { $project: { _id: 0, total: 1 } },
    ]);
    const lastWeekData = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
          },
          payment_status: "COMPLETED",
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
            },
          },
          totalPrice: { $sum: "$total_price" },
        },
      },
      {
        $sort: {
          _id: -1,
        },
      },
    ]);
    const totalsArray = lastWeekData.map((item) => item.totalPrice);
    const daysArray = lastWeekData.map((item) =>
      new Date(item._id).toString().slice(0, 3)
    );
    const days = JSON.stringify(daysArray);
    const totals = JSON.stringify(totalsArray);
    res.render("dashboard", {
      orderData,
      userData,
      productData,
      category,
      deliveredCount,
      earnings,
      cod,
      razorpay,
      wallet,
      days,
      totals,
      lastMonthEarning,
    });
  } catch (error) {
    next(error);
  }
};

const customers = async (req, res, next) => {
  try {
    const userData = await User.find({ __v: 0 });
    res.render("customers", { users: userData });
  } catch (error) {
    next(error);
  }
};

const customersInfo = async (req, res, next) => {
  try {
    const userData = await User.findOne({ _id: req.query.id });
    res.render("customerinfo", { user: userData });
  } catch (error) {
    next(error);
  }
};

const blockCustomer = async (req, res, next) => {
  try {
    const userData = await User.findById({ _id: req.query.id });
    if (userData.is_verified === 0) {
      const updatedData = await User.findByIdAndUpdate(
        { _id: req.query.id },
        {
          $set: {
            is_verified: 1,
          },
        }
      );

      res.redirect("/admin/customers");
    } else if (userData.is_verified === 1) {
      const updatedData = await User.findByIdAndUpdate(
        { _id: req.query.id },
        {
          $set: {
            is_verified: 0,
          },
        }
      );
      res.redirect("/admin/customers");
    }
  } catch (error) {
    next(error);
  }
};

const banner = async (req, res, next) => {
  try {
    const banner = await Banner.find({ __v: 0 });
    res.render("banner", { banner });
  } catch (error) {
    next(error);
  }
};

const addbanner = async (req, res, next) => {
  try {
    res.render("banneradd");
  } catch (error) {
    next(error);
  }
};

const saveBanner = async (req, res, next) => {
  try {
    const title = req.body.title;
    const existData = await Banner.findOne({
      title: { $regex: title, $options: "i" },
    });

    if (!title) {
      const description = req.body.description;
      const image = req.file.filename;

      const banner = new Banner({
        title: title,
        description: description,
        image: image,
      });

      const BannerData = await banner.save();
      res.redirect("/admin/banners");
    } else {
      res.render("banneradd", { message: "Already Exist" });
    }
  } catch (error) {
    next(error);
  }
};

const deleteBanner = async (req, res, next) => {
  try {
    const id = req.query.id;
    await Banner.deleteOne({ _id: id });
    res.redirect("/admin/banner");
  } catch (error) {
    next(error);
  }
};

const loadSales = async (req, res, next) => {
  try {
    const orderData = await Order.find({ order_status: "DELIVERED" })
      .populate("userId")
      .populate("products.productId")
      .sort({ createdAt: -1 });
    const totalAmount = orderData.reduce(
      (acc, cur) => acc + cur.total_price,
      0
    );

    res.render("sales", { orderData, totalAmount });
  } catch (error) {
    next(error.message);
  }
};

const salesByDate = async (req, res, next) => {
  try {
    const startDate = new Date(req.body.startDate);
    const endDate = new Date(req.body.endDate);

    const orderData = await Order.find({
      order_status: "DELIVERED",
      createdAt: {
        $gte: startDate,
        $lte: endDate,
      },
    })
      .populate("userId")
      .sort({ createdAt: -1 })
      .populate("products.productId");

    const totalAmount = orderData.reduce(
      (acc, cur) => acc + cur.total_price,
      0
    );

    res.json({ orderData, totalAmount });
  } catch (error) {
    next(error.message);
  }
};

const downloadPdf = async (req, res, next) => {
  try {
    const startDate = new Date(req.query.startDate);
    const endDate = new Date(req.query.endDate);

    const orderData = await Order.find({
      order_status: "DELIVERED",
      createdAt: {
        $gte: startDate,
        $lte: endDate,
      },
    })
      .sort({ createdAt: -1 })
      .populate("products.productId")
      .populate("userId");

    const totalAmount = orderData.reduce(
      (acc, cur) => acc + cur.total_price,
      0
    );

    const data = {
      orderData: orderData,
      total: totalAmount,
      startDate: startDate.toString().slice(0, 10),
      endDate: endDate.toString().slice(0, 10),
    };

    const filePathName = path.resolve(
      __dirname,
      "../views/admin/htmltopdf.ejs"
    );
    const htmlString = fs.readFileSync(filePathName).toString();
    let options = {
      border: "10mm",
      format: "Letter",
    };
    const ejsData = ejs.render(htmlString, data);
    const pdfCreate = new Promise((resolve, reject) => {
      pdf.create(ejsData, options).toStream((err, stream) => {
        if (err) reject(err);
        else resolve(stream);
      });
    });
    const stream = await pdfCreate;
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=salesreport1.pdf",
    });
    stream.pipe(res);
  } catch (error) {
    next(error.message);
  }
};

const downloadExcel = async (req, res, next) => {
  try {
    const startDate = new Date(req.query.startDate);
    const endDate = new Date(req.query.endDate);
    const workbook = new excelJS.Workbook();
    const worksheet = workbook.addWorksheet("My Orders");
    worksheet.columns = [
      { header: "Date", key: "date" },
      { header: "Customer", key: "userId" },
      { header: "Products", key: "products" },
      { header: "Total Price", key: "total_price" },
    ];
    const orderData = await Order.find({
      order_status: "DELIVERED",
      createdAt: {
        $gte: startDate,
        $lte: endDate,
      },
    })
      .sort({ createdAt: -1 })
      .populate("userId")
      .populate("products.productId");

    if (orderData.length === 0) {
      res.status(404).send("No data found");
    } else {
      orderData.forEach((order) => {
        const rowData = {
          date: order.date,
          userId: order.userId.name,
          products: order.products
            .map((product) => product.productId[0].name)
            .join(", "),
          total_price: order.total_price,
        };
        worksheet.addRow(rowData);
      });

      worksheet.getRow(1).eachCell((cell) => {
        cell.font = { bold: true };
      });

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheatml.sheet"
      );
      res.setHeader("Content-Disposition", `attachment; filename=orders.xlsx`);
      return workbook.xlsx.write(res).then(() => {
        res.status(200);
      });
    }
  } catch (error) {
    next(error.message);
  }
};

module.exports = {
  adminLogin,
  verifyAdmin,
  logout,
  dashboard,
  customers,
  customersInfo,
  blockCustomer,
  banner,
  addbanner,
  saveBanner,
  deleteBanner,
  loadSales,
  salesByDate,
  downloadPdf,
  downloadExcel,
};
