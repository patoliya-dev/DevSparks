import dotenv from "dotenv";
import express from "express";
import router from "./routes/index.js";
import mongoose from "mongoose";
import { initModel } from "./config/llm.js";

const app = express();
dotenv.config();
mongoose.connect(process.env.MONGODB_URI);

initModel();

app.use(express.json());

app.use("/api", router);

app.get("/", (req, res) => {
  return res.json({ message: "Hello World!" });
});

app.listen(process.env.PORT, () => {
  console.log(`port run in ${process.env.PORT} Port`);
});

export default app;
