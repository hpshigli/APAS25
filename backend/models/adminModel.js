// backend/models/adminModel.js
import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

const Admin = sequelize.define(
  "Admin",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    name: { type: DataTypes.STRING(120), allowNull: false },
    email: {
      type: DataTypes.STRING(160),
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    pesId: {
      type: DataTypes.STRING(13),
      allowNull: false,
      unique: true, // e.g., "PES1234567"
    },
    password: { type: DataTypes.STRING(255), allowNull: false },
  },
  {
    tableName: "admins",
    timestamps: true,
    indexes: [{ unique: true, fields: ["email"] }, { unique: true, fields: ["pesId"] }],
  }
);

export default Admin;
