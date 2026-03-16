import express from 'express';

import { addAsset, getAssets, getAssetbyId, filterAsset, assetUpdateById, assetDeletById } from '../controllers/assetsController.js';

const router = express.Router();

router.post('/addAsset', addAsset);
router.get('/getAssets', getAssets);
router.get('/getAssets/:id', getAssetbyId);
router.post('/filterAsset', filterAsset);
router.put('/updateAsset/:id', assetUpdateById);
router.delete('/deleteAsset/:id', assetDeletById);
export default router;

