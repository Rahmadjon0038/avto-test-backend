const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Avto Imtihon API',
      version: '1.0.0',
      description: 'Haydovchilik imtihoniga tayyorlanish platformasi uchun API hujjatlari',
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Lokal server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  // API yo'llari qayerda yozilganini ko'rsatamiz
  apis: ['./server.js', './routes/*.js'], 
};

const swaggerSpec = swaggerJSDoc(options);
module.exports = swaggerSpec;