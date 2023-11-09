import express from "express";
import router from "./router";
import morgan from "morgan";
import cors from "cors";
import * as dotenv from "dotenv";
import { protection } from "./modules/auth";
import { createUser, signin } from "./handlers/authHandler";
import config from "./config";
import { extractText } from "./handlers/fileHandler";
import multer from "multer";
import { getParticipantQuiz } from "./handlers/quizHandler";
const upload = multer({ dest: "./uploads" });

dotenv.config();

const app = express();
const port = config.port;

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req: any, res: any) => {
  res.json({ message: "hello, api is live" });
});

app.post("/signup", createUser);
app.post("/signin", signin);

app.post("/extract-text", upload.single("file"), extractText);

app.get("/quiz", getParticipantQuiz); //get a single quiz for a particular participant

app.use("/api", protection, router); //all endpoints inside router are protected

app.listen(port, () => {
  console.log(`app listening on port ${port}`);
});
