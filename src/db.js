import mongoose from "mongoose";

mongoose.connect(process.env.DB_URL);

const db = mongoose.connection;
const handleOpen = () => console.log("✅ Database is connected !!");
const handleErr = (err) => console.log("DB Err =>", err);

db.on("error", handleErr);
db.once("open", handleOpen);
