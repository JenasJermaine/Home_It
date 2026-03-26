export default (sequelize, DataTypes) => {
  const Property = sequelize.define("Property", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    property_type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    bedrooms: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 0 },
    },
    bathrooms: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 0 },
    },
    size_sqm: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: { min: 0 },
    },
    land_size_sqm: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: { min: 0 },
    },
    floors: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1 },
    },
    year_built: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1900, max: new Date().getFullYear() },
    },
    condition: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    county: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    subcounty: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    latitude: {
      type: DataTypes.DOUBLE,
      allowNull: false,
      validate: {
        min: -90,
        max: 90,
      },
    },
    longitude: {
      type: DataTypes.DOUBLE,
      allowNull: false,
      validate: {
        min: -180,
        max: 180,
      },
    },
    price: {
      type: DataTypes.DECIMAL(11, 2),
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: "For Sale",
    },
  });
  return Property;
};
