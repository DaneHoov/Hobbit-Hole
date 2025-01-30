const express = require("express");
const router = express.Router({ mergeParams: true });
const { requireAuth, requireProperAuthorization } = require("../../utils/auth");
const { Review, ReviewImage } = require("../../db/models");

//Delete review image
router.delete(
  "/:imageId",
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



module.exports = router;
