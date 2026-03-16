
import Asset from "../models/Assets.js";

export const addAsset = async (req, res) => {
    try {
        const { name, type, value } = req.body;
        if (!name || !type || !value) {
            return res.status(400).json({ message: "All fields are required" });
        }
        const newAsset = new Asset({ name, type, value });
        await newAsset.save();
        // await newAsset.save();
        res.status(201).json({ message: "Asset added", asset: newAsset });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const getAssets = async (req, res) => {
    try {
        const assets = await Asset.find();
        return res.status(200).json(assets);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
}

export const getAssetbyId = async (req, res) => {
    try {
        const asset = await Asset.findById(req.params.id);
        if (!asset) {
            return res.status(404).json({ message: "Asset not found" });
        }
        return res.status(200).json(asset);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}



export const assetUpdateById = async (req, res) => {
    try {
        const asset = await Asset.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!asset) {
            return res.status(404).json({ message: "Asset not found" });
        }
        return res.status(200).json(asset);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
}


export const filterAsset = async (req, res) => {
    try {
        const page = req.body.page || 1;
        const limit = req.body.limit || 10;
        const skip = (page - 1) * limit;
        const assets = await Asset.find({}).skip(skip).limit(limit);
        const total = await Asset.countDocuments();
        res.status(200).json({
            page,
            limit,
            totalPages: Math.ceil(total / limit),
            totalAssets: total,
            assets
        });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
}

export const assetDeletById = async (req, res) => {
    try {
        const asset = await Asset.deleteOne({ _id: req.params.id });
        if (!asset) {
            return res.status(404).json({ message: "Asset not found" });
        }
        res.status(200).json({ message: "Asset deleted successfully" });
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
}