import express, {Application} from 'express'
import { cfg } from './config/config'
import routes from './routes/measureRoutes'
import dotenv from 'dotenv'

function main () {
  const app : Application = express()
  
  dotenv.config()

  app.use(express.json({ limit: '50mb' }))
  app.use(express.urlencoded({ limit: '50mb', extended: true }))
  app.use(routes)
  
  app.listen(cfg.server.port, () => {
    console.log(`Servidor rodando na porta ${cfg.server.port}`)
  })
}

main()
