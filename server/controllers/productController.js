const Product = require('../models/ProductSchema');
const cloudinary = require('../config/cloudinary');
const { fetchProductsWithFilters } = require('../utils/productHelpers');

const addProduct = async (req, res) => {
  try {
    const {
      productName,
      description,
      category,
      price,
      compareAtPrice,
      stockQuantity,
      isBestSeller
    } = req.body;

    // Validate required fields
    if (!productName || !description || !category || !price || !stockQuantity) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Validate compare-at price (optional)
    if (
      compareAtPrice !== undefined &&
      compareAtPrice !== null &&
      compareAtPrice !== '' &&
      Number(compareAtPrice) <= Number(price)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Compare-at price must be greater than the selling price.'
      });
    }

    // Upload image to Cloudinary from memory buffer
    let productImage = '';
    if (req.file) {
      try {
        const b64 = Buffer.from(req.file.buffer).toString('base64');
        const dataURI = 'data:' + req.file.mimetype + ';base64,' + b64;

        const result = await cloudinary.uploader.upload(dataURI, {
          folder: 'ecommerce-jewellery/products'
        });

        productImage = result.secure_url;
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Image upload failed',
          error: uploadError.message
        });
      }
    }

    // Create the new product
    const newProduct = new Product({
      productName,
      description,
      category,
      price: Number(price),
      compareAtPrice: compareAtPrice ? Number(compareAtPrice) : undefined,
      productImage,
      stockQuantity: Number(stockQuantity),
      isBestSeller: isBestSeller === 'true' || isBestSeller === true
    });

    const savedProduct = await newProduct.save();

    res.status(201).json({
      success: true,
      message: 'Product added successfully',
      product: savedProduct
    });
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add product',
      error: error.message
    });
  }
};

// GET /api/products/allproducts
const getAllProducts = async (req, res) => {
  try {
    if (req.query.all === 'true') {
      const products = await Product.find({}).sort({ createdAt: -1 }).lean();
      return res.status(200).json({
        success: true,
        count: products.length,
        products
      });
    }

    const result = await fetchProductsWithFilters({}, req.query);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message
    });
  }
};

// PUT /api/products/editproduct/:id
const editProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      productName,
      description,
      category,
      price,
      compareAtPrice,
      stockQuantity,
      isBestSeller
    } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Validate compare-at price if provided
    if (
      compareAtPrice !== undefined &&
      compareAtPrice !== null &&
      compareAtPrice !== '' &&
      Number(compareAtPrice) <= Number(price || product.price)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Compare-at price must be greater than the selling price.'
      });
    }

    // Handle new image upload if provided
    if (req.file) {
      try {
        const b64 = Buffer.from(req.file.buffer).toString('base64');
        const dataURI = 'data:' + req.file.mimetype + ';base64,' + b64;

        const result = await cloudinary.uploader.upload(dataURI, {
          folder: 'ecommerce-jewellery/products'
        });
        product.productImage = result.secure_url;
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Image upload failed',
          error: uploadError.message
        });
      }
    }

    // Update fields
    if (productName) product.productName = productName;
    if (description) product.description = description;
    if (category) product.category = category;
    if (price) product.price = Number(price);
    
    if (compareAtPrice !== undefined && compareAtPrice !== null && compareAtPrice !== '') {
      product.compareAtPrice = Number(compareAtPrice);
    } else if (compareAtPrice === '') {
      product.compareAtPrice = undefined; // Allow clearing the compare price
    }
    
    if (stockQuantity !== undefined) product.stockQuantity = Number(stockQuantity);
    
    if (isBestSeller !== undefined) {
      product.isBestSeller = isBestSeller === 'true' || isBestSeller === true;
    }

    const updatedProduct = await product.save();

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      product: updatedProduct
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product',
      error: error.message
    });
  }
};

// GET /api/products/:id
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.status(200).json({ success: true, product });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch product', error: error.message });
  }
};

// GET /api/products/:id/related
const getRelatedProducts = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Fetch related products based on the same category, excluding the current product
    const relatedProducts = await Product.find({
      category: product.category,
      _id: { $ne: product._id }
    }).limit(4).lean();

    res.status(200).json({ success: true, count: relatedProducts.length, products: relatedProducts });
  } catch (error) {
    console.error('Error fetching related products:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch related products', error: error.message });
  }
};

// GET /api/products/getbestsellers
const getBestSellers = async (req, res) => {
  try {
    const result = await fetchProductsWithFilters({ isBestSeller: true }, req.query);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching best sellers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch best sellers',
      error: error.message
    });
  }
};

// GET /api/products/getproductsbycategory/:category
const getProductsByCategory = async (req, res) => {
  try {
    const category = req.params.category;
    const result = await fetchProductsWithFilters({ category }, req.query);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error fetching products by category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products by category',
      error: error.message
    });
  }
};

// DELETE /api/products/deleteproduct/:id
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await Product.findByIdAndDelete(id);
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product',
      error: error.message
    });
  }
};

// GET /api/products/categories
const getCategories = async (req, res) => {
  try {
    const categoriesAggr = await Product.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } }
    ]);
    
    const formattedCategories = categoriesAggr.map(c => ({
      name: c._id,
      count: c.count
    }));
    
    const allCategories = ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Bangles', 'Jhumkas'];
    const finalCategories = allCategories.map(cat => {
      const found = formattedCategories.find(c => c.name === cat);
      return {
        name: cat,
        count: found ? found.count : 0
      };
    });
    
    res.status(200).json({ success: true, categories: finalCategories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// GET /api/products/search?q=&page=&limit=
const searchProducts = async (req, res) => {
  try {
    const { q, page = 1, limit = 12 } = req.query;

    if (!q || q.trim().length < 1) {
      return res.status(400).json({ success: false, message: 'Search query is required' });
    }

    const searchRegex = new RegExp(q.trim(), 'i');
    const query = {
      $or: [
        { productName: searchRegex },
        { description: searchRegex },
        { category: searchRegex }
      ]
    };

    const pageNumber = parseInt(page, 10) || 1;
    const limitNumber = parseInt(limit, 10) || 12;
    const skip = (pageNumber - 1) * limitNumber;

    const [products, total] = await Promise.all([
      Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNumber).lean(),
      Product.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      query: q.trim(),
      count: products.length,
      total,
      totalPages: Math.ceil(total / limitNumber),
      currentPage: pageNumber,
      products
    });
  } catch (error) {
    console.error('Search Products Error:', error);
    res.status(500).json({ success: false, message: 'Failed to search products', error: error.message });
  }
};

module.exports = {
  addProduct,
  getAllProducts,
  editProduct,
  getProductById,
  getRelatedProducts,
  getBestSellers,
  getProductsByCategory,
  deleteProduct,
  getCategories,
  searchProducts
};
