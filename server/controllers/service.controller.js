import { Review } from '../models/review.model.js';
import { Service } from '../models/service.model.js';

export const getServices = async (req, res, next) => {
  try {
    const services = await Service.find({ $and: [{ active: true }, { isEnabled: true }] }).populate('vendorId');
    res.json(services);
  } catch (error) {
    next(error);
  }
};

export const getAllServices = async (req, res, next) => {
  try {
    const services = await Service.find({ isEnabled: false }).populate('vendorId');
    res.json(services);
  } catch (error) {
    next(error);
  }
};


export const getServicesByVendorId = async (req, res, next) => {
  try {
    const vendorId = req.params.id;

    const services = await Service.find({ vendorId: vendorId });
    res.json(services);
  } catch (error) {
    next(error);
  }
};

export const createService = async (req, res, next) => {
  try {
    const { vendorId, name, description, price, duration } = req.body;
    const service = await Service.create({
      vendorId,
      name,
      description,
      price,
      duration
    });
    console.log(service)
    res.status(201).json(service);
  } catch (error) {
    console.log(error)
    next(error);
  }
};

export const deleteService = async (req, res, next) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    next(error);
  }
};



export const authorizeService = async (req, res, next) => {
  try {
    const serviceId = req.body.serviceId;
    const accept = req.body.isAccepted;

    const service = await Service.findByIdAndUpdate(
      { _id: serviceId },
      { $set: { active: accept, isEnabled: true } },
      { new: true }
    );

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    res.json({
      message: `Service ${accept ? 'activated' : 'deactivated'} successfully`,
      service,
    });
  } catch (error) {
    next(error);
  }
};

