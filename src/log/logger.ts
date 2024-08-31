import bunyan from 'bunyan'

const logger = bunyan.createLogger({
  name: 'measures',
  level: 'info',
  src: true,
  streams: [
    {
      stream: process.stdout
    },
    {
      type: 'rotating-file',
      path: './src/log/app.log',
      period: '30d',
      count: 10,
    },
  ],
})

export default logger
