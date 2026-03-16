const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    // -------------------------
    // AUTH
    // -------------------------
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },

    passwordHash: {
      type: String,
      required: true,
      select: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // -------------------------
    // BASIC PROFILE
    // -------------------------
    bio: {
      type: String,
      maxlength: 300,
      default: "",
    },

    photos: {
      type: [String],
      default: [],
    },

    dateOfBirth: {
      type: Date,
      required: true,
    },

    gender: {
      type: String,
      enum: ["male", "female", "non-binary", "prefer_not_to_say"],
      default: "prefer_not_to_say",
    },

    fitnessLevel: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      required: true,
    },

    workoutTypes: {
      type: [String],
      enum: [
        "running",
        "weightlifting",
        "yoga",
        "crossfit",
        "cycling",
        "swimming",
        "hiit",
        "pilates",
        "boxing",
        "calisthenics",
        "rock_climbing",
        "martial_arts",
        "team_sports",
        "other",
      ],
      default: [],
    },

    // -------------------------
    // LOCATION (GEO SEARCH)
    // -------------------------
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        // default: undefined, // not forced at registration
      },
    },

    radiusPreference: {
      type: Number,
      default: 10,
      min: 1,
      max: 100,
    },

    // -------------------------
    // MATCHING PREFERENCES
    // -------------------------
    agePreference: {
      min: { type: Number, default: 18, min: 18 },
      max: { type: Number, default: 60, max: 100 },
    },

    genderPreference: {
      type: [String],
      enum: ["male", "female", "non-binary", "prefer_not_to_say"],
      default: ["male", "female", "non-binary", "prefer_not_to_say"],
    },

    // -------------------------
    // SAFETY
    // -------------------------
    blockedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    // -------------------------
    // SYSTEM
    // -------------------------
    isProfileComplete: {
      type: Boolean,
      default: false,
    },

    lastActiveAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

//
// INDEXES
//

// Geo index (required for $geoNear)
userSchema.index({ location: "2dsphere" }, { sparse: true });

// Used in discovery sorting
userSchema.index({ fitnessLevel: 1, lastActiveAt: -1 });

// Filter by workout type
userSchema.index({ workoutTypes: 1 });

// Exclude inactive/incomplete users efficiently
userSchema.index({ isActive: 1, isProfileComplete: 1 });

//
// PROFILE COMPLETION HOOK
//

userSchema.pre("save", async function () {
  const requiredFields = [
    this.name,
    this.email,
    this.dateOfBirth,
    this.fitnessLevel,
    this.photos?.length > 0,
    this.location?.coordinates?.length === 2,
    this.workoutTypes?.length > 0,
  ];

  this.isProfileComplete = requiredFields.every(Boolean);
});

module.exports = mongoose.model("User", userSchema);
