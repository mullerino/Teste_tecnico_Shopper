import express, {Application} from 'express'
import routes from './routes/meterReadingRoutes'
import dotenv from 'dotenv'

function main () {
  const app : Application = express()
  const port = 3000
  
  dotenv.config()

  app.use(express.json({ limit: '50mb' }))
  app.use(express.urlencoded({ limit: '50mb', extended: true }))
  app.use(routes)
  
  app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`)
  })
}

main()
