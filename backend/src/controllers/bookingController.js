
import { Property } from '../Models/PropertyModel.js';
import { Booking } from '../Models/bookingModel.js';
import { pool } from '../utils/db.js';

const createOrder = async (req, res) => {
    try {
        const { amount, propertyId, fromDate, toDate, guests } = req.body;

        if (!propertyId || !fromDate || !toDate || !guests) {
            return res.status(400).json({
                success: false,
                message: 'Property, dates and number of guests are required'
            });
        }

        const property = await Property.findById(propertyId);

        if (!property) {
            return res.status(404).json({
                success: false,
                message: 'Property not found'
            });
        }

        const start = new Date(fromDate);
        const end = new Date(toDate);

        if (
            Number.isNaN(start.getTime()) ||
            Number.isNaN(end.getTime()) ||
            end <= start
        ) {
            return res.status(400).json({
                success: false,
                message: 'Please provide valid booking dates'
            });
        }

        if (Number(guests) < 1 || Number(guests) > Number(property.maximum_guest)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid number of guests'
            });
        }

        const nights = Math.ceil(
            (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
        );

        const calculatedAmount = Number(property.price) * nights;

        return res.status(200).json({
            success: true,
            message: 'Demo order created. No payment has been processed.',
            orderId: `demo_order_${Date.now()}`,
            amount: calculatedAmount,
            propertyId,
            fromDate,
            toDate,
            guests,
            nights
        });
    } catch (error) {
        console.error('Create order error:', error);

        return res.status(500).json({
            success: false,
            message: 'Unable to create order'
        });
    }
};

// DEMO ONLY: This endpoint does not verify an actual payment.
const verifyPayment = async (req, res) => {
    return res.status(501).json({
        success: false,
        message:
            'Payment verification is not configured. Connect a payment provider and verify its signature on the server before confirming bookings.'
    });
};

const getUserBookings = async (req, res) => {
    try {
        const userId = req.user.id ?? req.user._id;
        const bookings = await Booking.findByUserId(userId);

        return res.status(200).json({
            status: 'success',
            data: { bookings }
        });
    } catch (error) {
        console.error('Get user bookings error:', error);

        return res.status(500).json({
            status: 'fail',
            message: 'Unable to retrieve bookings'
        });
    }
};

const getBookingDetails = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.bookingId);

        if (!booking) {
            return res.status(404).json({
                status: 'fail',
                message: 'Booking not found'
            });
        }

        const userId = String(req.user.id ?? req.user._id);

        if (String(booking.user_id) !== userId) {
            return res.status(403).json({
                status: 'fail',
                message: 'You are not authorized to view this booking'
            });
        }

        return res.status(200).json({
            status: 'success',
            data: { bookings: booking }
        });
    } catch (error) {
        console.error('Get booking details error:', error);

        return res.status(500).json({
            status: 'fail',
            message: 'Unable to retrieve booking details'
        });
    }
};

export {
    getBookingDetails,
    getUserBookings,
    createOrder,
    verifyPayment
};
