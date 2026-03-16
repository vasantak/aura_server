import { dummyusers } from "../utils/dummyUserData.js";

export const getDummyUserByID = async (req, res) => {
    const { id } = req.body;
    console.log("Requested User ID:", id);
    const userId = Number(id);
    const user = dummyusers.find(u => u.id === id);
    if (user) {
        res.json({ user });
    } else {
        res.status(404).json({ message: "User not found" });
    }
}


export const deleteDummyUserByID = async (req, res) => {
    debugger;
    const { id } = req.body;
    const user = dummyusers.find(u => u.id === id);
    console.log("Dummy Users List:", user);
    debugger
    if (user) {
        const user1 = dummyusers;//.find(u => u.id === id);
        console.log("Dummy Users List:", user1.length);
        const user = dummyusers.filter(u => u.id !== id);
        console.log("Dummy Users List 2:", user.length);
        res.json({ user });
    } else {
        res.status(404).json({ message: "User not found" });
    }
}
