const { Schema, model } = require("mongoose");
const { constants } = require("../utils/constants/history.constant");

const PermissionSchema = new Schema(
  {
    module: { type: String, required: true }, // e.g., "user", "admin", "manager"
    action: {
      type: String,
      required: true,
      enum: Object.values(constants.Actions),
      trim: true,
    },
    name: { type: String, required: true, unique: true }, // e.g., "user:read" , "admin:delete"
    description: { type: String },
    isActive: { type: Boolean, default: true }, // Enable/disable permission
  },
  { timestamps: true }
);

PermissionSchema.pre("validate", function (next) {
  this.name = `${this.module}:${this.action}`;
  next();
});

const Permission = model("Permission", PermissionSchema);

module.exports = { Permission };
