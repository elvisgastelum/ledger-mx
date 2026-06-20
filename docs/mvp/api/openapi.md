# OpenAPI Specification

OpenAPI 3.0 generated from ts-rest contracts using `@ts-rest/open-api`.

## Generation

Use `generateOpenApi()` from `@ts-rest/open-api` to create an OpenAPI document from `libs/contracts` ts-rest routers:

```typescript
import { generateOpenApi } from "@ts-rest/open-api";
import { contract } from "libs/contracts";

const openApiDocument = generateOpenApi(contract, {
  info: { title: "LedgerMx API", version: "1.0" },
  pathPrefix: "/api/v1",
});
```

## Zod Schema Metadata

Add OpenAPI metadata to Zod schemas using `@anatine/zod-openapi` or similar Zod extensions to customize schema descriptions, examples, and validation rules in the generated document.

## Serving OpenAPI

`@nestjs/swagger` and Swagger UI are used only to serve and display the generated OpenAPI document from `apps/api`—the source of truth remains the ts-rest contracts in `libs/contracts`, not decorators:

```typescript
import { SwaggerModule } from '@nestjs/swagger';
import { generateOpenApi } from '@ts-rest/open-api';

const document = generateOpenApi(contract, { ... });
SwaggerModule.setup('api-docs', app, document);
```

## Access

- Swagger UI: `http://localhost:3000/api-docs`
- OpenAPI JSON: `http://localhost:3000/api-docs-json`

## Client SDK (Future)

Generate TypeScript client from the generated OpenAPI spec, or use `@ts-rest/react-query/v5` directly from contracts.

## Testing

Validate the generated OpenAPI spec is valid and complete.
