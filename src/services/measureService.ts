import mysql, { Connection, RowDataPacket } from 'mysql2/promise'
import { v4 as uuidv4 } from 'uuid'
import { ConfirmMeterReadingRequest, UploadMeterReadingRequest } from '../types/measure'
import { s3Client, cfg } from '../../config/config'

import { PutObjectCommand, PutObjectCommandInput } from '@aws-sdk/client-s3'
import { GoogleGenerativeAI } from '@google/generative-ai'
import logger from '../../log/logger'

async function extractMeasure(imageBase64: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY as string
  const genAI = new GoogleGenerativeAI(apiKey)

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

  const prompt = "Analyze the provided image of a water or gas meter. Identify and extract the current consumption reading displayed on the meter. Please return only the numerical value of the reading, without the unit of measurement. Ensure the reading is accurate and corresponds to the displayed value on the meter.";

  const image = {
    inlineData: {
      data: imageBase64,
      mimeType: "image/png",
    }
  }
  
  try {
    const result = await model.generateContent([prompt, image])
    return result.response.text()
  } catch (error) {
    logger.error("Error identifying measure:", error)
    throw new Error("Failed to identify measure")
  }
}

async function connectToDatabase(): Promise<Connection> {
  const connection = await mysql.createConnection({
    host: cfg.mysql.host,
    user: cfg.mysql.user,
    password: cfg.mysql.password,
    database: cfg.mysql.database,
    connectionLimit: 10,
  })

  return connection
}

async function uploadImageAndGetUrl(imageBase64: string, customerCode: string, measureUuid: string): Promise<string> {
  const s3Key = `${customerCode}/${measureUuid}.jpg`
  const base64Data = Buffer.from(imageBase64.replace(/^data:image\/\w+;base64,/, ""), 'base64')

  const s3Params: PutObjectCommandInput = {
    Bucket: process.env.BUCKET_NAME || 'account-imgs',
    Key: s3Key,
    Body: base64Data,
    ContentEncoding: 'base64',
    ContentType: 'image/jpeg',
  }

  const command = new PutObjectCommand(s3Params)
  await s3Client.send(command)

  const objectUrl = `https://${process.env.BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`

  return objectUrl
}

export async function uploadMeasure(body: UploadMeterReadingRequest) {
  const { image, customer_code, measure_datetime, measure_type } = body

  const connection : Connection = await connectToDatabase()

  try {
    if (!image || !customer_code || !measure_datetime || !measure_type) {
      throw new Error('INVALID_DATA: Todos os campos são obrigatórios.')
    }

    const measureValue = await extractMeasure(image)

    const [existingMeasures] = await connection.execute<RowDataPacket[]>(
      'SELECT * FROM measures WHERE customer_code = ? AND measure_type = ? AND MONTH(measure_datetime) = MONTH(?)',
      [customer_code, measure_type, measure_datetime]
    )

    if(existingMeasures.length !== 0) {
      throw new Error('DOUBLE_REPORT: Já existe uma leitura para este mês e tipo.')
    }

    const measureUuid = uuidv4()
    const imageUrl = await uploadImageAndGetUrl(image, customer_code, measureUuid)

    const query = `
    INSERT INTO measures (
      customer_code, 
      measure_uuid, 
      measure_datetime, 
      measure_type, 
      image_url
    ) VALUES (?, ?, ?, ?, ?)
    `

    const values = [
      customer_code,
      measureUuid,
      new Date(measure_datetime),
      measure_type,
      imageUrl
    ]

    await connection.execute(query, values)
    
    return {
      image_url: imageUrl,
      measure_value: measureValue,
      measure_uuid: measureUuid,
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error
    } else {
      throw new Error('INTERNAL_ERROR: Ocorreu um erro inesperado.')
    }
  } finally {
    await connection.end()
  }
}

export async function confirmMeasure(body: ConfirmMeterReadingRequest) {
  const { measure_uuid, confirmed_value } = body
  const connection : Connection = await connectToDatabase()

  try {
    if (!measure_uuid || typeof confirmed_value !== 'number') {
      throw new Error('INVALID_DATA: Todos os campos são obrigatórios.')
    }

    const [existingMeasure] = await connection.execute<RowDataPacket[]>(
      'SELECT * FROM measures WHERE measure_uuid = ?',
      [measure_uuid]
    )

    if(existingMeasure.length == 0) {
      throw new Error('MEASURE_NOT_FOUND: Leitura não encontrada.')
    }

    const currentMeasure = existingMeasure[0]

    if(currentMeasure.has_confirmed) {
      throw new Error('CONFIRMATION_DUPLICATE: Leitura do mês já realizada.')
    }

    const query = `
      UPDATE measures SET measure_value = ?, has_confirmed = 1 WHERE measure_uuid = ?
    `
    const values = [
      confirmed_value,
      measure_uuid
    ]

    await connection.execute(query, values)
  }
  catch (error) {
    logger.error(error)
    if (error instanceof Error) {
      throw error
    } else {
      throw new Error('INTERNAL_ERROR: Ocorreu um erro inesperado.')
    }
  }
  finally {
    await connection.end()
  }
}

export async function getMeasuresByCustomerCode(customer_code : string, measure_type : string | undefined) {
  const connection : Connection = await connectToDatabase()

  try {
    if(measure_type) {
      const measureType = measure_type.toUpperCase()

      if(measureType != "WATER" && measureType != "GAS" ) {
        throw new Error('INVALID_TYPE: Tipo de medição não permitida')
      }
    }

    let query = `
    SELECT 
      measure_uuid,
      measure_value,
      measure_datetime,
      measure_type,
      has_confirmed,
      image_url
    FROM 
      measures
    WHERE 
      customer_code = ?
    `
    const queryParams: any[] = [customer_code]

    if (measure_type) {
      query += ' AND measure_type = ?'
      queryParams.push(measure_type)
    }

    const [rows] = await connection.execute<RowDataPacket[]>(query, queryParams)

    return rows
  }
  catch (error) {
    logger.error(error)
    if(error instanceof Error) {
      throw error
    } else {
      throw new Error('INTERNAL_ERROR: Ocorreu um erro inesperado.') 
    }
  }
}
