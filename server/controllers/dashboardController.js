const Order = require('../models/OrderSchema');
const Product = require('../models/ProductSchema');
const User = require('../models/UserSchema');

// @desc    Get Admin Dashboard Statistics
// @route   GET /api/dashboard
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
    try {
        // 1. Overview Statistics
        const totalUsers = await User.countDocuments();
        const totalProducts = await Product.countDocuments();
        const totalOrders = await Order.countDocuments();
        
        // Exclude Cancelled and Failed orders from revenue
        const revenueResult = await Order.aggregate([
            { $match: { orderStatus: { $ne: 'Cancelled' }, paymentStatus: { $ne: 'Failed' } } },
            { $group: { _id: null, totalRevenue: { $sum: "$pricing.total" } } }
        ]);
        const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

        // 2. Revenue - Last 7 Days
        const last7Days = [];
        const now = new Date();

        for (let i = 6; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            d.setHours(0, 0, 0, 0);
            
            const nextD = new Date(d);
            nextD.setDate(nextD.getDate() + 1);

            const dateLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); // e.g. "Aug 21"
            const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' }); // e.g. "Fri"

            last7Days.push({
                date: dateLabel,
                day: dayLabel,
                startDate: d,
                endDate: nextD,
                revenue: 0,
                orders: 0
            });
        }

        const sevenDaysAgo = last7Days[0].startDate;
        const validRecentOrders = await Order.find({
            createdAt: { $gte: sevenDaysAgo },
            orderStatus: { $ne: 'Cancelled' },
            paymentStatus: { $ne: 'Failed' }
        }).select('createdAt pricing.total');

        validRecentOrders.forEach(order => {
            const orderTime = new Date(order.createdAt).getTime();
            const matchedDay = last7Days.find(d => orderTime >= d.startDate.getTime() && orderTime < d.endDate.getTime());
            if (matchedDay) {
                matchedDay.revenue += (order.pricing?.total || 0);
                matchedDay.orders += 1;
            }
        });

        const formattedRevenueLast7Days = last7Days.map(d => ({
            date: d.date,
            day: d.day,
            revenue: d.revenue,
            orders: d.orders
        }));

        // 3. Orders By Status
        const statusAggregation = await Order.aggregate([
            { $group: { _id: "$orderStatus", count: { $sum: 1 } } }
        ]);

        const validStatuses = ['Pending', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];
        const ordersByStatusMap = {};
        validStatuses.forEach(st => { ordersByStatusMap[st] = 0; });
        
        statusAggregation.forEach(item => {
            if (item._id) {
                ordersByStatusMap[item._id] = item.count;
            }
        });

        const ordersByStatus = Object.keys(ordersByStatusMap)
            .map(st => ({
                status: st,
                count: ordersByStatusMap[st]
            }))
            .filter(item => item.count > 0 || totalOrders === 0);

        // 4. Top Categories by Units Sold
        const categoryAggregation = await Order.aggregate([
            { $match: { orderStatus: { $ne: 'Cancelled' }, paymentStatus: { $ne: 'Failed' } } },
            { $unwind: "$orderItems" },
            {
                $lookup: {
                    from: "products",
                    localField: "orderItems.product",
                    foreignField: "_id",
                    as: "productDoc"
                }
            },
            {
                $project: {
                    quantity: "$orderItems.quantity",
                    category: {
                        $ifNull: [
                            { $arrayElemAt: ["$productDoc.category", 0] },
                            {
                                $switch: {
                                    branches: [
                                        { case: { $regexMatch: { input: "$orderItems.name", regex: /ring/i } }, then: "Rings" },
                                        { case: { $regexMatch: { input: "$orderItems.name", regex: /necklace/i } }, then: "Necklaces" },
                                        { case: { $regexMatch: { input: "$orderItems.name", regex: /earring/i } }, then: "Earrings" },
                                        { case: { $regexMatch: { input: "$orderItems.name", regex: /bracelet/i } }, then: "Bracelets" },
                                        { case: { $regexMatch: { input: "$orderItems.name", regex: /bangle/i } }, then: "Bangles" },
                                        { case: { $regexMatch: { input: "$orderItems.name", regex: /jhumka/i } }, then: "Jhumkas" },
                                    ],
                                    default: "Jewellery"
                                }
                            }
                        ]
                    }
                }
            },
            {
                $group: {
                    _id: "$category",
                    unitsSold: { $sum: "$quantity" }
                }
            },
            { $sort: { unitsSold: -1 } },
            { $limit: 5 }
        ]);

        const topCategories = categoryAggregation.map(c => ({
            category: c._id || 'Jewellery',
            unitsSold: c.unitsSold
        }));

        // 5. Recent Orders (Latest 5)
        const recentOrders = await Order.find()
            .populate('user', 'name email')
            .sort({ createdAt: -1 })
            .limit(5)
            .select('_id user contactEmail shippingAddress createdAt pricing orderStatus paymentStatus');
            
        const formattedRecentOrders = recentOrders.map(order => {
            const customerName = order.user?.name || 
                (order.shippingAddress?.firstName ? `${order.shippingAddress.firstName} ${order.shippingAddress.lastName || ''}`.trim() : null) || 
                order.contactEmail || 
                'Customer';

            return {
                orderId: order._id.toString(),
                customer: customerName,
                date: order.createdAt,
                amount: order.pricing?.total || 0,
                status: order.orderStatus || 'Pending'
            };
        });

        // 6. Top Selling Products (Latest individual products by units sold)
        const topSellingProducts = await Order.aggregate([
            { $match: { orderStatus: { $ne: 'Cancelled' }, paymentStatus: { $ne: 'Failed' } } },
            { $unwind: "$orderItems" },
            { 
                $group: {
                    _id: "$orderItems.name",
                    productId: { $first: "$orderItems.product" },
                    name: { $first: "$orderItems.name" },
                    image: { $first: "$orderItems.image" },
                    sold: { $sum: "$orderItems.quantity" },
                    revenue: { $sum: { $multiply: ["$orderItems.price", "$orderItems.quantity"] } }
                }
            },
            { $sort: { sold: -1 } },
            { $limit: 5 }
        ]);

        // 7. Low Stock Products Alert
        const lowStockProducts = await Product.find({ stockQuantity: { $lt: 10 } })
            .sort({ stockQuantity: 1 })
            .limit(5)
            .select('productName stockQuantity _id');

        res.status(200).json({
            success: true,
            data: {
                overview: {
                    totalOrders,
                    totalRevenue,
                    totalProducts,
                    totalUsers
                },
                revenueLast7Days: formattedRevenueLast7Days,
                ordersByStatus,
                topCategories,
                recentOrders: formattedRecentOrders,
                topSellingProducts: topSellingProducts.map(p => ({
                    productId: p.productId || p._id,
                    name: p.name || 'Jewellery Product',
                    image: p.image || '',
                    sold: p.sold,
                    revenue: p.revenue
                })),
                lowStockProducts: lowStockProducts.map(p => ({
                    productId: p._id,
                    productName: p.productName,
                    sku: p._id.toString().substring(0, 8).toUpperCase(),
                    stock: p.stockQuantity,
                    status: p.stockQuantity === 0 ? 'Out of Stock' : 'Low Stock'
                }))
            }
        });

    } catch (error) {
        console.error("Dashboard Stats Error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

module.exports = { getDashboardStats };
