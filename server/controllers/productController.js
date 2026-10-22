const Product = require('../models/Product');
const Category = require('../models/Category');
const AuditLog = require('../models/AuditLog');
const { getIO } = require('../utils/socket');

// @desc    Get all products with category and search filtering
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  try {
    const { category, search, availableOnly } = req.query;
    let query = { isArchived: false };

    if (category && category !== 'All') {
      query.category = category;
    }

    if (availableOnly === 'true') {
      query.available = true;
    }

    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const products = await Product.find(query).sort({ category: 1, name: 1 });
    res.json(products);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Error fetching products.' });
  }
};

// @desc    Get public customer menu with categories
// @route   GET /api/public/menu
// @access  Public
const getPublicMenu = async (req, res) => {
  try {
    const categories = await Category.find({ isArchived: false, isActive: true }).sort({
      displayOrder: 1,
      name: 1,
    });
    const products = await Product.find({ isArchived: false, available: true }).sort({
      category: 1,
      name: 1,
    });

    res.json({
      categories,
      products,
    });
  } catch (error) {
    console.error('Get public menu error:', error);
    res.status(500).json({ message: 'Error fetching public menu.' });
  }
};

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, isArchived: false });
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: 'Product not found.' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching product details.' });
  }
};

// @desc    Create new product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res) => {
  try {
    const { name, description, price, category, categoryId, image, available, type, preparationTimeMinutes } =
      req.body;

    if (!name || price === undefined || !category) {
      return res.status(400).json({ message: 'Product name, price, and category are required.' });
    }

    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice < 0) {
      return res.status(400).json({ message: 'Price must be a valid positive number.' });
    }

    const priceInPaise = Math.round(numPrice * 100);

    const product = new Product({
      name: name.trim(),
      description: description ? description.trim() : '',
      price: numPrice,
      priceInPaise,
      category: category.trim(),
      categoryId: categoryId || null,
      image:
        image ||
        'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80',
      available: available !== undefined ? Boolean(available) : true,
      type: type || 'veg',
      preparationTimeMinutes: Number(preparationTimeMinutes) || 10,
      isArchived: false,
    });

    const createdProduct = await product.save();

    if (req.user) {
      await AuditLog.create({
        action: 'MENU_ITEM_CREATED',
        performedBy: req.user._id,
        performedByName: req.user.name,
        role: req.user.role,
        targetType: 'Product',
        targetId: createdProduct._id.toString(),
        details: { name: createdProduct.name, price: createdProduct.price, category: createdProduct.category },
      });
    }

    res.status(201).json(createdProduct);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: error.message || 'Failed to create product.' });
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res) => {
  try {
    const { name, description, price, category, categoryId, image, available, type, preparationTimeMinutes } =
      req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    const oldPrice = product.price;

    if (name !== undefined) product.name = name.trim();
    if (description !== undefined) product.description = description.trim();
    if (price !== undefined) {
      const numPrice = Number(price);
      if (isNaN(numPrice) || numPrice < 0) {
        return res.status(400).json({ message: 'Price must be a valid positive number.' });
      }
      product.price = numPrice;
      product.priceInPaise = Math.round(numPrice * 100);
    }
    if (category !== undefined) product.category = category.trim();
    if (categoryId !== undefined) product.categoryId = categoryId;
    if (image !== undefined) {
      product.image = typeof image === 'string' ? image.trim() : image;
    }
    if (available !== undefined) product.available = Boolean(available);
    if (type !== undefined) product.type = type;
    if (preparationTimeMinutes !== undefined) product.preparationTimeMinutes = Number(preparationTimeMinutes);

    const updatedProduct = await product.save();

    if (req.user) {
      await AuditLog.create({
        action: 'MENU_ITEM_UPDATED',
        performedBy: req.user._id,
        performedByName: req.user.name,
        role: req.user.role,
        targetType: 'Product',
        targetId: updatedProduct._id.toString(),
        details: {
          name: updatedProduct.name,
          oldPrice,
          newPrice: updatedProduct.price,
          available: updatedProduct.available,
        },
      });
    }

    try {
      const io = getIO();
      if (io) {
        io.emit('productUpdated', updatedProduct);
      }
    } catch (_) {}

    res.json(updatedProduct);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: error.message || 'Failed to update product.' });
  }
};

// @desc    Archive product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    product.isArchived = true;
    product.available = false;
    await product.save();

    if (req.user) {
      await AuditLog.create({
        action: 'MENU_ITEM_ARCHIVED',
        performedBy: req.user._id,
        performedByName: req.user.name,
        role: req.user.role,
        targetType: 'Product',
        targetId: product._id.toString(),
        details: { name: product.name },
      });
    }

    res.json({ message: `Product "${product.name}" archived successfully.` });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Failed to archive product.' });
  }
};

module.exports = {
  getProducts,
  getPublicMenu,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
