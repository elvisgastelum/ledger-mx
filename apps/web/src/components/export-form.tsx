import { useForm, Controller } from "react-hook-form";
import { useAuth } from "../lib/auth-context";
import { dateInputToISOString } from "../lib/date-format";
import { DatePicker } from "./ui/date-picker";

interface ExportFormValues {
  startDate?: string;
  endDate?: string;
}

/**
 * CSV Export form component.
 * Allows users to download transactions as CSV with optional date range.
 */
export function ExportForm() {
  const { authFetch } = useAuth();
  const {
    handleSubmit,
    control,
    formState: { isSubmitting, errors },
    watch,
    setError,
  } = useForm<ExportFormValues>();

  const onSubmit = async (data: ExportFormValues) => {
    try {
      // Build query string
      const params = new URLSearchParams();
      if (data.startDate) {
        params.append("startDate", dateInputToISOString(data.startDate));
      }
      if (data.endDate) {
        params.append("endDate", dateInputToISOString(data.endDate));
      }

      const queryString = params.toString();
      const url = `/api/v1/export/csv${queryString ? `?${queryString}` : ""}`;

      // Fetch the CSV file using authFetch
      const response = await authFetch(url, {
        method: "GET",
        headers: {
          Accept: "text/csv",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message || `Export failed: ${response.status}`,
        );
      }

      // Get the CSV content
      const csvContent = await response.text();

      // Create a blob and download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const downloadUrl = URL.createObjectURL(blob);

      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = "transactions.csv";
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+?)"?$/);
        if (filenameMatch) {
          filename = filenameMatch[1] ?? "transactions.csv";
        }
      }

      // Trigger download
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError("root", { message: err.message });
      } else {
        setError("root", { message: "An unexpected error occurred" });
      }
    }
  };

  return (
    <section aria-labelledby="export-heading">
      <h2 id="export-heading">Export Transactions</h2>
      <p>Download your transactions as a CSV file for audit or tax purposes.</p>

      <form onSubmit={handleSubmit(onSubmit)} aria-label="CSV Export Form">
        <div>
          <label htmlFor="startDate">Start Date (optional):</label>
          <Controller
            name="startDate"
            control={control}
            render={({ field }) => (
              <DatePicker
                id="startDate"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                disabled={isSubmitting}
              />
            )}
          />
        </div>

        <div>
          <label htmlFor="endDate">End Date (optional):</label>
          <Controller
            name="endDate"
            control={control}
            rules={{
              validate: (endDate) => {
                // Only validate if both dates are provided
                const startDate = watch("startDate");
                if (!endDate || !startDate) return true;
                return (
                  endDate >= startDate ||
                  "End date must be on or after start date"
                );
              },
            }}
            render={({ field }) => (
              <DatePicker
                id="endDate"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                disabled={isSubmitting}
                aria-invalid={!!errors.endDate}
              />
            )}
          />
          {errors.endDate?.message && (
            <div className="error-message" role="alert">
              {errors.endDate.message}
            </div>
          )}
        </div>

        {errors.root?.message && (
          <div className="error-message" role="alert">
            {errors.root.message}
          </div>
        )}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Downloading..." : "Download CSV"}
        </button>
      </form>
    </section>
  );
}
