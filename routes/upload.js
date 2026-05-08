import express from 'express';
import multer from 'multer';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';
import Media from '../models/Media.js';
import { getUser, requireAuth } from '../middleware/auth.js';

const router = express.Router();

function getR2Client() {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId:     process.env.CLOUDFLARE_R2_ACCESS_KEY,
      secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_KEY,
    },
  });
}

const BUCKET = () => process.env.CLOUDFLARE_R2_BUCKET;

const memoryStorage = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

router.post('/upload', memoryStorage.single('file'), async (req, res) => {
  try {
    const user = getUser(req);
    requireAuth(user);

    if (!req.file) return res.status(400).json({ error: 'No file provided' });

    const { mimetype, originalname, buffer, size } = req.file;
    const isVideo = mimetype.startsWith('video/');
    const isImage = mimetype.startsWith('image/');

    if (!isImage && !isVideo) {
      return res.status(400).json({ error: 'Only image and video files are allowed' });
    }

    const ext      = originalname.split('.').pop();
    const fileKey  = `${user.id}/${Date.now()}_${crypto.randomBytes(6).toString('hex')}.${ext}`;
    const r2       = getR2Client();

    await r2.send(new PutObjectCommand({
      Bucket:      BUCKET(),
      Key:         fileKey,
      Body:        buffer,
      ContentType: mimetype,
    }));

    const endpoint  = process.env.CLOUDFLARE_R2_ENDPOINT || `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`;
    const fileUrl   = `${endpoint}/${BUCKET()}/${fileKey}`;

    const media = await Media.create({
      ownerId:  user.id,
      fileUrl,
      fileKey,
      fileType: isVideo ? 'video' : 'image',
      mimeType: mimetype,
      size,
    });

    return res.json({ fileUrl, fileKey, mediaId: media._id.toString(), fileType: media.fileType });
  } catch (err) {
    console.error('[Upload] Error:', err);
    return res.status(err.message === 'Authentication required' ? 401 : 500)
      .json({ error: err.message });
  }
});

router.post('/upload/signed-url', express.json(), async (req, res) => {
  try {
    const user = getUser(req);
    requireAuth(user);

    const { filename, contentType } = req.body;
    if (!filename || !contentType) return res.status(400).json({ error: 'filename and contentType required' });

    const isVideo = contentType.startsWith('video/');
    const isImage = contentType.startsWith('image/');
    if (!isImage && !isVideo) return res.status(400).json({ error: 'Only image/video allowed' });

    const ext     = filename.split('.').pop();
    const fileKey = `${user.id}/${Date.now()}_${crypto.randomBytes(6).toString('hex')}.${ext}`;
    const r2      = getR2Client();

    const signedUrl = await getSignedUrl(
      r2,
      new PutObjectCommand({ Bucket: BUCKET(), Key: fileKey, ContentType: contentType }),
      { expiresIn: 300 }
    );

    const endpoint = process.env.CLOUDFLARE_R2_ENDPOINT || `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`;
    const fileUrl  = `${endpoint}/${BUCKET()}/${fileKey}`;

    return res.json({ signedUrl, fileUrl, fileKey });
  } catch (err) {
    console.error('[Upload] Signed URL error:', err);
    return res.status(err.message === 'Authentication required' ? 401 : 500)
      .json({ error: err.message });
  }
});

export default router;
