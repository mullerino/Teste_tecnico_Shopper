import express, { Application } from 'express'
import { cfg } from '../config/config'
import routes from './routes/measureRoutes'
import dotenv from 'dotenv'
import logger from '../log/logger'

const app: Application = express()

function main() {
  dotenv.config()

  app.use(express.json({ limit: '50mb' }))
  app.use(express.urlencoded({ limit: '50mb', extended: true }))
  app.use(routes)

  const server = app.listen(cfg.server.port, () => {
    logger.info(`Server running on port ${cfg.server.port}`)
  })

  return server
}

export const server = main()
