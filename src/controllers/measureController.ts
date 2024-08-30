import { Request, Response } from 'express'
import { ConfirmMeterReadingRequest, Measurement, MeasurementResponse, UploadMeterReadingRequest } from '../types/measure'
import { confirmMeasure, getMeasuresByCustomerCode, uploadMeasure } from '../services/measureService'
import logger from '../../log/logger'

export const handleUploadMeasurement = async (req: Request, res: Response) => {
  const { image, customer_code, measure_datetime, measure_type }: UploadMeterReadingRequest = req.body

  try {
    const result = await uploadMeasure({ image, customer_code, measure_datetime, measure_type })

    return res.status(200).json({
      image_url: result.image_url,
      measure_value: result.measure_value,
      measure_uuid: result.measure_uuid
    })  
  }
  catch (error) {
    logger.error(error)

    if (error instanceof Error) {
      if (error.message.includes('INVALID_DATA')) {
        return res.status(400).json({
          error_code: 'INVALID_DATA',
          error_description: 'Os dados fornecidos no corpo da requisição são inválidos.'
        })
      }

      if (error.message.includes('DOUBLE_REPORT')) {
        return res.status(409).json({
          error_code: 'DOUBLE_REPORT',
          error_description: 'Leitura do mês já realizada'
        })
      }

      return res.status(500).json({
        error_code: 'INTERNAL_SERVER_ERROR',
        error_description: 'Ocorreu um erro inesperado, tente novamente mais tarde.'
      })
    }
  }
}

export const handleMeasurementConfirmation = async (req: Request, res: Response) => {
  const { measure_uuid, confirmed_value } : ConfirmMeterReadingRequest = req.body

  try {
    await confirmMeasure({ measure_uuid, confirmed_value })

    return res.status(200).json({
      "success": true
    })
  }
  catch (error) {
    if(error instanceof Error) {
      if (error.message.includes('INVALID_DATA')) {
        return res.status(400).json({
          error_code: 'INVALID_DATA',
          error_description: error.message || 'Os dados fornecidos no corpo da requisição são inválidos.'
        })
      }
      if (error.message.includes('MEASURE_NOT_FOUND')) {
        return res.status(404).json({
          error_code: 'MEASURE_NOT_FOUND',
          error_description: 'Leitura não encontrada'
        })
      }
      if (error.message.includes('CONFIRMATION_DUPLICATE')) {
        return res.status(409).json({
          error_code: 'CONFIRMATION_DUPLICATE',
          error_description: 'Leitura do mês já realizada'
        })
      }
    }

    return res.status(500).json({
      error_code: 'INTERNAL_SERVER_ERROR',
      error_description: 'Ocorreu um erro inesperado, tente novamente mais tarde.'
    })
  }
}

export const handleMeasurementList = async (req: Request, res: Response) => {
  const { customer_code } = req.params
  const { measure_type } = req.query

  try {
    const measures = await getMeasuresByCustomerCode(customer_code, measure_type as string | undefined)

    const response: MeasurementResponse = {
      customer_code,
      measures: measures.map((measure): Measurement => ({
        measure_uuid: measure.measure_uuid,
        measure_datetime: measure.measure_datetime,
        measure_type: measure.measure_type,
        has_confirmed: !!measure.has_confirmed,
        image_url: measure.image_url,
      })),
    }

    return res.status(200).json(response)
  }
  catch (error) {
    if(error instanceof Error) {
      if (error.message.includes('INVALID_TYPE')) {
        return res.status(400).json({
          error_code: 'INVALID_TYPE',
          error_description: 'Tipo de medição não permitida'
        })
      }
      if (error.message.includes('MEASURES_NOT_FOUND')) {
        return res.status(404).json({
          error_code: 'MEASURES_NOT_FOUND',
          error_description: 'Nenhuma leitura encontrada'
        })
      }
    }
  }
}
