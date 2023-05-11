import Video from "../models/Video";
import User from "../models/User";

export const home = async (req, res) => {
  const videos = await Video.find({}).sort({ createdAt: "desc" });
  res.render("home", { pageTitle: "Home!", videos });
};

export const watch = async (req, res) => {
  const { id } = req.params;
  const video = await Video.findById(id).populate("owner");
  if (!video) {
    return res.status(404).render("404", { PageTitle: "Video not found..." });
  }
  return res.render("watch", {
    pageTitle: `Watching Video ${video.title}`,
    video,
  });
};

export const getEdit = async (req, res) => {
  const {
    user: { _id },
  } = req.session;
  const { id } = req.params;
  const video = await Video.findById(id);

  if (!video) {
    return res.status(404).render("404", { PageTitle: "Video not found..." });
  }

  if (String(video.owner) !== String(_id)) {
    return res.status(403).render("/");
  }

  return res.render("edit", { pageTitle: `EDIT -> ${video.title}`, video });
};

export const postEdit = async (req, res) => {
  const {
    user: { _id },
  } = req.session;
  const { id } = req.params;
  const { title, description, hashTags } = req.body;
  const video = await Video.exists({ _id: id });

  if (!video) {
    return res.status(404).render("404", { PageTitle: "Video not found..." });
  }

  if (String(video.owner) !== String(_id)) {
    return res.status(403).render("/");
  }

  await Video.findByIdAndUpdate(id, {
    title,
    description,
    hashTags: Video.formatHashTags(hashTags),
  });

  return res.redirect(`/videos/${id}`);
};

export const getUpload = (req, res) => {
  res.render("upload", { pageTitle: "Upload Video..." });
};

export const postUpload = async (req, res) => {
  const { _id } = req.session.user;
  const { title, description, hashTags } = req.body;
  const file = req.file;
  try {
    const newVideo = await Video.create({
      owner: _id,
      fileUrl: file.path,
      title,
      description,
      hashTags,
    });
    const user = await User.findById(_id);
    user.videos.push(newVideo._id);
    user.save();
    return res.redirect("/");
  } catch (error) {
    return res.status(400).render("upload", {
      pageTitle: "Upload Video...",
      errorMsg: error._message,
    });
  }
};

export const deleteVideo = async (req, res) => {
  const { id } = req.params;
  const {
    user: { _id },
  } = req.session;
  const video = await Video.findById(id);
  const user = await User.findById(_id);

  if (!video) {
    res
      .status(404)
      .render("404", { pageTitle: "Sorry, Video is not found...!!" });
  }

  if (String(video.owner) !== String(_id)) {
    return res.status(403).render("/");
  }

  await Video.findByIdAndDelete(id);
  user.videos.splice(user.videos.indexOf(_id), 1);
  user.save();

  return res.redirect("/");
};

export const search = async (req, res) => {
  const { keyword } = req.query;
  let videos = [];
  if (keyword) {
    videos = await Video.find({
      title: {
        $regex: new RegExp(keyword, "i"),
      },
    });
  }
  return res.render("search", { pageTitle: "Search", videos });
};
