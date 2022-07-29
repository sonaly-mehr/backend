const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ErrorHandler = require("../utils/errorHandler");

exports.newOrder = catchAsyncErrors(async (req, res, next) => {
    const {
      shippingInfo,
      orderItems,
      paymentInfo,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
    } = req.body;
  
    const order = await Order.create({
      shippingInfo,
      orderItems,
      paymentInfo,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
      paidAt: Date.now(),
      user: req.user._id,
    });
  
    res.status(201).json({
      success: true,
      order,
    });
  });


// Get single order
exports.getSingleOrder = catchAsyncErrors(async(req, res, next) => {
  const order = await Order.findById(req.params.id).populate(
    "user",
    "name email"
  );

  if (!order) {
    return res.status(404).json({message: "Order not found with this Id"});
  }

  res.status(200).json({
    success: true,
    order,
  });
})


// get logged in user  Orders
exports.myOrders = catchAsyncErrors(async (req, res, next) => {
  const orders = await Order.find({ user: req.user._id });

  res.status(200).json({
    success: true,
    orders,
  });
});


//Get all orders --Admin
exports.getAllOrders = catchAsyncErrors(async(req, res, next) => {
  const orders = await Order.find();

  let totalAmount = 0;

  orders.forEach((order) => {
    totalAmount = totalAmount +order.totalPrice;
  });

  res.status(200).json({
    success: true,
    totalAmount,
    orders,
  });
})


// update Order Status -- Admin
exports.updateOrder = catchAsyncErrors(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return res.status(404).json({message: "Order not found with this Id"});
  }

  if (order.orderStatus === "Delivered") {
    return res.status(400).json({message: "You have already delivered this order"});
  }

  if (req.body.status === "Shipped") {
    order.orderItems.forEach(async (o) => {
      await updateStock(o.product, o.quantity);
    });
  }
  order.orderStatus = req.body.status;

  if (req.body.status === "Delivered") {
    order.deliveredAt = Date.now();
  }

  await order.save({ validateBeforeSave: false });
  res.status(200).json({
    success: true,
  });
});

async function updateStock(id, quantity) {
  const product = await Product.findById(id);

  product.stock -= quantity;

  await product.save({ validateBeforeSave: false });
}






// delete Order -- Admin
exports.deleteOrder = catchAsyncErrors(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return res.status(404).json({message: "Order not found with this Id"});
  }

  await order.remove();

  res.status(200).json({
    success: true,
  });
});