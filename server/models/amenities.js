export default (sequelize, DataTypes) => {
  const Amenity = sequelize.define("Amenity", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  });
  return Amenity;
};
