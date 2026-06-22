# Project Instructions for Agents

## Client React Forms (apps/web)

For client React forms in `apps/web/src`, **always use react-hook-form** for form state management.

### Required Pattern

Use `react-hook-form` with the following patterns:
- `useForm` hook with typed form values interface
- `register` function for input registration
- `handleSubmit` for form submission
- `Controller` component for controlled inputs (if needed)
- `formState` for form state (errors, isSubmitting, etc.)

### TypeScript Pattern

```typescript
import { useForm } from "react-hook-form";

interface FormValues {
  fieldName: string;
  // ... other fields
}

function MyForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>();

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    // Handle submission
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register("fieldName", { required: true })} />
      {errors.fieldName && <span>Error message</span>}
      <button type="submit" disabled={isSubmitting}>
        Submit
      </button>
    </form>
  );
}
```

### What NOT to Do

- Do **NOT** introduce new `useState` for form field values (e.g., `useState<string>("")`)
- Do **NOT** use `FormEvent` for form handling
- Do **NOT** manage form submission state with separate `useState` (use `formState.isSubmitting`)
- Do **NOT** manage form errors with separate `useState` (use `formState.errors`)

### Exceptions (Non-Form UI State)

The following are **acceptable** uses of `useState`:
- Wizard step navigation state
- Loading state unrelated to form submission
- Modal visibility toggles
- UI state not directly tied to form field values

### Documentation Reference

When implementing forms, refer to the current [React Hook Form documentation](https://react-hook-form.com/docs).
Consult Context7 for the latest API patterns and examples.

## General Guidelines

- Preserve existing behavior when refactoring
- Maintain API request patterns (credentials, headers, etc.)
- Keep validation logic intact
- Run typecheck and lint after changes
