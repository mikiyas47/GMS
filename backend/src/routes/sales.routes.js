const express = require('express');
const router = express.Router();
const { ProductSale, Product, Member } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate, authorize(['admin', 'receptionist']));

/**
 * @route   GET /api/product-sales
 * @desc    Get all product sales logs
 * @access  Admin, Receptionist
 */
router.get('/', async (req, res, next) => {
    try {
        const { product_id, member_id } = req.query;
        const filter = {};

        if (product_id) filter.product_id = product_id;
        if (member_id) filter.member_id = member_id;

        const sales = await ProductSale.find(filter)
            .populate('product_id', 'name price')
            .populate('member_id', 'first_name last_name')
            .populate('sold_by', 'full_name')
            .sort({ sold_at: -1 });

        res.json({
            success: true,
            count: sales.length,
            data: sales.map(s => {
                const p = s.product_id || {};
                const m = s.member_id || {};
                return {
                    id: s._id,
                    productId: p._id,
                    productName: p.name || 'Unknown Item',
                    unitPrice: p.price,
                    quantity: s.quantity,
                    totalAmount: s.total_amount,
                    paymentMethod: s.payment_method || 'cash',
                    member: m._id ? {
                        id: m._id,
                        name: `${m.first_name} ${m.last_name}`
                    } : null,
                    isWalkIn: !s.member_id,
                    soldAt: s.sold_at,
                    soldBy: s.sold_by ? {
                        id: s.sold_by._id,
                        name: s.sold_by.full_name
                    } : null
                };
            })
        });
    } catch (err) {
        next(err);
    }
});

/**
 * @route   POST /api/product-sales
 * @desc    Record product sale, deduct stock, and flag low-stock reorder status
 * @access  Admin, Receptionist
 */
router.post('/', async (req, res, next) => {
    try {
        const { product_id, member_id, quantity = 1, payment_method = 'cash' } = req.body;

        if (!product_id || quantity <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid product_id and positive quantity are required.'
            });
        }

        const validMethods = ['cash', 'card', 'mobile_money', 'bank_transfer'];
        const method = validMethods.includes(payment_method) ? payment_method : 'cash';

        const qty = parseInt(quantity, 10);

        const product = await Product.findById(product_id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found.'
            });
        }

        if (!product.is_active) {
            return res.status(400).json({
                success: false,
                message: 'This product is currently inactive.'
            });
        }

        if (product.stock_qty < qty) {
            return res.status(400).json({
                success: false,
                message: `Insufficient stock for '${product.name}'. Available: ${product.stock_qty}, Requested: ${qty}`
            });
        }

        if (member_id) {
            const member = await Member.findById(member_id);
            if (!member) {
                return res.status(404).json({
                    success: false,
                    message: 'Member not found.'
                });
            }
        }

        const totalAmount = Number((product.price * qty).toFixed(2));
        product.stock_qty -= qty;
        await product.save();

        const isLowStock = product.stock_qty <= product.reorder_level;

        const sale = await ProductSale.create({
            product_id,
            member_id: member_id || null,
            quantity: qty,
            total_amount: totalAmount,
            payment_method: method,
            sold_at: new Date(),
            sold_by: req.user.id
        });

        res.status(201).json({
            success: true,
            message: 'Sale completed successfully.',
            data: {
                ...sale.toObject(),
                productName: product.name,
                remainingStock: product.stock_qty,
                reorderLevel: product.reorder_level,
                isLowStockAlert: isLowStock,
                lowStockMessage: isLowStock ? `Warning: Stock for '${product.name}' is now at or below reorder level (${product.stock_qty}/${product.reorder_level}).` : null
            }
        });
    } catch (err) {
        next(err);
    }
});

module.exports = router;
