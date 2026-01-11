import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/Users.js";
import crypto from "crypto";
import Session from "../models/Session.js";

const ACCESS_TOKEN_TTL = "30m";
const REFRESH_TOKEN_TTL = 14 * 24 * 60 * 60 * 1000;

export const signUp = async (req, res) => {
  try {
    const { username, password, email, firstName, lastName } = req.body;

    if (!username || !password || !email || !firstName || !lastName) {
      return res.status(400).json({
        message:
          "username, password, email, firstName and lastName are required",
      });
    }

    // check user exist
    const user = await User.findOne({ username });

    if (user) {
      return res.status(400).json({
        message: `User with name ${username} is already exist`,
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // create new User
    await User.create({
      username,
      hashedPassword,
      email,
      displayName: `${firstName} ${lastName}`,
    });

    // return
    return res.sendStatus(204);
  } catch (error) {
    console.error("Sign up error: ", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const signIn = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "username and password are required" });
    }

    // get hashedPassword from database
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({
        message: "username or password not correct",
      });
    }

    // check password
    const passwordCorrect = await bcrypt.compare(password, user.hashedPassword);

    if (!passwordCorrect) {
      return res
        .status(401)
        .json({ message: "username or password not correct" });
    }

    // if match, generate access token with jwt
    const accessToken = jwt.sign(
      { userId: user._id },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: ACCESS_TOKEN_TTL }
    );

    // generate refresh token
    const refreshToken = crypto.randomBytes(64).toString("hex");

    // Create session to save refresh token in db
    await Session.create({
      userId: user._id,
      refreshToken,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL),
    });

    //return refresh token to client through cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none", //allow backend, frontend deploy separately
      maxAge: REFRESH_TOKEN_TTL,
    });

    // return access token
    return res.status(200).json({
      message: `User ${user.displayName} logged in`,
      accessToken,
    });
  } catch (error) {
    console.error("Sign in error: ", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const signOut = async (req, res) => {
  try {
    // get refresh token from cookie
    const token = req.cookies?.refreshToken;

    if (token) {
      // clear refresh token in Session
      await Session.deleteOne({ refreshToken: token });
      // clear cookie
      res.clearCookie("refreshToken");
    }

    res.sendStatus(204);
  } catch (error) {
    console.error("Sign out error: ", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const refreshToken = async (req, res) => {
  try {
    // get refresh token from cookie
    const token = req.cookies?.refreshToken;

    if (!token) {
      return res.status(401).json({ message: "Token not found" });
    }

    // compare refresh token in db
    const session = await Session.findOne({ refreshToken: token });

    if (!session) {
      return res.status(403).json({ message: "Invalid token or expired" });
    }

    // check expiration
    if (session.expiresAt < new Date()) {
      return res.status(403).json({ message: "Token is expired" });
    }

    // generate new access token
    const accessToken = jwt.sign(
      { userId: session.userId },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: ACCESS_TOKEN_TTL }
    );

    // return
    return res.status(200).json({ accessToken });
  } catch (error) {
    console.error("Error when call refresh token: ", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
