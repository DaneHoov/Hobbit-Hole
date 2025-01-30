const express = require("express");
const router = express.Router({ mergeParams: true });
const { requireAuth, requireProperAuthorization } = require("../../utils/auth");
const { Review, ReviewImage } = require("../../db/models");

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

module.exports = router;
