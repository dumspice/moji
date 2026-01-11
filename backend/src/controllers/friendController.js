import Friend from "../models/Friend.js";
import User from "../models/Users.js";
import FriendRequest from "../models/FriendRequest.js";

export const sendFriendRequest = async (req, res) => {
  try {
    const { to, message } = req.body; // get from body

    const from = req.user._id; // get from middleware

    //prevent sender send request to themselves
    if (from === to) {
      return res
        .status(400)
        .json({ message: "Không thể gửi lời mời kết bạn cho chính mình" });
    }

    // check user exist
    const userExist = await User.exists({ _id: to });

    if (!userExist) {
      return res.status(404).json({ message: "Người dùng không tồn tại" });
    }

    // Convert ObjectId to string so they can be compared
    let userA = from.toString();
    let userB = to.toString();

    // Normalize user order to avoid duplicate friend records
    // Example: A-B and B-A will always be stored as A-B
    if (userA > userB) {
      [userA, userB] = [userB, userA];
    }

    // Run two queries in parallel:
    // 1. Check if the two users are already friends
    // 2. Check if a friend request already exists between them (in both directions)
    const [alreadyFriends, existingRequest] = await Promise.all([
      // Look for an existing friendship between the two users
      // If found => they are already friends => do not allow sending another request
      Friend.findOne({ userA, userB }),

      // Look for an existing friend request between the two users
      // Check both directions:
      // - from -> to
      // - to -> from
      // If found => do not create a new request (prevents duplicates / spam)
      FriendRequest.findOne({
        $or: [
          { from, to },
          { from: to, to: from },
        ],
      }),
    ]);

    if (alreadyFriends) {
      return res.status(400).json({ message: "Hai người đã là bạn bè" });
    }

    if (existingRequest) {
      return res.status(400).json({ message: "Có lời mời kết bạn đang chờ" });
    }

    const request = await FriendRequest.create({
      from,
      to,
      message,
    });

    return res
      .status(201)
      .json({ message: "Gửi lời mời kết bạn thành công", request });
  } catch (error) {
    console.error("Error adding friend: ", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const acceptFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id; // get from middleware

    const request = await FriendRequest.findById(requestId);

    if (!request) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy lời mời kết bạn" });
    }

    // allow only receiver to response the request
    if (request.to.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền chấp nhận lời mời này" });
    }

    // create a friendships
    const friend = await Friend.create({
      userA: request.from,
      userB: request.to,
    });

    // delete the request
    await FriendRequest.findByIdAndDelete(requestId);

    const from = await User.findById(request.from)
      .select("_id displayName avatarUrl")
      .lean();

    return res.status(200).json({
      message: "Chấp nhận lời mời kết bạn thành công",
      newFriend: {
        _id: from?._id,
        displayName: from?.displayName,
        avatarUrl: from?.avatarUrl,
      },
    });
  } catch (error) {
    console.error("Error accept friend request: ", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const declineFriendRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;

    const request = await FriendRequest.findById(requestId);

    if (!request) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy lời mời kết bạn" });
    }

    // allow only receiver to response the request
    if (request.to.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền chấp nhận lời mời này" });
    }

    await FriendRequest.findByIdAndDelete(requestId);

    return res.sendStatus(204);
  } catch (error) {
    console.error("Error decline friend request: ", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getAllFriends = async (req, res) => {
  try {
    const userId = req.user._id; //get from middleware

    // find user is either user A of user B in the friendship
    const friendships = await Friend.find({
      $or: [
        {
          userA: userId,
        },
        {
          userB: userId,
        },
      ],
    })
      .populate("userA", "_id displayName avatarUrl")
      .populate("userB", "_id displayName avatarUrl")
      .lean();

    if (!friendships.length) {
      return res.status(200).json({ friends: [] }); // if user has no friend, return empty array
    }

    const friends = friendships.map(
      (f) => (f.userA._id.toString() === userId.toString() ? f.userB : f.userA) // check if equal then the friend is userB, if not, the friend is user A
    );

    return res.status(200).json({ friends });
  } catch (error) {
    console.error("Error get all friends: ", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getFriendRequests = async (req, res) => {
  try {
    const userId = req.user._id; //get from middleware

    const populateFields = "_id username displayName avatarUrl"; // populate var to get data

    // get the friend request from both sender or receiver,
    const [sent, received] = await Promise.all([
      // if userId match from, mean that the user is the sender
      FriendRequest.find({ from: userId }).populate("to", populateFields),

      // if the userId match to, meant that the user is the receiver
      FriendRequest.find({ to: userId }).populate("from", populateFields),
    ]);

    res.status(200).json({ sent, received });
  } catch (error) {
    console.error("Error get friends request: ", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
