import ChatRequestSchema from "../models/ChatRequestSchema.js";
import RoomID from "../models/RoomID.js";
import User from "../models/User.js";

export const getMyProfile = async (req, res) => {
    try {
        const userId = req.user.id.toString();
        const myprofile = await User.findById(userId).select("-password");
        //res.json(myprofile);
        const profile = {
            id: myprofile._id,
            role: myprofile.role,
            email: myprofile.email,
            name: myprofile.name,

        };

        res.json(profile);
    } catch (error) {
        res.status(500).json({ message: error.message });

    }
}
// Login
export const getallUsers = async (req, res) => {
    try {
        const currentUserId = req.user.id.toString();
        const vchatusers = await User.find().select("-password");
        const expectMe = vchatusers.filter(user => user._id.toString() !== currentUserId);

        const contacts = await Promise.all(
            expectMe.map(async (user) => {
                const chatRequest = await ChatRequestSchema.findOne({
                    $or: [
                        { senderId: currentUserId, receiverId: user._id.toString() },
                        { senderId: user._id.toString(), receiverId: currentUserId }
                    ],
                });

                if (chatRequest && chatRequest.status === "accepted") return null;

                const requestSent = chatRequest?.senderId.toString() === currentUserId && chatRequest?.status === "pending";
                const requestReceived = chatRequest?.receiverId.toString() === currentUserId && chatRequest?.status === "pending";

                return {
                    ...user._doc,
                    chatRequest,
                    requestSent,
                    requestReceived,
                };
            })
        );

        const filteredContacts = contacts.filter(Boolean);

        res.json(filteredContacts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};


export const getMyChatContacts = async (req, res) => {
    try {
        const currentUserId = req.user.id.toString();

        const chatRequests = await ChatRequestSchema.find({
            $or: [
                { senderId: currentUserId },
                { receiverId: currentUserId }
            ],
            status: "accepted"
        });

        const contacts = await Promise.all(
            chatRequests.map(async (chat) => {
                const isSender = chat.senderId.toString() === currentUserId;
                const contactId = isSender ? chat.receiverId : chat.senderId;
                const contactUser = await User.findById(contactId).select("name email");

                return {
                    status: chat.status,
                    roomId: chat.roomId,
                    user: contactUser
                };
            })
        );

        res.json(contacts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

export const getMyPendigChatContacts = async (req, res) => {
    try {
        const currentUserId = req.user.id.toString();

        const chatRequests = await ChatRequestSchema.find({
            $or: [
                { senderId: currentUserId },
                { receiverId: currentUserId }
            ],
            status: "pending"
        });

        const contacts = await Promise.all(
            chatRequests.map(async (chat) => {
                const isSender = chat.senderId.toString() === currentUserId;
                if (isSender) return null;
                const contactId = isSender ? chat.receiverId : chat.senderId;
                const contactUser = await User.findById(contactId).select("name email");
                if (!contactUser || contactUser._id.toString() === currentUserId) return null;

                return {
                    status: chat.status,
                    roomId: chat.roomId,
                    user: contactUser,
                    buttonStatus: isSender ? "Request_Send" : "Accept/Reject"
                };
            })
        );
        const filteredContacts = contacts.filter(contact => contact !== null);

        res.json(filteredContacts);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}
