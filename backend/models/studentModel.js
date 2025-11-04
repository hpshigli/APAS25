import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

const Student = sequelize.define(
  "Student",
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(120), allowNull: false },
    srn: { type: DataTypes.STRING(20), allowNull: false, unique: true }, // e.g., 01FB22A001
    section: { type: DataTypes.STRING(5), allowNull: false },
    email: { type: DataTypes.STRING(160), allowNull: false, validate: { isEmail: true } },
    phone: { type: DataTypes.STRING(20), allowNull: false },
    attendance: { type: DataTypes.FLOAT, allowNull: false },  // %
    physics: { type: DataTypes.FLOAT, allowNull: false },
    chemistry: { type: DataTypes.FLOAT, allowNull: false },
    maths: { type: DataTypes.FLOAT, allowNull: false },
  },
  {
    tableName: "students",
    timestamps: true,
    indexes: [{ unique: true, fields: ["srn"] }],
  }
);

export default Student;
