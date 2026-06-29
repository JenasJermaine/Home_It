export default (sequelize, DataTypes) => {
  const PanoramicHotspot = sequelize.define("PanoramicHotspot", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    scene_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "PanoramicScenes",
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    target_scene_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "PanoramicScenes",
        key: "id",
      },
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    },
    type: {
      type: DataTypes.STRING,
      defaultValue: "scene",
    },
    text: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    pitch: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    yaw: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
  });
  return PanoramicHotspot;
};
