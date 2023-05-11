import User from "../models/User";
import Video from "../models/Video";
import bcrypt from "bcrypt";
import fetch from "node-fetch";

export const getJoin = (req, res) => {
  res.render("join", { pageTitle: "CreateAccount..." });
};

export const postJoin = async (req, res) => {
  const { email, username, password, password2, name, location } = req.body;
  const pageTitle = "Join";
  const exist = await User.exists({ $or: [{ username }, { email }] });
  if (exist) {
    return res.status(400).render("join", {
      pageTitle,
      errorMsg: "Sorry, Username OR email is already taken.",
    });
  }
  if (password !== password2) {
    return res.status(400).render("join", {
      pageTitle,
      errorMsg: "Sorry, your password doesn't match",
    });
  }
  try {
    await User.create({
      email,
      username,
      password,
      name,
      location,
    });
    res.redirect("/login");
  } catch (error) {
    return res.status(400).render("join", {
      pageTitle,
      errorMsg: error._message,
    });
  }
};

export const getLogin = (req, res) => {
  return res.render("login", { pageTitle: "Log-In" });
};

export const postLogin = async (req, res) => {
  const pageTitle = "Log-In";
  const { username, password } = req.body;
  const user = await User.findOne({ username, socialOnly: false });
  if (!user) {
    return res.status(400).render("login", {
      pageTitle,
      errorMsg: "Sorry, User is not exist...",
    });
  }
  const pwOk = await bcrypt.compare(password, user.password);
  if (!pwOk) {
    return res.status(400).render("login", {
      pageTitle,
      errorMsg: "Sorry, Password Incorrect...",
    });
  }
  req.session.loggedIn = true;
  req.session.user = user;
  return res.redirect("/");
};

export const startGithubLogin = async (req, res) => {
  const baseUrl = "https://github.com/login/oauth/authorize";
  const config = {
    client_id: process.env.GH_CLIENT,
    allow_signup: false,
    scope: "read:user user:email",
  };
  const params = new URLSearchParams(config).toString();
  const finalUrl = `${baseUrl}?${params}`;
  return res.redirect(finalUrl);
};

export const finishGithubLogin = async (req, res) => {
  // Step 1. URL 작성 및 세팅값 설정 -> Post 요청을 할 URL을 받기 위함.
  const baseUrl = "https://github.com/login/oauth/access_token";
  const config = {
    client_id: process.env.GH_CLIENT,
    client_secret: process.env.GH_SECRET,
    code: req.query.code,
  };
  const params = new URLSearchParams(config).toString();
  const finalUrl = `${baseUrl}?${params}`;

  //Step 2. Code로 받아온 URL 로 POST 요청을 보냄. Fetch 사용. => Token 값을 받기 위함.
  const tokenRequest = await (
    await fetch(finalUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
    })
  ).json();

  //Step 3. Token을 사용해 필요한 데이터를 확보, 로그인 처리 => Step1의 Config 값에서 설정한 것들.
  if ("access_token" in tokenRequest) {
    const { access_token } = tokenRequest;
    const apiUrl = "https://api.github.com";
    const userData = await (
      await fetch(`${apiUrl}/user`, {
        headers: {
          Authorization: `token ${access_token}`,
        },
      })
    ).json();
    const emailData = await (
      await fetch(`${apiUrl}/user/emails`, {
        headers: {
          Authorization: `token ${access_token}`,
        },
      })
    ).json();
    const emailObj = emailData.find(
      (email) => email.primary === true && email.verified === true
    );
    if (!emailObj) {
      console.log("Primary, and Verified Mail account is not existed...");
      return redirect("/");
    }

    let user = await User.findOne({ email: emailObj.email });
    if (!user) {
      user = await User.create({
        name: userData.name,
        avatarUrl: userData.avatar_url,
        socialOnly: true,
        username: userData.login,
        email: emailObj.email,
        password: "",
        location: userData.location,
      });
    }
    //User returned.. Must be logged in..
    req.session.user = user;
    req.session.loggedIn = true;
    return res.redirect("/");
  } else {
    return res.redirect("/");
  }
};

export const logout = (req, res) => {
  req.session.destroy();
  return res.redirect("/");
};

export const getEdit = (req, res) => {
  res.render("edit-profile", { pageTitle: "Edit Profile" });
};

export const postEdit = async (req, res) => {
  const {
    session: {
      user: { _id, avatarUrl, email: sessionEmail, username: sessionUsername },
    },
    body: { name, username, email, location },
    file,
  } = req;

  const searchParams = [];
  if (sessionEmail !== email) {
    searchParams.push({ email });
  }
  if (sessionUsername !== username) {
    searchParams.push({ username });
  }

  if (searchParams.length > 0) {
    const foundUser = await User.findOne({ $or: searchParams });
    console.log("foundUser->", foundUser);
    if (foundUser && foundUser._id.toString() !== _id) {
      return res.status(404).render("edit-profile", {
        pageTitle: "edit-Profile",
        errorMsg: "Sorry, username or Email is taken...",
      });
    }
  }

  // 여기 findByIdAndUpdate 구문에 3개의 인자가 전달되는거 각각 뭘 전달한건지, 특히 마지막 걸 잘 기억해낼 수 있어야한다.
  const updatedUser = await User.findByIdAndUpdate(
    _id,
    {
      avatarUrl: file ? file.path : avatarUrl,
      name,
      username,
      email,
      location,
    },
    { new: true }
  );

  req.session.user = updatedUser;
  res.redirect("/users/edit");
};

export const getChangePwd = (req, res) => {
  if (req.session.user.socialOnly === true) {
    return res.redirect("/");
  }
  return res.render("change-pwd", { pageTitle: "Change-Password" });
};

export const postChangePwd = async (req, res) => {
  const {
    body: { oldpwd, newpwd, newpwdconfirm },
    session: {
      user: { _id },
    },
  } = req;

  const user = await User.findById(_id);

  const pwOk = await bcrypt.compare(oldpwd, user.password);
  if (!pwOk) {
    return res.status(400).render("change-pwd", {
      pageTitle: "Change-Password",
      errorMsg: "Password Incorrect..",
    });
  }

  if (newpwd !== newpwdconfirm) {
    return res.status(400).render("change-pwd", {
      pageTitle: "Change-Password",
      errorMsg: "Your password doesn't match.",
    });
  }

  user.password = newpwd;
  await user.save();

  return res.redirect("/users/logout");
};

export const see = async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id).populate("videos");
  if (!user) {
    return res.status(404).render("404");
  }
  res.render("users/profile", {
    pageTitle: `${user.username}'s Profile`,
    user,
  });
};
