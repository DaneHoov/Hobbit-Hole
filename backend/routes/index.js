// backend/routes/index.js
const express = require("express");
const apiRouter = require("./api");
const router = express.Router();
router.use("/api", apiRouter);

router.get("/hello/world", function (req, res) {
  console.log(req.csrfToken)
  res.cookie("XSRF-TOKEN", req.csrfToken());
  res.send("Hello World!");
  // res.json({'XSRF-Token': req.csrfToken()})
});

module.exports = router;
