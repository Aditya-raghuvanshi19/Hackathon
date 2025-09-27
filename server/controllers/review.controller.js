import { Review } from '../models/review.model.js';

export const createReview = async (req, res, next) => {
  try {
    const { serviceId, rating, comment } = req.body;
    const review = await Review.create({
      userId: req.user._id,
      serviceId,
      rating,
      comment
    });
    res.status(201).json(review);
  } catch (error) {
    next(error);
  }
};

export const getServiceReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find({ serviceId: req.params.serviceId })
      .populate('userId', 'email')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    next(error);
  }
};

export const getAllReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find()
      .populate({
        path: 'userId' // includes all fields by default
      })
      .populate({
        path: 'serviceId',
        populate: {
          path: 'vendorId',
          model: 'User',
          select: 'email' // include only email for vendor
        }
      })
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    next(error);
  }
};

