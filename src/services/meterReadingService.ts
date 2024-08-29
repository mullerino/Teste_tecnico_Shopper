import mysql, { Connection, RowDataPacket } from 'mysql2/promise'
import { v4 as uuidv4 } from 'uuid'
import { Measure, UploadMeterReadingRequest } from '../types/meterReading'

import { GoogleGenerativeAI } from '@google/generative-ai'

async function extractMeterReading(imageBase64: string): Promise<string> {
  const genAI = new GoogleGenerativeAI("AIzaSyA9rWYBKSO5Ocl_PtUtEsdxedtOi23wQPw")

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
    console.error("Error identifying measure:", error)
    throw new Error("Failed to identify measure")
  }
}

async function connectToDatabase(): Promise<Connection> {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'senha',
    database: 'shopper',
    connectionLimit: 10,
  })

  console.log('Conectado ao MySQL com sucesso!')
  return connection
}

export async function uploadMeasure(body: UploadMeterReadingRequest) {
  const { image, customer_code, measure_datetime, measure_type } = body

  const connection : Connection = await connectToDatabase()

  try {
    if (!image || !customer_code || !measure_datetime || !measure_type) {
      throw new Error('Todos os campos são obrigatórios.')
    }

    const measureValue = await extractMeterReading(image)

    const [existingMeasures] = await connection.execute<RowDataPacket[]>(
      'SELECT * FROM measures WHERE customer_code = ? AND measure_type = ? AND MONTH(measure_datetime) = MONTH(?)',
      [customer_code, measure_type, measure_datetime]
    )

    if(existingMeasures.length !== 0) {
      throw new Error('Já existe uma leitura para este mês e tipo.')
    }

    const measure_uuid = uuidv4()
    
    return {
      image_url: '',
      measure_uuid: measure_uuid,
      measure_value: measureValue,
    }
  } catch (error) {
    throw(error)
  } finally {
    await connection.end()
  }
}
