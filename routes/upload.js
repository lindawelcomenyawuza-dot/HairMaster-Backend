import express from 'express';
import multer from 'multer';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';
import Media from '../models/Media.js';
import { getUser, requireAuth } from '../middleware/auth.js';

const router = express.Router();

function normalizeEndpoint(endpoint, bucket) {
  if (!endpoint) return '';

  const trimmed = endpoint.trim().replace(/\/+$/, '');
  const bucketSuffix = `/${bucket}`;

  if (bucket && trimmed.endsWith(bucketSuffix)) {
    return trimmed.slice(0, -bucketSuffix.length);
  }

  return trimmed;
}

function getR2Config() {
  const bucket = process.env.CLOUDFLARE_R2_BUCKET?.trim();
  const endpoint = normalizeEndpoint(
    process.env.CLOUDFLARE_R2_ENDPOINT ||
      (process.env.CLOUDFLARE_ACCOUNT_ID
        ? `https://${process.env.CLOUDFLARE_ACCOUNT_ID.trim()}.r2.cloudflarestorage.com`
        : ''),
    bucket
  );

  const missing = [];
  if (!bucket) missing.push('CLOUDFLARE_R2_BUCKET');
  if (!endpoint) missing.push('CLOUDFLARE_R2_ENDPOINT or CLOUDFLARE_ACCOUNT_ID');
  if (!process.env.CLOUDFLARE_R2_ACCESS_KEY) missing.push('CLOUDFLARE_R2_ACCESS_KEY');
  if (!process.env.CLOUDFLARE_R2_SECRET_KEY) missing.push('CLOUDFLARE_R2_SECRET_KEY');

  if (missing.length) {
    throw new Error(`Missing R2 environment variables: ${missing.join(', ')}`);
  }

  return {
    bucket,
    endpoint,
    credentials: {
      accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY,
      secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_KEY,
    },
  };
}

function getR2Client({ endpoint, credentials }) {
  return new S3Client({
    region: 'auto',
    endpoint,
    credentials,
  });
}

function getFileUrl(endpoint, bucket, fileKey) {
  return `${endpoint}/${bucket}/${fileKey}`;
}

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

    const ext       = originalname.split('.').pop();
    const fileKey   = `${user.id}/${Date.now()}_${crypto.randomBytes(6).toString('hex')}.${ext}`;
    const r2Config  = getR2Config();
    const r2        = getR2Client(r2Config);

    await r2.send(new PutObjectCommand({
      Bucket:      r2Config.bucket,
      Key:         fileKey,
      Body:        buffer,
      ContentType: mimetype,
    }));

    const fileUrl = getFileUrl(r2Config.endpoint, r2Config.bucket, fileKey);

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

    const ext      = filename.split('.').pop();
    const fileKey  = `${user.id}/${Date.now()}_${crypto.randomBytes(6).toString('hex')}.${ext}`;
    const r2Config = getR2Config();
    const r2       = getR2Client(r2Config);

    const signedUrl = await getSignedUrl(
      r2,
      new PutObjectCommand({ Bucket: r2Config.bucket, Key: fileKey, ContentType: contentType }),
      { expiresIn: 300 }
    );

    const fileUrl = getFileUrl(r2Config.endpoint, r2Config.bucket, fileKey);

    return res.json({ signedUrl, fileUrl, fileKey });
  } catch (err) {
    console.error('[Upload] Signed URL error:', err);
    return res.status(err.message === 'Authentication required' ? 401 : 500)
      .json({ error: err.message });
  }
});

export default router;
