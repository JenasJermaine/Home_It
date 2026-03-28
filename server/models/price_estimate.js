export default (sequelize, DataTypes) => {
  const PriceEstimate = sequelize.define("PriceEstimate", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    property_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "Properties",
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    source_type: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    predicted_price: {
      type: DataTypes.DECIMAL(11, 2),
      allowNull: false,
    },
    input_features_json: {
      type: DataTypes.JSON,
      allowNull: false,
    },
  });
  return PriceEstimate;
};
