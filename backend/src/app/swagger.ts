import type { RequestHandler } from 'express';

const swaggerJSDoc = require('swagger-jsdoc') as (options: object) => {
  openapi: string;
  paths: Record<string, unknown>;
};
const swaggerUi = require('swagger-ui-express') as {
  serve: RequestHandler[];
  setup: (spec: object) => RequestHandler;
};

let openApiSpec:
  | {
      openapi: string;
      paths: Record<string, unknown>;
    }
  | undefined;

export function getOpenApiSpec(): {
  openapi: string;
  paths: Record<string, unknown>;
} {
  if (!openApiSpec) {
    openApiSpec = swaggerJSDoc({
      apis: ['src/modules/**/*.ts', 'build/modules/**/*.js'],
      definition: {
        info: {
          title: 'Task Assignment API Service',
          version: '1.0.0',
        },
        openapi: '3.0.3',
      },
    });
  }

  return openApiSpec;
}

export const swaggerUiServe = swaggerUi.serve;
export const swaggerUiSetup = swaggerUi.setup(getOpenApiSpec());
