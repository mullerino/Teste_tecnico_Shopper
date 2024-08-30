import { S3Client } from '@aws-sdk/client-s3'
import dotenv from 'dotenv'

dotenv.config()

export const cfg = {
  server: {
    port: '3000',
  },
  mysql: {
    host: process.env.DB_HOST || 'db',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'senha',
    database: process.env.DB_NAME || 'shopper',
    connectionLimit: 10,
  }
}

export const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  }
})
