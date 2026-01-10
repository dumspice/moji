import jwt from "jsonwebtoken";
import User from "../models/Users.js";

export const protectedRoute = (req, res, next) => {
  try {
    // get token from header
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res
        .status(401)
        .json({ message: "Access token not found or expired" });
    }

    // verify token
    jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET,
      async (err, decodedUser) => {
        if (err) {
          console.error(err);

          return res.status(403).json({ message: "Unauthorize User" });
        }

        // find user
        const user = await User.findById(decodedUser.userId).select(
          "-hashedPassword"
        );

        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        // return user
        req.user = user;
        next();
      }
    );
  } catch (error) {
    console.log("Error verify JWT in middleware: ", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
