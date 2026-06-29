export default (sequelize, DataTypes) => {
  const PanoramicScene = sequelize.define("PanoramicScene", {
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
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    image_url: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    pitch: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    yaw: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    hfov: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    display_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  });
  return PanoramicScene;
};
