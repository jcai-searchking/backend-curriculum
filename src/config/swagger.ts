// src/config/swagger.ts
import swaggerJsdoc from 'swagger-jsdoc';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Neow API Documentation',
            version: '1.0.0',
            description:
                'API documentation for the User Management & Auth System',
        },
        servers: [
            {
                url: 'http://localhost:3001', // Ensure this matches your port
                description: 'Local Development Server',
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
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    // This line tells Swagger where to look for your comments 👇
    apis: ['./src/**/*.routes.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
