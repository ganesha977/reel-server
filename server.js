
const dotenv = require("dotenv");
dotenv.config();

console.log("Loaded SECRET:", process.env.SECRET);

const express = require("express");
const cookieParser = require("cookie-parser");
const db = require("./config/db");
const cors = require("cors");
const userroutes = require("./routes/user.route");
const postroutes = require("./routes/post.route");
const messageroutes = require("./routes/message.route");
const storyroutes = require("./routes/story.route"); 
const reelRouter = require("./routes/reel.route");

require("./controller/story.controller"); 

const { app, server } = require("./Socket");


const PORT = process.env.PORT || 7777;

const corsOptions = {
  origin: [
    "http://localhost:5173", // Local dev
    "https://social-mediagram.netlify.app", // deployed frontend
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

app.use("/api/v1/user", userroutes);
app.use("/api/v1/post", postroutes);
app.use("/api/v1/message", messageroutes);
app.use("/api/v1/story", storyroutes); 
app.use("/api/v1/reel", reelRouter);


db();

app.get("/", (req, res) => {
  res.send("iam coming from server");
  console.log("home");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
