# Locales and Regional Settings

## Primary Locale

**es-MX** (Mexican Spanish) - Primary target market

## Secondary Locale

**en-US** (American English) - Future expansion

## Regional Defaults for MVP

### Currency

- Primary: MXN (Mexican Peso)
- Symbol: $
- Format: $1,234.56 (dots for thousands, comma for cents)
- Minor unit: centavos (100 centavos = 1 peso)

### Date Format

- Short: DD/MM/YYYY (19/06/2026)
- Long: dddd, D [de] MMMM [de] YYYY (viernes, 19 de junio de 2026)
- Input: HTML5 date picker with DD/MM/YYYY mask

### Number Format

- Decimal separator: comma (,)
- Thousands separator: dot (.)
- Example: 1.234,56

### Calendar

- Week starts: Monday
- First day of week display: Monday
- Payday convention: Every second Friday (biweekly)
- Three-paycheck months: Reduced third paycheck amount

### Financial Terms (es-MX)

- Checking account: Cuenta de débito
- Savings account: Cuenta de ahorro
- Credit card: Tarjeta de crédito
- Debt: Deuda
- Loan: Préstamo
- Envelope: Sobre protegido
- Paycheck: Nómina / Quincena
- Expense: Gasto
- Income: Ingreso
- Transfer: Transferencia
- Spendable balance: Saldo disponible

## Implementation Notes

- Documentation is English-only
- UI supports English and Spanish (es-MX primary, en-US secondary)
- Store all amounts in integer minor units (centavos)
- Currency display handled by Intl.NumberFormat
- Date storage: ISO 8601 (YYYY-MM-DD)
- Date display: locale-aware formatting
- Allow user to change locale in settings
