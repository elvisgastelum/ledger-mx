# API Boundaries

Layered architecture: Controller → Use Case → Repository.

## Layers

### Controller (NestJS)

- Parse request
- Validate DTOs
- Call use case
- Return HTTP response

### Use Case (Application)

- Business logic
- Orchestrate domain objects
- Transaction management

### Repository (Domain Interface)

```typescript
interface TransactionRepository {
  save(tx: Transaction): Promise<Transaction>;
  findByUserId(userId: string): Promise<Transaction[]>;
}
```

### Repository Implementation (Infrastructure)

Drizzle ORM database access.

## DTOs

```typescript
export class CreateTransactionDto {
  @IsUUID() id: string;
  @IsInt() amountCents: number;
  @IsEnum(TransactionType) type: TransactionType;
}
```

## Validation

- DTO: class-validator
- Domain: invariants (ledger balance, etc.)

## Error Handling

Global exception filter, RFC 7807 format.
