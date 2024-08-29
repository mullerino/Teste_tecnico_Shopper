import { Request, Response } from 'express'
import { UploadMeterReadingRequest } from '../types/meterReading'
import { uploadMeasure } from '../services/meterReadingService'

export const uploadMeterImage = async (req: Request, res: Response) => {
  const { image, customer_code, measure_datetime, measure_type } : UploadMeterReadingRequest = req.body

  try {
    const result = await uploadMeasure({image, customer_code, measure_datetime, measure_type})

    return res.status(200).json({ image_url: "", measure_value: result.measure_value, measure_uuid: result.measure_uuid })
  }
  catch (error){
    console.log(error)
  }

}
