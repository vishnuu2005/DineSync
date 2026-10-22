const Floor = require('../models/Floor');
const Table = require('../models/Table');
const AuditLog = require('../models/AuditLog');

// @desc    Get all floors with table counts
// @route   GET /api/floors
// @access  Public / Staff
const getFloors = async (req, res) => {
  try {
    const floors = await Floor.find({ isArchived: false }).sort({ displayOrder: 1, name: 1 });
    
    // Enrich with table count and availability
    const tables = await Table.find({ isArchived: false });
    
    const enrichedFloors = floors.map((f) => {
      const floorTables = tables.filter(
        (t) => (t.floorId && t.floorId.toString() === f._id.toString()) || t.floor === f.name
      );
      const availableCount = floorTables.filter((t) => t.status === 'Available').length;
      const occupiedCount = floorTables.filter((t) => t.status === 'Occupied').length;

      return {
        _id: f._id,
        name: f.name,
        description: f.description,
        displayOrder: f.displayOrder,
        isActive: f.isActive,
        tableCount: floorTables.length,
        availableTables: availableCount,
        occupiedTables: occupiedCount,
        totalCapacity: floorTables.reduce((sum, t) => sum + (t.capacity || 0), 0),
      };
    });

    res.json(enrichedFloors);
  } catch (error) {
    console.error('Get floors error:', error);
    res.status(500).json({ message: 'Error retrieving floor layout.' });
  }
};

// @desc    Create new floor
// @route   POST /api/floors
// @access  Private/Admin
const createFloor = async (req, res) => {
  try {
    const { name, description, displayOrder } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Floor name is required.' });
    }

    const trimmedName = name.trim();
    const existing = await Floor.findOne({ name: { $regex: new RegExp(`^${trimmedName}$`, 'i') } });
    if (existing) {
      if (existing.isArchived) {
        existing.isArchived = false;
        existing.description = description || existing.description;
        existing.displayOrder = displayOrder !== undefined ? displayOrder : existing.displayOrder;
        await existing.save();
        return res.json(existing);
      }
      return res.status(400).json({ message: `A floor named "${trimmedName}" already exists.` });
    }

    const floor = await Floor.create({
      name: trimmedName,
      description: description ? description.trim() : '',
      displayOrder: displayOrder || 0,
      isActive: true,
      isArchived: false,
    });

    if (req.user) {
      await AuditLog.create({
        action: 'FLOOR_CREATED',
        performedBy: req.user._id,
        performedByName: req.user.name,
        role: req.user.role,
        targetType: 'Floor',
        targetId: floor._id.toString(),
        details: { name: floor.name },
      });
    }

    res.status(201).json(floor);
  } catch (error) {
    console.error('Create floor error:', error);
    res.status(500).json({ message: error.message || 'Failed to create floor.' });
  }
};

// @desc    Update floor
// @route   PUT /api/floors/:id
// @access  Private/Admin
const updateFloor = async (req, res) => {
  try {
    const { name, description, displayOrder, isActive } = req.body;
    const floor = await Floor.findById(req.params.id);

    if (!floor) {
      return res.status(404).json({ message: 'Floor not found.' });
    }

    const oldName = floor.name;
    if (name && name.trim()) {
      floor.name = name.trim();
      // Also update tables associated with this floor name
      await Table.updateMany({ floor: oldName }, { floor: floor.name });
    }

    if (description !== undefined) floor.description = description.trim();
    if (displayOrder !== undefined) floor.displayOrder = Number(displayOrder);
    if (isActive !== undefined) floor.isActive = Boolean(isActive);

    const updatedFloor = await floor.save();

    if (req.user) {
      await AuditLog.create({
        action: 'FLOOR_UPDATED',
        performedBy: req.user._id,
        performedByName: req.user.name,
        role: req.user.role,
        targetType: 'Floor',
        targetId: updatedFloor._id.toString(),
        details: { oldName, newName: updatedFloor.name },
      });
    }

    res.json(updatedFloor);
  } catch (error) {
    console.error('Update floor error:', error);
    res.status(500).json({ message: 'Failed to update floor.' });
  }
};

// @desc    Archive floor safely (prevents destructive loss)
// @route   DELETE /api/floors/:id
// @access  Private/Admin
const archiveFloor = async (req, res) => {
  try {
    const floor = await Floor.findById(req.params.id);
    if (!floor) {
      return res.status(404).json({ message: 'Floor not found.' });
    }

    // Safety check: count active tables
    const tableCount = await Table.countDocuments({
      $or: [{ floorId: floor._id }, { floor: floor.name }],
      isArchived: false,
    });

    if (tableCount > 0) {
      return res.status(400).json({
        message: `Cannot remove "${floor.name}" because it still contains ${tableCount} active tables. Please reassign or archive tables first.`,
      });
    }

    floor.isArchived = true;
    floor.isActive = false;
    await floor.save();

    if (req.user) {
      await AuditLog.create({
        action: 'FLOOR_ARCHIVED',
        performedBy: req.user._id,
        performedByName: req.user.name,
        role: req.user.role,
        targetType: 'Floor',
        targetId: floor._id.toString(),
        details: { name: floor.name },
      });
    }

    res.json({ message: `Floor "${floor.name}" archived successfully.` });
  } catch (error) {
    console.error('Archive floor error:', error);
    res.status(500).json({ message: 'Failed to archive floor.' });
  }
};

module.exports = {
  getFloors,
  createFloor,
  updateFloor,
  archiveFloor,
};
