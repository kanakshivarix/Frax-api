const { Schema, model } = require("mongoose");

const RolePermissionSchema = new Schema(
  {
    role: { type: Schema.Types.ObjectId, ref: "Role", required: true },
    permission: { type: Schema.Types.ObjectId, ref: "Permission", required: true },
  },
  { timestamps: true }
);

const RolePermission = model("RolePermission", RolePermissionSchema);
module.exports = { RolePermission };
