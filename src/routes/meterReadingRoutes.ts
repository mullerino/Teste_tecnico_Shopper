import {Router} from 'express'
import { uploadMeterImage } from '../controllers/meterReadingController'

const routes = Router()

routes.post('/upload', uploadMeterImage)

export default routes
