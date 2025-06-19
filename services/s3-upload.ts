import AWS from 'aws-sdk';
import multer from 'multer';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

// AWS S3 Configuration
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'krugman-insights-uploads';

// S3 Upload Configuration using custom storage
export const s3Upload = multer({
  storage: {
    _handleFile: function (req: any, file: any, cb: any) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const extension = path.extname(file.originalname);
      const key = `uploads/${file.fieldname}-${uniqueSuffix}${extension}`;
      
      const uploadParams = {
        Bucket: BUCKET_NAME,
        Key: key,
        Body: file.stream,
        ACL: 'public-read',
        ContentType: file.mimetype
      };
      
      s3.upload(uploadParams, (err: any, data: any) => {
        if (err) {
          return cb(err);
        }
        
        // Add location property to file object
        file.location = data.Location;
        file.key = data.Key;
        file.bucket = data.Bucket;
        file.etag = data.ETag;
        
        cb(null, {
          size: file.size,
          filename: key,
          location: data.Location,
          key: data.Key
        });
      });
    },
    _removeFile: function (req: any, file: any, cb: any) {
      s3.deleteObject({
        Bucket: BUCKET_NAME,
        Key: file.key
      }, cb);
    }
  },
  fileFilter: (req, file, cb) => {
    // Allow images and PDFs
    const allowedTypes = /jpeg|jpg|png|gif|pdf|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images and PDFs are allowed'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// Local fallback for development
const localStorage = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadDir = 'uploads';
      if (!require('fs').existsSync(uploadDir)) {
        require('fs').mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const extension = path.extname(file.originalname);
      cb(null, file.fieldname + '-' + uniqueSuffix + extension);
    }
  }),
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images and PDFs are allowed'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// Smart upload handler - uses S3 in production, local in development
export const smartUpload = process.env.NODE_ENV === 'production' && process.env.AWS_ACCESS_KEY_ID 
  ? s3Upload 
  : localStorage;

// Helper function to get full URL for uploaded files
export function getFileUrl(filename: string): string {
  if (process.env.NODE_ENV === 'production' && process.env.AWS_ACCESS_KEY_ID) {
    // S3 URL for production
    return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${filename}`;
  } else {
    // Local URL for development
    return filename.startsWith('/uploads/') ? filename : `/uploads/${filename}`;
  }
}

// Helper function to extract filename from S3 URL or local path
export function extractFilename(url: string): string {
  if (url.includes('s3.amazonaws.com')) {
    // Extract from S3 URL
    return url.split('/').pop() || '';
  } else {
    // Extract from local URL
    return url.replace('/uploads/', '');
  }
}

// Delete file from S3 or local storage
export async function deleteFile(fileUrl: string): Promise<boolean> {
  try {
    if (process.env.NODE_ENV === 'production' && process.env.AWS_ACCESS_KEY_ID && fileUrl.includes('s3.amazonaws.com')) {
      // Delete from S3
      const filename = extractFilename(fileUrl);
      await s3.deleteObject({
        Bucket: BUCKET_NAME,
        Key: filename
      }).promise();
      return true;
    } else {
      // Delete from local storage
      const fs = require('fs');
      const filePath = path.join(process.cwd(), fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return true;
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
}