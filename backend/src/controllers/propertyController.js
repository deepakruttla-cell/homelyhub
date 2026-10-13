
import { Property } from '../Models/PropertyModel.js';
import { pool } from '../utils/db.js';
import ImageKit from '../utils/ImagekitIO.js';

const getProperty = async (req, res) => {
    try {
        const property = await Property.findById(req.params.id);

        if (!property) {
            return res.status(404).json({
                status: 'fail',
                message: 'Property not found'
            });
        }

        return res.status(200).json({
            status: 'success',
            data: property
        });
    } catch (error) {
        console.error('Get property error:', error.message);

        return res.status(500).json({
            status: 'fail',
            message: 'Unable to get property'
        });
    }
};

const createProperty = async (req, res) => {
    try {
        const {
            propertyName,
            description,
            propertyType,
            roomType,
            extraInfo,
            address,
            amenities,
            checkInTime,
            checkOutTime,
            maximumGuest,
            price,
            images
        } = req.body;

        if (!Array.isArray(images) || images.length < 5) {
            return res.status(400).json({
                status: 'fail',
                message: 'Please provide at least 5 property images'
            });
        }

        const uploadedImages = [];

        for (const image of images) {
            const uploaded = await ImageKit.upload({
                file: image.url,
                fileName: `property_${Date.now()}.jpg`,
                folder: 'property_images'
            });

            uploadedImages.push({
                url: uploaded.url,
                public_id: uploaded.fileId
            });
        }

        const property = await Property.create({
            propertyName,
            description,
            propertyType,
            roomType,
            extraInfo,
            address,
            amenities,
            chekInTime: checkInTime,
            chekOutTime: checkOutTime,
            maximumGuest,
            price,
            images: uploadedImages,
            userId: req.user.id ?? req.user._id
        });

        return res.status(201).json({
            status: 'success',
            data: { data: property }
        });
    } catch (error) {
        console.error('Create property error:', error);

        return res.status(400).json({
            status: 'fail',
            message: error.message || 'Unable to create property'
        });
    }
};

const getProperties = async (req, res) => {
    try {
        let {
            page = 1,
            limit = 10,
            search,
            propertyType,
            roomType,
            city,
            minPrice,
            maxPrice
        } = req.query;

        page = Math.max(1, parseInt(page, 10) || 1);
        limit = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));

        const conditions = [];
        const values = [];

        const addCondition = (sql, value) => {
            values.push(value);
            conditions.push(sql.replace('?', `$${values.length}`));
        };

        if (search) {
            addCondition(
                `(property_name ILIKE '%' || ? || '%' OR description ILIKE '%' || ? || '%')`,
                search
            );
            // The second placeholder must use the same parameter.
            conditions[conditions.length - 1] =
                `(property_name ILIKE '%' || $${values.length} || '%' OR description ILIKE '%' || $${values.length} || '%')`;
        }

        if (propertyType) {
            addCondition('property_type = ?', propertyType);
        }

        if (roomType) {
            addCondition('room_type = ?', roomType);
        }

        if (city) {
            addCondition('address_city ILIKE ?', `%${city}%`);
        }

        if (minPrice !== undefined && minPrice !== '') {
            const value = Number(minPrice);

            if (!Number.isFinite(value) || value < 0) {
                return res.status(400).json({
                    status: 'fail',
                    message: 'Invalid minimum price'
                });
            }

            addCondition('price >= ?', value);
        }

        if (maxPrice !== undefined && maxPrice !== '') {
            const value = Number(maxPrice);

            if (!Number.isFinite(value) || value < 0) {
                return res.status(400).json({
                    status: 'fail',
                    message: 'Invalid maximum price'
                });
            }

            addCondition('price <= ?', value);
        }

        const whereClause = conditions.length
            ? `WHERE ${conditions.join(' AND ')}`
            : '';

        const countResult = await pool.query(
            `SELECT COUNT(*) FROM properties ${whereClause}`,
            values
        );

        const total = Number(countResult.rows[0].count);

        const dataValues = [...values, limit, (page - 1) * limit];

        const result = await pool.query(
            `SELECT * FROM properties
             ${whereClause}
             ORDER BY created_at DESC
             LIMIT $${values.length + 1}
             OFFSET $${values.length + 2}`,
            dataValues
        );

        return res.status(200).json({
            status: 'success',
            no_of_responses: result.rows.length,
            all_properties: total,
            current_page: page,
            total_pages: Math.ceil(total / limit),
            data: result.rows
        });
    } catch (error) {
        console.error('Get properties error:', error);

        return res.status(500).json({
            status: 'fail',
            message: 'Unable to retrieve properties'
        });
    }
};

const getUsersProperties = async (req, res) => {
    try {
        const userId = req.user.id ?? req.user._id;
        const properties = await Property.findByUserId(userId);

        return res.status(200).json({
            status: 'success',
            data: properties
        });
    } catch (error) {
        console.error('Get user properties error:', error);

        return res.status(500).json({
            status: 'fail',
            message: 'Unable to retrieve your properties'
        });
    }
};

export {
    getProperty,
    createProperty,
    getProperties,
    getUsersProperties
};
