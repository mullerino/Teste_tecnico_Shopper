import request from 'supertest'
import { server } from '../index'

jest.mock('../services/measureService', () => ({
  uploadMeasure: jest.fn(),
  confirmMeasure: jest.fn(),
  getMeasuresByCustomerCode: jest.fn(),
}))

import { uploadMeasure, confirmMeasure, getMeasuresByCustomerCode } from '../services/measureService'

describe('Measurement Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterAll((done) => {
    server.close(done)
  })

  describe('POST /upload', () => {
    it('should upload a measurement', async () => {
      (uploadMeasure as jest.Mock).mockResolvedValue({
        image_url: 'http://example.com/image.jpg',
        measure_value: 123,
        measure_uuid: 'some-uuid',
      })

      const response = await request(server)
        .post('/upload')
        .send({
          image: 'base64image',
          customer_code: '123',
          measure_datetime: '2024-08-30T19:00:00Z',
          measure_type: 'WATER',
        })

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        image_url: 'http://example.com/image.jpg',
        measure_value: 123,
        measure_uuid: 'some-uuid',
      })
    })

    it('should return 400 if invalid data', async () => {
      (uploadMeasure as jest.Mock).mockRejectedValue(new Error('INVALID_DATA: Os dados fornecidos no corpo da requisição são inválidos.'))

      const response = await request(server)
        .post('/upload')
        .send({
          image: 'base64image',
          customer_code: 1,
          measure_datetime: '2024-08-30T19:00:00Z',
          measure_type: 'WATER',
        })

      expect(response.status).toBe(400)
      expect(response.body).toEqual({
        error_code: 'INVALID_DATA',
        error_description: 'Os dados fornecidos no corpo da requisição são inválidos.'
      })
    })

    it('should return 409 if the measurement for the month is already reported', async () => {
      (uploadMeasure as jest.Mock).mockRejectedValue(new Error('DOUBLE_REPORT: Leitura do mês já realizada.'))
    
      const response = await request(server)
        .post('/upload')
        .send({
          image: 'base64image',
          customer_code: '123',
          measure_datetime: '2024-08-30T19:00:00Z',
          measure_type: 'WATER',
        })
    
      expect(response.status).toBe(409)
      expect(response.body).toEqual({
        error_code: 'DOUBLE_REPORT',
        error_description: 'Leitura do mês já realizada',
      })
    })
  })
  
  describe('PATCH /confirm', () => {
    it('should confirm a measurement', async () => {
      (confirmMeasure as jest.Mock).mockResolvedValue(true)

      const response = await request(server)
        .patch('/confirm')
        .send({
          measure_uuid: 'some-uuid',
          confirmed_value: 456,
        })

      expect(response.status).toBe(200)
      expect(response.body).toEqual({ success: true })
    })

    it('should return 404 if the measurement is not found', async () => {
      (confirmMeasure as jest.Mock).mockRejectedValue(new Error('MEASURE_NOT_FOUND: Leitura não encontrada.'))

      const response = await request(server)
        .patch('/confirm')
        .send({
          measure_uuid: 'invalid-uuid',
          confirmed_value: 456,
        })

      expect(response.status).toBe(404)
      expect(response.body).toEqual({
        error_code: 'MEASURE_NOT_FOUND',
        error_description: 'Leitura não encontrada',
      })
    })

    it('should return 409 if the measurement is existing', async () => {
      (confirmMeasure as jest.Mock).mockRejectedValue(new Error('CONFIRMATION_DUPLICATE: Leitura do mês já realizada.'))

      const response = await request(server)
        .patch('/confirm')
        .send({
          measure_uuid: 'some-uuid',
          confirmed_value: 456,
        })

      expect(response.status).toBe(409)
      expect(response.body).toEqual({
        error_code: 'CONFIRMATION_DUPLICATE',
        error_description: 'Leitura do mês já realizada'
      })
    })
  })

  describe('GET /:customer_code/list', () => {
    it('should return a list of measurements for a customer', async () => {
      (getMeasuresByCustomerCode as jest.Mock).mockResolvedValue([
        {
          measure_uuid: 'some-uuid',
          measure_datetime: new Date('2024-08-30T19:00:00Z'),
          measure_type: 'WATER',
          has_confirmed: true,
          image_url: 'http://example.com/image.jpg',
        },
      ])

      const response = await request(server).get('/123/list')

      expect(response.status).toBe(200)
      expect(response.body).toEqual({
        customer_code: '123',
        measures: [
          {
            measure_uuid: 'some-uuid',
            measure_datetime: '2024-08-30T19:00:00.000Z',
            measure_type: 'WATER',
            has_confirmed: true,
            image_url: 'http://example.com/image.jpg',
          },
        ],
      })
    })
    it('should return 400 if an invalid measure_type is provided', async () => {
      (getMeasuresByCustomerCode as jest.Mock).mockRejectedValue(new Error('INVALID_TYPE: Tipo de medição não permitida'))
    
      const response = await request(server)
        .get('/123/list')
        .query({ measure_type: 'INVALID' })
    
      expect(response.status).toBe(400)
      expect(response.body).toEqual({
        error_code: 'INVALID_TYPE',
        error_description: 'Tipo de medição não permitida',
      })
    })
    it('should return 404 if no measurements are found', async () => {
      (getMeasuresByCustomerCode as jest.Mock).mockRejectedValue(new Error('MEASURES_NOT_FOUND: Nenhuma leitura encontrada'))
    
      const response = await request(server).get('/123/list')
    
      expect(response.status).toBe(404)
      expect(response.body).toEqual({
        error_code: 'MEASURES_NOT_FOUND',
        error_description: 'Nenhuma leitura encontrada',
      })
    })
    it('should return a filtered list of measurements when measure_type is provided', async () => {
      (getMeasuresByCustomerCode as jest.Mock).mockResolvedValue([
        {
          measure_uuid: 'uuid-water',
          measure_datetime: new Date('2024-08-30T19:00:00Z'),
          measure_type: 'WATER',
          has_confirmed: true,
          image_url: 'http://example.com/image-water.jpg',
        }
      ])
    
      const response = await request(server)
        .get('/123/list')
        .query({ measure_type: 'WATER' })
    
      expect(response.status).toBe(200)
      expect(response.body.customer_code).toBe('123')
      expect(response.body.measures).toHaveLength(1)
      expect(response.body.measures[0]).toEqual({
        measure_uuid: 'uuid-water',
        measure_datetime: '2024-08-30T19:00:00.000Z',
        measure_type: 'WATER',
        has_confirmed: true,
        image_url: 'http://example.com/image-water.jpg',
      })
    })
  })
})
