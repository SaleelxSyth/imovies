const User = require('../models/User');

const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('favorites', 'title posterUrl genre duration rating')
      .select('-password');
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (err) {
    next(err);
  }
};

const getFavorites = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('favorites');
    res.status(200).json({
      success: true,
      data: user.favorites || []
    });
  } catch (err) {
    next(err);
  }
};

const addFavorite = async (req, res, next) => {
  try {
    const { movieId } = req.params;
    const user = await User.findById(req.user._id);

    if (!user.favorites.includes(movieId)) {
      user.favorites.push(movieId);
      await user.save();
    }

    const updated = await User.findById(req.user._id).populate('favorites');

    res.status(200).json({
      success: true,
      message: 'Movie added to your favorites',
      data: updated.favorites
    });
  } catch (err) {
    next(err);
  }
};

const removeFavorite = async (req, res, next) => {
  try {
    const { movieId } = req.params;
    const user = await User.findById(req.user._id);

    user.favorites = user.favorites.filter((f) => f.toString() !== movieId);
    await user.save();

    const updated = await User.findById(req.user._id).populate('favorites');

    res.status(200).json({
      success: true,
      message: 'Movie removed from favorites',
      data: updated.favorites
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getFavorites,
  addFavorite,
  removeFavorite
};
