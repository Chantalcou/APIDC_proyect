const { DataTypes } = require("sequelize");
const sequelize = require("../config/db.js");
const { v4: uuidv4 } = require("uuid"); // Para generar UUIDs

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.UUID, // Cambia el tipo de dato a UUID
      defaultValue: DataTypes.UUIDV4, // Genera un UUID v4 automáticamente
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    isAdmin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    authProvider: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "auth0",
    },
  },
  {
    tableName: "Users",
    timestamps: true,
  }
);

module.exports = User;
