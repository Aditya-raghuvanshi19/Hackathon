import { Repair } from '../models/repair.model.js';
import { Service } from '../models/service.model.js';

export const createRepair = async (req, res, next) => {
  try {
    const { serviceId, description } = req.body;

    // Get the service to use its price as estimated cost
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    const repair = await Repair.create({
      userId: req.user._id,
      serviceId,
      description,
      estimatedCost: service.price // Automatically set the estimated cost
    });

    res.status(201).json(repair);
  } catch (error) {
    next(error);
  }
};

export const fetchUserRepairs = async (req, res, next) => {
  try {
    const repairs = await Repair.find({ userId: req.params.id }).populate('serviceId');
    if (!repairs.length) {
      return res.status(404).json({ message: 'No repairs found for this user' });
    }
    res.status(201).json(repairs);
  } catch (error) {
    next(error);
  }
}

export const fetchAllRepairs = async (req, res, next) => {
  try {
    const repairs = await Repair.find()
      .populate([
        { path: 'serviceId', populate: { path: 'vendorId' } },
        { path: 'userId' }
      ])
      .lean();

    if (!repairs.length) {
      return res.status(404).json({ message: 'No repairs found' });
    }

    res.status(200).json(repairs);
  } catch (error) {
    next(error);
  }
};



export const getRepair = async (req, res, next) => {
  try {
    const repair = await Repair.findById(req.params.id)
      .populate('userId', 'email')
      .populate('serviceId');
    if (!repair) {
      return res.status(404).json({ message: 'Repair request not found' });
    }
    res.json(repair);
  } catch (error) {
    next(error);
  }
};

export const updateRepairStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const repair = await Repair.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!repair) {
      return res.status(404).json({ message: 'Repair request not found' });
    }
    res.json(repair);
  } catch (error) {
    next(error);
  }
};
