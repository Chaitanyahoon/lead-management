const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Lead Management API',
      version: '1.0.0',
      description: 'Mini Lead Management System API documentation',
    },
    servers: [{ url: 'http://localhost:5000' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            role: { type: 'string', enum: ['admin', 'manager', 'agent'] },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        Lead: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            email: { type: 'string' },
            phone: { type: 'string' },
            source: { type: 'string' },
            status: { type: 'string', enum: ['new', 'contacted', 'qualified', 'won', 'lost'] },
            assigned_to: { type: 'string', format: 'uuid' },
            assigned_agent_name: { type: 'string' },
            notes: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        ActivityLog: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            lead_id: { type: 'string', format: 'uuid' },
            action: { type: 'string' },
            performed_by_name: { type: 'string' },
            meta: { type: 'object' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/modules/**/*.routes.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = { swaggerSpec };
