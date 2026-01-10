export const authMe = async (req, res) => {
  try {
    const user = req.user; //get form the middleware

    return res.status(200).json({ user });
  } catch (error) {
    console.log("Error get user information: ", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
