import express from "express";
import {
  getEdit,
  postEdit,
  login,
  logout,
  see,
  startGithubLogin,
  finishGithubLogin,
  getChangePwd,
  postChangePwd,
} from "../controllers/userController";
import {
  protectorMiddleware,
  publicOnlyMiddleware,
  uploadAvatar,
} from "../middlewares";

const userRouter = express.Router();

userRouter.get("/logout", protectorMiddleware, logout);
userRouter
  .route("/edit")
  .all(protectorMiddleware)
  .get(getEdit)
  .post(uploadAvatar.single("avatar"), postEdit);
userRouter.get("/github/start", publicOnlyMiddleware, startGithubLogin);
userRouter.get("/github/callback", publicOnlyMiddleware, finishGithubLogin);
userRouter
  .route("/change-pwd")
  .all(protectorMiddleware)
  .get(getChangePwd)
  .post(postChangePwd);
userRouter.get("/:id", see);

export default userRouter;
