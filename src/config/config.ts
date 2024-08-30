import { S3Client } from '@aws-sdk/client-s3'
import dotenv from 'dotenv'

dotenv.config()

export const cfg = {
  server: {
    port: '3000',
  },
  mysql: {
    host: 'localhost',
    user: 'root',
    password: 'senha',
    database: 'meter_reading',
    connectionLimit: 10,
  }
}

export const s3Client = new S3Client({
  region: process.env.AWS_REGION || '',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
})
