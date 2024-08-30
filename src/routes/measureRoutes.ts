import {Router} from 'express'
import { handleMeasurementList, handleMeasurementConfirmation, handleUploadMeasurement } from '../controllers/measureController'

const routes = Router()

routes.post('/upload', handleUploadMeasurement)
routes.patch('/confirm', handleMeasurementConfirmation)
routes.get('/:customer_code/list', handleMeasurementList)

export default routes
