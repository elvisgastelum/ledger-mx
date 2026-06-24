import { useForm, Controller } from "react-hook-form";
import { dateInputToISOString } from "../lib/date-format";
import { contractClient, extractFilename } from "../lib/ts-rest-client";
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
  const {
    handleSubmit,
    control,
    formState: { isSubmitting, errors },
    watch,
    setError,
  } = useForm<ExportFormValues>();

  const onSubmit = async (data: ExportFormValues) => {
    try {
      // Build query parameters
      const query: Record<string, string> = {};
      if (data.startDate) {
        query.startDate = dateInputToISOString(data.startDate);
      }
      if (data.endDate) {
        query.endDate = dateInputToISOString(data.endDate);
      }

      // Call API using contractClient
      const result = await contractClient.export.downloadCsv({
        query,
      });

      if (result.status !== 200) {
        const body = result.body as { message?: string };
        throw new Error(body?.message || `Export failed: ${result.status}`);
      }

      // Get the CSV content (should be a string for CSV)
      const csvContent = result.body as string;

      // Create a blob and download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const downloadUrl = URL.createObjectURL(blob);

      // Get filename from Content-Disposition header or use default
      const contentDisposition = result.headers.get("Content-Disposition");
      const filename = extractFilename(contentDisposition);

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
