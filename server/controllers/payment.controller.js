import { Payment } from '../models/payment.model.js';
import { generateTransactionId } from '../utils/payment.utils.js';

export const processPayment = async (req, res, next) => {
  try {
    const { repairId, amount, paymentMethod } = req.body;
    const payment = await Payment.create({
      repairId,
      userId: req.user._id,
      amount,
      paymentMethod,
      transactionId: generateTransactionId()
    });
    res.status(201).json(payment);
  } catch (error) {
    next(error);
  }
};

export const fetchUserPayments = async (req, res, next) => {

  try {
    const payments = await Payment.find({ userId: req.params.id });
    if (!payments.length) {
      return res.status(404).json({ message: 'No payments found for this user' });
    }
    res.status(201).json(payments);
  } catch (error) {
    next(error);
  }

}

export const getPaymentDetails = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('repairId')
      .populate('userId', 'email');
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    res.json(payment);
  } catch (error) {
    next(error);
  }
};