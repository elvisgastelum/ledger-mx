# OpenAPI Specification

OpenAPI 3.0 using NestJS Swagger.

## Setup

```typescript
const config = new DocumentBuilder()
  .setTitle('LedgerMx API')
  .setVersion('1.0')
  .addBearerAuth()
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api-docs', app, document);
```

## Access

- Swagger UI: `http://localhost:3000/api-docs`
- OpenAPI JSON: `http://localhost:3000/api-docs-json`

## DTO Documentation

```typescript
export class CreateTransactionDto {
  @ApiProperty({ example: 'uuid' })
  @IsUUID() id: string;
  
  @ApiProperty({ example: 10000 })
  @IsInt() amountCents: number;
}
```

## Auth in Swagger

Click "Authorize", enter JWT token. All requests include Bearer token.

## Schema Generation

OpenAPI schemas auto-generated from DTOs.

## Client SDK (Future)

Generate TypeScript client from OpenAPI spec.

## Testing

Test OpenAPI spec is valid and complete.
