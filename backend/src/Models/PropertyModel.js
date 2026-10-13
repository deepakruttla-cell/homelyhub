
import slugify from 'slugify';
import { pool } from '../utils/db.js';

const Property = {
    async create(data) {
        const {
            propertyName,
            description,
            extraInfo,
            propertyType = 'House',
            roomType = 'Anytype',
            maximumGuest,
            amenities = [],
            images = [],
            price = 500,
            address = {},
            userId,
            chekInTime = '11:00',
            chekOutTime = '13:00'
        } = data;

        if (!propertyName || !description || !maximumGuest || !userId) {
            throw new Error(
                'Property name, description, maximum guests and user are required'
            );
        }

        if (!Array.isArray(images) || images.length < 5) {
            throw new Error('At least 5 property images are required');
        }

        const validTypes = ['House', 'Flat', 'Guest House', 'Hotel'];
        const validRoomTypes = ['Anytype', 'Room', 'Entire Home'];
        const validAmenities = [
            'Wifi',
            'Kitchen',
            'Ac',
            'Washing Machine',
            'Tv',
            'Pool',
            'Free Parking'
        ];

        if (!validTypes.includes(propertyType)) {
            throw new Error('Invalid property type');
        }

        if (!validRoomTypes.includes(roomType)) {
            throw new Error('Invalid room type');
        }

        for (const amenity of amenities) {
            if (
                !amenity.name ||
                !validAmenities.includes(amenity.name) ||
                !amenity.icon
            ) {
                throw new Error('Invalid amenity name or icon');
            }
        }

        for (const image of images) {
            if (!image.url) {
                throw new Error('Every image must have a URL');
            }
        }

        const city = (address.city || '').replaceAll(' ', '').toLowerCase();
        const slug = slugify(propertyName, { lower: true });

        const result = await pool.query(
            `INSERT INTO properties (
                property_name,
                description,
                extra_info,
                property_type,
                room_type,
                maximum_guest,
                amenities,
                images,
                price,
                address_area,
                address_city,
                address_state,
                address_pincode,
                user_id,
                slug,
                check_in_time,
                check_out_time
            )
            VALUES (
                $1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb,
                $9, $10, $11, $12, $13, $14, $15, $16, $17
            )
            RETURNING *`,
            [
                propertyName,
                description,
                extraInfo || null,
                propertyType,
                roomType,
                maximumGuest,
                JSON.stringify(amenities),
                JSON.stringify(images),
                price,
                address.area || null,
                city || null,
                address.state || null,
                address.pincode || null,
                userId,
                slug,
                chekInTime,
                chekOutTime
            ]
        );

        return result.rows[0];
    },

    async findById(id) {
        const result = await pool.query(
            'SELECT * FROM properties WHERE id = $1',
            [id]
        );

        return result.rows[0] || null;
    },

    async findAll() {
        const result = await pool.query(
            'SELECT * FROM properties ORDER BY created_at DESC'
        );

        return result.rows;
    },

    async findByUserId(userId) {
        const result = await pool.query(
            'SELECT * FROM properties WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );

        return result.rows;
    },

    async deleteById(id) {
        const result = await pool.query(
            'DELETE FROM properties WHERE id = $1 RETURNING *',
            [id]
        );

        return result.rows[0] || null;
    }
};

export { Property };
