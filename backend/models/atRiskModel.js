import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";
import Student from "./studentModel.js";

const AtRisk = sequelize.define(
  "AtRisk",
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },

    // Link/snapshot
    studentId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    srn: { type: DataTypes.STRING(20), allowNull: false, unique: true },

    // Snapshot fields (denormalized for quick display)
    name: { type: DataTypes.STRING(120), allowNull: false },
    section: { type: DataTypes.STRING(5), allowNull: false },
    email: { type: DataTypes.STRING(160), allowNull: false },
    phone: { type: DataTypes.STRING(20), allowNull: false },

    attendance: { type: DataTypes.FLOAT, allowNull: false },
    physics: { type: DataTypes.FLOAT, allowNull: false },
    chemistry: { type: DataTypes.FLOAT, allowNull: false },
    maths: { type: DataTypes.FLOAT, allowNull: false },

    reason: { type: DataTypes.STRING(255), allowNull: false }, // e.g. "Attendance 62%, Chemistry 35"
  },
  {
    tableName: "atrisk",
    timestamps: true,
    indexes: [{ unique: true, fields: ["srn"] }],
  }
);

// (Optional) association
AtRisk.belongsTo(Student, { foreignKey: "studentId", targetKey: "id" });

export default AtRisk;
