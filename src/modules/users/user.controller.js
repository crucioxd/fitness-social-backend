const User = require("./user.model");

// Fields a user is allowed to update on their own profile
const ALLOWED_UPDATE_FIELDS = [
  "bio",
  "photos",
  "workoutTypes",
  "location",
  "radiusPreference",
  "genderPreference",
  "agePreference",
  "fitnessLevel",
  "availability",
  "gender",
  "onboardingStep",
  "deviceToken",
];

// -------------------------
// PUT /api/users/profile
// -------------------------
const updateProfile = async (req, res) => {
  try {
    // Build a clean update object from only allowed fields
    const updates = {};
    ALLOWED_UPDATE_FIELDS.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    updates.lastActiveAt = new Date();

    // findByIdAndUpdate with runValidators ensures schema rules are enforced
    // (e.g. enum values, min/max) on update, not just on create
    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true, // return the updated document
      runValidators: true, // run schema validators on the update
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// -------------------------
// GET /api/users/feed
// -------------------------
const getFeed = async (req, res) => {
  try {
    const currentUser = req.user;

    // Can't run a geo query without coordinates
    if (
      !currentUser.location?.coordinates ||
      currentUser.location.coordinates.length !== 2
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Location not set. Please update your profile with a location.",
      });
    }

    // Convert age preference into date of birth boundaries
    // We filter by DOB because age changes daily but DOB doesn't
    const now = new Date();

    const minBirthDate = new Date(now);
    minBirthDate.setFullYear(now.getFullYear() - currentUser.agePreference.max);

    const maxBirthDate = new Date(now);
    maxBirthDate.setFullYear(now.getFullYear() - currentUser.agePreference.min);

    // Build the IDs to exclude: self + blocked users
    // Fix: can't combine $ne and $nin on same field — merge into one $nin
    const excludedIds = [currentUser._id, ...(currentUser.blockedUsers || [])];

    // Build workout type filter conditionally
    // Fix: $in: [] matches nothing — skip the filter if user has no workout types set
    const workoutFilter =
      currentUser.workoutTypes?.length > 0
        ? { workoutTypes: { $in: currentUser.workoutTypes } }
        : {};

    const users = await User.aggregate([
      // Stage 1 — geo search (must be first stage when using $geoNear)
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: currentUser.location.coordinates,
          },
          distanceField: "distance", // metres added to each result doc
          maxDistance: currentUser.radiusPreference * 1000, // km → metres
          spherical: true,
        },
      },

      // Stage 2 — filter candidates
      {
        $match: {
          _id: { $nin: excludedIds }, // exclude self + blocked
          isActive: true,
          isProfileComplete: true,
          gender: { $in: currentUser.genderPreference },
          dateOfBirth: {
            $gte: minBirthDate,
            $lte: maxBirthDate,
          },
          ...workoutFilter, // conditionally applied
        },
      },

      // Stage 3 — cap early to reduce cost of the two lookups below
      { $limit: 100 },

      // Stage 4 — exclude users already swiped
      {
        $lookup: {
          from: "swipes",
          let: { candidateId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$fromUser", currentUser._id] },
                    { $eq: ["$toUser", "$$candidateId"] },
                  ],
                },
              },
            },
          ],
          as: "alreadySwiped",
        },
      },
      {
        $match: { alreadySwiped: { $size: 0 } },
      },

      // Stage 5 — exclude users already connected
      {
        $lookup: {
          from: "connections",
          let: { candidateId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $in: [currentUser._id, "$users"] },
                    { $in: ["$$candidateId", "$users"] },
                  ],
                },
              },
            },
          ],
          as: "alreadyConnected",
        },
      },
      {
        $match: { alreadyConnected: { $size: 0 } },
      },

      // Stage 6 — final batch size for client
      { $limit: 20 },

      // Stage 7 — strip sensitive/internal fields before sending
      {
        $project: {
          passwordHash: 0,
          blockedUsers: 0,
          reportCount: 0,
          deviceToken: 0,
          alreadySwiped: 0,
          alreadyConnected: 0,
        },
      },
    ]);

    res.json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Feed error:", error);
    res.status(500).json({
      success: false,
      message: "Something went wrong loading the feed",
    });
  }
};

module.exports = {
  updateProfile,
  getFeed,
};
