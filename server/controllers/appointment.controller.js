import { Appointment } from '../models/appointment.model.js';

export const createAppointment = async (req, res, next) => {
  try {
    const { repairRequestId, scheduledDateTime, notes } = req.body;
    const appointment = await Appointment.create({
      repairRequestId,
      userId: req.user._id,
      scheduledDateTime,
      notes
    });
    res.status(201).json(appointment);
  } catch (error) {
    next(error);
  }
};

export const getAppointments = async (req, res, next) => {
  try {
    const query = req.user.isAdmin ? {} : { userId: req.user._id };
    const appointments = await Appointment.find(query)
      .populate({
        path: 'repairRequestId',
        populate: {
          path: 'serviceId', // 👈 this is the nested populate
        }
      })
      .populate('userId', 'email')
      .sort({ scheduledDateTime: 1 });
    res.json(appointments);
  } catch (error) {
    next(error);
  }
};




export const updateAppointment = async (req, res, next) => {
  try {
    const { scheduledDateTime, status, notes } = req.body;
    const appointment = await Appointment.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user._id
      },
      { scheduledDateTime, status, notes },
      { new: true }
    );
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found in DB' });
    }
    res.json(appointment);
  } catch (error) {
    next(error);
  }
};

export const deleteAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findOneAndUpdate(
      {
        _id: req.params.id,
        userId: req.user._id
      },
      { status: 'canceled' },
      { new: true }
    );
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found in DB' });
    }
    res.json({ message: 'Appointment canceled successfully' });
  } catch (error) {
    next(error);
  }
};