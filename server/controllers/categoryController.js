const Category = require('../models/Category');
const Product = require('../models/Product');
const AuditLog = require('../models/AuditLog');

// @desc    Get all active menu categories
// @route   GET /api/categories or /api/public/menu/categories
// @access  Public
const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isArchived: false }).sort({ displayOrder: 1, name: 1 });
    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Error fetching menu categories.' });
  }
};

// @desc    Create menu category
// @route   POST /api/categories
// @access  Private/Admin
const createCategory = async (req, res) => {
  try {
    const { name, description, displayOrder } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Category name is required.' });
    }

    const trimmed = name.trim();
    const existing = await Category.findOne({ name: { $regex: new RegExp(`^${trimmed}$`, 'i') } });

    if (existing) {
      if (existing.isArchived) {
        existing.isArchived = false;
        existing.isActive = true;
        existing.description = description || existing.description;
        await existing.save();
        return res.json(existing);
      }
      return res.status(400).json({ message: `Category "${trimmed}" already exists.` });
    }

    const category = await Category.create({
      name: trimmed,
      description: description ? description.trim() : '',
      displayOrder: displayOrder || 0,
      isActive: true,
      isArchived: false,
    });

    if (req.user) {
      await AuditLog.create({
        action: 'CATEGORY_CREATED',
        performedBy: req.user._id,
        performedByName: req.user.name,
        role: req.user.role,
        targetType: 'Category',
        targetId: category._id.toString(),
        details: { name: category.name },
      });
    }

    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to create category.' });
  }
};

// @desc    Update category
// @route   PUT /api/categories/:id
// @access  Private/Admin
const updateCategory = async (req, res) => {
  try {
    const { name, description, displayOrder, isActive } = req.body;
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: 'Category not found.' });
    }

    const oldName = category.name;
    if (name && name.trim()) {
      category.name = name.trim();
      // Update any products with old category string
      await Product.updateMany({ category: oldName }, { category: category.name });
    }

    if (description !== undefined) category.description = description.trim();
    if (displayOrder !== undefined) category.displayOrder = Number(displayOrder);
    if (isActive !== undefined) category.isActive = Boolean(isActive);

    const updated = await category.save();

    if (req.user) {
      await AuditLog.create({
        action: 'CATEGORY_UPDATED',
        performedBy: req.user._id,
        performedByName: req.user.name,
        role: req.user.role,
        targetType: 'Category',
        targetId: updated._id.toString(),
        details: { oldName, newName: updated.name },
      });
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update category.' });
  }
};

// @desc    Archive category
// @route   DELETE /api/categories/:id
// @access  Private/Admin
const archiveCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found.' });
    }

    category.isArchived = true;
    category.isActive = false;
    await category.save();

    if (req.user) {
      await AuditLog.create({
        action: 'CATEGORY_ARCHIVED',
        performedBy: req.user._id,
        performedByName: req.user.name,
        role: req.user.role,
        targetType: 'Category',
        targetId: category._id.toString(),
        details: { name: category.name },
      });
    }

    res.json({ message: `Category "${category.name}" archived.` });
  } catch (error) {
    res.status(500).json({ message: 'Failed to archive category.' });
  }
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  archiveCategory,
};
