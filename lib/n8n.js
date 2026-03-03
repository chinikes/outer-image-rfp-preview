/**
 * n8n Webhook Client
 *
 * Triggers the n8n intake workflow when a new RFP is uploaded.
 * The webhook sends the file URL, filename, and Airtable record ID
 * so n8n can download the file and track progress.
 */

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;

/**
 * Fire the n8n intake webhook.
 * Called after file upload + Airtable record creation.
 *
 * @param {Object} payload
 * @param {string} payload.recordId - Airtable record ID for status updates
 * @param {string} payload.fileUrl - Blob storage URL of the uploaded RFP
 * @param {string} payload.fileName - Original filename
 * @param {string} payload.fileType - "pdf" or "xlsx"
 * @param {string} payload.callbackUrl - Portal webhook URL for status updates
 */
export async function triggerIntakeWorkflow({
  recordId,
  fileUrl,
  fileName,
  fileType,
  callbackUrl,
}) {
  if (!N8N_WEBHOOK_URL) {
    console.warn("N8N_WEBHOOK_URL not configured — skipping webhook trigger");
    return { success: false, error: "Webhook URL not configured" };
  }

  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recordId,
        fileUrl,
        fileName,
        fileType,
        callbackUrl,
        triggeredAt: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("n8n webhook failed:", response.status, errorText);
      return { success: false, error: `n8n returned ${response.status}` };
    }

    const data = await response.json().catch(() => ({}));
    return { success: true, data };
  } catch (error) {
    console.error("n8n webhook error:", error);
    return { success: false, error: error.message };
  }
}
