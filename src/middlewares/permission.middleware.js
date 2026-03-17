const { Types } = require("mongoose");
const { User } = require("../models/user.model");
const { RolePermission } = require("../models/rolePermission.model");
const { logger } = require("../utils/helpers/logger.util");
const { constants } = require("../utils/constants/history.constant");
const ApiError = require("../errors/ApiErrors");

// Validation constants
const VALID_MODULES = Object.values(constants.Modules);
const VALID_ACTIONS = Object.values(constants.Actions);

const hasPermission = async (userId, module, action) => {
  // Validate userId
  if (!userId || !Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user ID");
  }

  // Validate module
  if (!module || typeof module !== "string" || !VALID_MODULES.includes(module)) {
    throw new ApiError(400, `Invalid module. Must be one of: ${VALID_MODULES.join(", ")}`);
  }

  // Validate action
  if (!action || typeof action !== "string" || !VALID_ACTIONS.includes(action)) {
    throw new ApiError(400, `Invalid action. Must be one of: ${VALID_ACTIONS.join(", ")}`);
  }

  // Fetch user with roles
  const user = await User.findById(userId).populate("roles").lean();
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  if (user.isDisabled) {
    throw new ApiError(403, "User account is disabled");
  }

  const roleIds = user.roles.map((role) => role._id);
  if (!roleIds.length) {
    return false; // No roles, no permissions
  }

  // Check permissions
  const rolePermissions = await RolePermission.aggregate([
    { $match: { role: { $in: roleIds } } },
    {
      $lookup: {
        from: "permissions",
        localField: "permission",
        foreignField: "_id",
        as: "permission",
      },
    },
    { $unwind: "$permission" },
    {
      $match: {
        "permission.module": module,
        "permission.action": action,
        "permission.isActive": true,
      },
    },
  ]);

  const isAuthorized = rolePermissions.length > 0;
  if (isAuthorized) {
    logger.info(`User ${userId} authorized for ${module}_${action} via roles: ${roleIds}`);
  }

  return isAuthorized;
};

const requirePermission = (permissions) => {
  if (!Array.isArray(permissions) || permissions.length === 0) {
    throw new ApiError(500, "Permissions array cannot be empty");
  }

  return async (req, res, next) => {
    try {
      const { _id: userId } = req.user;

      for (const { module, action } of permissions) {
        const isAuthorized = await hasPermission(userId, module, action);
        if (isAuthorized) {
          req.requiredPermission = { module, action };
          return next();
        }
      }

      throw new ApiError(403, "Forbidden: Insufficient permissions");
    } catch (error) {
      next(error instanceof ApiError ? error : new ApiError(500, error.message));
    }
  };
};

module.exports = { hasPermission, requirePermission };
