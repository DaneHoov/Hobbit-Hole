const express = require("express");
const { Op } = require("sequelize");
const bcrypt = require("bcryptjs");

const {
  setTokenCookie,
  restoreUser,
  requireAuth,
} = require("../../utils/auth");
const { Review } = require("../../db/models");
const { check } = require("express-validator");
const { handleValidationErrors } = require("../../utils/validation");
const router = express.Router();

const validateReview = [
  check("review")
    .exists({ checkFalsy: true })
    .withMessage("Review text is required"),
  check("stars")
    .isInt({ min: 1, max: 5 })
    .withMessage("Stars must be an integer from 1 to 5"),
];

//get all reviews of current user
router.get("/current", requireAuth, async (req, res) => {
  const userId = req.user.id;

  const reviews = await Review.findAll({
    where: { userId },
    include: [
      {
        model: User,
        attributes: ["id", "firstName", "lastName"],
      },
      {
        model: Spot,
        attributes: [
          "id",
          "ownerId",
          "address",
          "city",
          "state",
          "country",
          "lat",
          "lng",
          "name",
          "price",
          "previewImage"
        ],
      },
      {
        model: ReviewImage,
        attributes: [
          "id",
          "url",
        ],
      },
    ],
  });

  return res.status(200).json({ Reviews: reviews });
});


//Edit review
router.put("/:id", requireAuth, async (req, res) => {
  const { review, stars } = req.body;
  const reviewId = req.params.id;

  if (!review || !stars) {
    return res.status(400).json({
      message: "Bad Request",
      errors: {
        review: "Review text is required",
        stars: "Stars must be an integer from 1 to 5",
      },
    });
  }

  if (typeof stars !== "number" || stars < 1 || stars > 5) {
    return res.status(400).json({
      message: "Bad Request",
      errors: {
        stars: "Stars must be an integer from 1 to 5",
      },
    });
  }

  const reviewToUpdate = await Review.findByPk(reviewId);

  if (!reviewToUpdate) {
    return res.status(404).json({
      message: "Review couldn't be found",
    });
  }

  reviewToUpdate.review = review;
  reviewToUpdate.stars = stars;
  await reviewToUpdate.save();

  res.status(200).json({
    id: reviewToUpdate.id,
    ownerId: reviewToUpdate.ownerId,
    spotId: reviewToUpdate.spotId,
    review: reviewToUpdate.review,
    stars: reviewToUpdate.stars,
    createdAt: reviewToUpdate.createdAt,
    updatedAt: reviewToUpdate.updatedAt,
  });
});

//Add image to review based on review id
router.post("/:id/images", requireAuth, async (req, res) => {
  const reviewId = req.params.id;
  const { url } = req.body;
  const userId = req.user.id;

  const review = await Review.findByPk(reviewId);
  if (!review) {
    return res.status(404).json({ message: "Review couldn't be found" });
  }
  if (review.userId !== userId) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  //review already has 10 images
  const imageCount = await ReviewImage.count({ where: { reviewId } });
  if (imageCount >= 10) {
    return res.status(403).json({
      message: "Maximum number of images for this resource was reached",
    });
  }

  const newImage = await ReviewImage.create({
    reviewId,
    url,
  });

  return res.status(201).json(newImage);
});

//Delete review image
router.delete(
  "/:reviewId/images/:imageId",
  requireAuth,
  async (req, res) => {
    const ownerId = req.user.id;
    const reviewId = req.params.reviewId;
    const imageId = req.params.imageId;

    const review = await Review.findByPk(reviewId);

    if (!review) {
      return res.status(404).json({
        message: "Review couldn't be found",
      });
    }

    if (review.userId !== ownerId) {
      return res.status(403).json({
        message: "You don't have permission to delete this image",
      });
    }

    const reviewImage = await ReviewImage.findOne({
      where: {
        id: imageId,
        reviewId: reviewId,
      },
    });

    if (!reviewImage) {
      return res.status(404).json({
        message: "Review Image couldn't be found",
      });
    }

    await reviewImage.destroy();

    res.status(200).json({
      message: "Successfully deleted",
    });
  }
);

//Delete a review
router.delete(
  "/:id",
  requireAuth,
  async (req, res) => {
    const reviewId = req.params.id;

    const reviewToDelete = await Review.findByPk(reviewId);


    if (!reviewToDelete) {
      return res.status(404).json({
        message: "Review couldn't be found",
      });
    }

    await reviewToDelete.destroy();


    res.status(200).json({
      message: "Successfully deleted",
    });
  }
);

module.exports = router;

