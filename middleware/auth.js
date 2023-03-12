const isLogin = async (req, res, next) => {
  try {
    if (req.session.userId) {
      next();
    } else {
      res.redirect("/");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const isLogout = async (req, res, next) => {
  try {
    if (req.session.userId) {
      res.redirect("/");
    } else {
      next();
    }
  } catch (error) {
    console.log(error.message);
  }
};

const loginPage = async (req, res, next) => {
  try {
    if (req.session.userId) {
      next();
    } else {
      res.redirect("/signin");
    }
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  isLogin,
  isLogout,
  loginPage,
};
