export default (sequelize, DataTypes) => {
  const PropertyAmenity = sequelize.define("PropertyAmenity", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    property_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Properties",
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    amenity_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Amenities",
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
  });
  return PropertyAmenity;
};
