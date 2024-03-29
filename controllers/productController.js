const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const Product = require("../models/productModel");
const ApiFeatures = require("../utils/apiFeatures");
const ErrorHandler = require("../utils/errorHandler");
// const cloudinary = require("cloudinary");

// Create Product -- Admin
exports.createProduct = catchAsyncErrors(async (req, res, next) => {
  // let images = [];

  // if (typeof req.body.images === "string") {
  //   images.push(req.file.images);
  // } else {
  //   images = req.body.images;
  // }

  // const imagesLinks = [];

  // for (let i = 0; i < images.length; i++) {
  //   const result = await cloudinary.uploader.upload(images[i].tempFilePath, function(err, result){
  //     console.log("error", err);
  //     console.log("result", result)
  //     // upload_preset: 'products',
  //   });

  //   imagesLinks.push({
  //     public_id: result.public_id,
  //     url: result.secure_url,
  //   });
  // }

  // req.body.images = imagesLinks;
  req.body.user = req.user.id;

  const product = await Product.create(req.body);

  res.status(201).json({
    success: true,
    product,
  });
});

//Get All products
exports.getAllProducts =catchAsyncErrors(async (req, res) => {
  const resultPerPage = 8;
  const productsCount = await Product.countDocuments();

  const apiFeature = new ApiFeatures(Product.find(), req.query)
    .search()
    .filter()
    .pagination(resultPerPage);

  let products = await apiFeature.query;

  // let filteredProductsCount = products.length;

  // apiFeature.pagination(resultPerPage);

  // products = await apiFeature.query;

  res.status(200).json({
    success: true,
    products,
    productsCount,
    resultPerPage,
    // filteredProductsCount,
  });
        
  });


// Get All Product (Admin)
exports.getAdminProducts = catchAsyncErrors(async (req, res, next) => {
  const products = await Product.find();

  res.status(200).json({
    success: true,
    products,
  });
});

//Single products
exports.getSingleProduct = catchAsyncErrors(async (req, res, next) => {
  let product = await Product.findById(req.params.id);

  if(!product){
    return res.status(404).json({message: "Product not found!"});
  }
  
  res.status(200).json({
    success:true,
    product,
  })
})

//Update products
exports.updateProduct = catchAsyncErrors(async (req, res, next) => {
  let product = await Product.findById(req.params.id);

  if(!product){
    return res.status(404).json({message: "Product not found!"});
  }
  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new:true,
    runValidators:true,
    useFindAndModify:false
  });
  res.status(200).json({
    success:true,
    product
  })
})

//Delete products -- Admin
exports.deleteProduct =catchAsyncErrors(async (req, res, next) => {
  let product = await Product.findById(req.params.id);

  if(!product){
    return res.status(404).json({message: "Product not found!"});
  }
  await product.remove();

  res.status(200).json({
    success:true,
    message:"Product Deleted"
  })
})


// Create New Review or Update the review
exports.createProductReview = catchAsyncErrors(async (req, res, next) => {
  const { rating, comment, productId } = req.body;

  const review = {
    user: req.user._id,
    name: req.user.name,
    rating: Number(rating),
    comment,
  };

  const product = await Product.findById(productId);

  const isReviewed = product.reviews.find(
    (rev) => rev.user.toString() === req.user._id.toString()
  );

  if (isReviewed) {
    product.reviews.forEach((rev) => {
      if (rev.user.toString() === req.user._id.toString())
        (rev.rating = rating), (rev.comment = comment);
    });
  } else {
    product.reviews.push(review);
    product.numOfReviews = product.reviews.length;
  }

  let avg = 0;

  product.reviews.forEach((rev) => {
    avg += rev.rating;
  });

  product.ratings = avg / product.reviews.length;

  await product.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
  });
});

// Get All Reviews of a product
exports.getProductReviews = catchAsyncErrors(async (req, res, next) => {
  const product = await Product.findById(req.query.id);

  if (!product) {
    return res.status(404).json({message: "Product not found!"});
  }

  res.status(200).json({
    success: true,
    reviews: product.reviews,
  });
});


// Delete Review
exports.deleteReview = catchAsyncErrors(async(req, res, next) => {
  const product = await Product.findById(req.query.productId);

  if (!product) {
    return res.status(404).json({message: "Product not found!"});
  }

  const reviews = product.reviews.filter((rev)=> rev._id.toString() !== req.query.id.toString())

  let avg = 0;

  reviews.forEach((rev)=> {
    avg += rev.rating
  })

  let ratings= 0;

  if(reviews.length===0){
    ratings = 0
  }
  else{
    ratings = avg/reviews.length
  }

  const numOfReviews= reviews.length;

  await Product.findByIdAndUpdate(
    req.query.productId,
    {
      reviews,
      ratings,
      numOfReviews
    },
    {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    }
  )

  res.status(200).json({
    success: true,
  });

})