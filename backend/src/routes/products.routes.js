const express = require('express');
const router = express.Router();
const { Product } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

/**
 * @route   GET /api/products
 * @desc    Get all products with stock and low-stock reorder status
 * @access  Admin, Receptionist
 */
router.get('/', authorize(['admin', 'receptionist']), async (req, res, next) => {
    try {
        const { low_stock_only, is_active } = req.query;
        const filter = {};

        if (is_active !== undefined) {
            filter.is_active = is_active === 'true' || is_active === '1';
        }

        let products = await Product.find(filter).sort({ name: 1 });

        if (low_stock_only === 'true' || low_stock_only === '1') {
            products = products.filter(p => p.stock_qty <= p.reorder_level);
        }

        res.json({
            success: true,
            count: products.length,
            data: products.map(p => ({
                id: p._id,
                name: p.name,
                price: p.price,
                stockQty: p.stock_qty,
                stock_qty: p.stock_qty,
                reorderLevel: p.reorder_level,
                reorder_level: p.reorder_level,
                imageUrl: p.image_url || p.image || null,
                image_url: p.image_url || p.image || null,
                image: p.image_url || p.image || null,
                category: p.category || 'Equipment & Gear',
                description: p.description || '',
                isLowStock: p.stock_qty <= p.reorder_level,
                isActive: p.is_active,
                is_active: p.is_active
            }))
        });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   POST /api/products
 * @desc    Create a new product
 * @access  Admin
 */
router.post('/', authorize(['admin']), async (req, res, next) => {
    try {
        const {
            name,
            price,
            stock_qty,
            stockQty,
            reorder_level,
            reorderLevel,
            is_active,
            isActive,
            image_url,
            imageUrl,
            image,
            category = 'Equipment & Gear',
            description = ''
        } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Product name is required.'
            });
        }

        if (price === undefined || isNaN(Number(price)) || Number(price) < 0) {
            return res.status(400).json({
                success: false,
                message: 'Product price must be a valid non-negative number.'
            });
        }

        const resolvedStock = stock_qty !== undefined ? stock_qty : (stockQty !== undefined ? stockQty : 0);
        const resolvedReorder = reorder_level !== undefined ? reorder_level : (reorderLevel !== undefined ? reorderLevel : 5);
        const resolvedActive = is_active !== undefined ? (is_active === true || is_active === 'true' || is_active === 1 || is_active === '1')
            : (isActive !== undefined ? (isActive === true || isActive === 'true' || isActive === 1 || isActive === '1') : true);
        const finalImage = image_url || imageUrl || image || null;

        const newProduct = await Product.create({
            name: name.trim(),
            price: Number(price),
            stock_qty: parseInt(resolvedStock, 10),
            reorder_level: parseInt(resolvedReorder, 10),
            is_active: resolvedActive,
            image_url: finalImage,
            image: finalImage,
            category: category ? category.trim() : 'Equipment & Gear',
            description: description ? description.trim() : ''
        });

        res.status(201).json({
            success: true,
            message: 'Product created successfully.',
            data: {
                ...newProduct.toObject(),
                id: newProduct._id,
                imageUrl: newProduct.image_url,
                image_url: newProduct.image_url,
                stockQty: newProduct.stock_qty,
                reorderLevel: newProduct.reorder_level,
                isLowStock: newProduct.stock_qty <= newProduct.reorder_level,
                isActive: newProduct.is_active
            }
        });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   PUT /api/products/:id
 * @desc    Update an existing product
 * @access  Admin
 */
router.put('/:id', authorize(['admin']), async (req, res, next) => {
    try {
        const { id } = req.params;
        const target = await Product.findById(id);

        if (!target) {
            return res.status(404).json({
                success: false,
                message: 'Product not found.'
            });
        }

        const {
            name,
            price,
            stock_qty,
            stockQty,
            reorder_level,
            reorderLevel,
            is_active,
            isActive,
            image_url,
            imageUrl,
            image,
            category,
            description
        } = req.body;

        if (name !== undefined) {
            if (!name.trim()) {
                return res.status(400).json({ success: false, message: 'Product name cannot be empty.' });
            }
            target.name = name.trim();
        }

        if (price !== undefined) {
            if (isNaN(Number(price)) || Number(price) < 0) {
                return res.status(400).json({ success: false, message: 'Price must be a valid non-negative number.' });
            }
            target.price = Number(price);
        }

        if (stock_qty !== undefined || stockQty !== undefined) {
            const rawStock = stock_qty !== undefined ? stock_qty : stockQty;
            const parsed = parseInt(rawStock, 10);
            if (isNaN(parsed) || parsed < 0) {
                return res.status(400).json({ success: false, message: 'Stock quantity cannot be negative.' });
            }
            target.stock_qty = parsed;
        }

        if (reorder_level !== undefined) target.reorder_level = parseInt(reorder_level, 10);
        else if (reorderLevel !== undefined) target.reorder_level = parseInt(reorderLevel, 10);

        if (is_active !== undefined) target.is_active = (is_active === true || is_active === 'true' || is_active === 1 || is_active === '1');
        else if (isActive !== undefined) target.is_active = (isActive === true || isActive === 'true' || isActive === 1 || isActive === '1');

        const finalImage = image_url !== undefined ? image_url : (imageUrl !== undefined ? imageUrl : (image !== undefined ? image : undefined));
        if (finalImage !== undefined) {
            target.image_url = finalImage;
            target.image = finalImage;
        }

        if (category !== undefined) target.category = category.trim();
        if (description !== undefined) target.description = description.trim();

        await target.save();

        res.json({
            success: true,
            message: 'Product updated successfully.',
            data: {
                ...target.toObject(),
                id: target._id,
                imageUrl: target.image_url,
                image_url: target.image_url,
                stockQty: target.stock_qty,
                reorderLevel: target.reorder_level,
                isLowStock: target.stock_qty <= target.reorder_level,
                isActive: target.is_active
            }
        });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete a product
 * @access  Admin
 */
router.delete('/:id', authorize(['admin']), async (req, res, next) => {
    try {
        const { id } = req.params;
        const target = await Product.findById(id);

        if (!target) {
            return res.status(404).json({
                success: false,
                message: 'Product not found.'
            });
        }

        await Product.findByIdAndDelete(id);

        res.json({
            success: true,
            message: 'Product deleted successfully.'
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
