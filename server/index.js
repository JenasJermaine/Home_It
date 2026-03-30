import "dotenv/config";
import express from "express";
import cors from "cors";
import db from "./models/index.js";

const app = express();
const PORT = 8090;

//Middleware
app.use(cors());
app.use(express.json());

app.use("/", (req, res) => {
  res.send("Hello World...");
});

//Error handling
app.use((err, req, res, next) => {
  console.log(err.stack);
  res.send(500).send("Something broke" + err);
});

db.sequelize
  .sync()
  .then(() => {
    console.log("database conected successfully");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("DB failed:", err);
  });
