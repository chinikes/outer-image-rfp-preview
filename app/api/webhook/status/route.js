/**
 * POST /api/webhook/status
 *
 * Callback endpoint for n8n to push status updates as the
 * RFP pipeline progresses through each stage.
 *
 * n8n sends:
 * - recordId: Airtable record ID
 * - status: new status (Parsing, Drafting, Ready for Review, Error)
 * - extractedData: (optional) JSON from Gemini parsing stage
 * - generatedDraft: (optional) proposal text from OpenAI drafting stage
 * - serviceLine: (optional) detected service line classification
 * - deadline: (optional) extracted submission deadline
 * - errorLog: (optional) error details if status is Error
 */

import { NextResponse } from "next/server";
import { updateRfpStatus } from "@/lib/airtable";

// Valid status transitions
const VALID_STATUSES = [
  "Received",
  "Parsing",
  "Drafting",
  "Ready for Review",
  "Finalized",
  "Error — Parsing",
  "Error — Drafting",
  "Error — Intake",
];

export async function POST(request) {
  try {
    const body = await request.json();
    const { recordId, status, extractedData, generatedDraft, serviceLine, deadline, errorLog } = body;

    // ---- Validation ----
    if (!recordId || !status) {
      return NextResponse.json(
        { error: "recordId and status are required" },
        { status: 400 }
      );
    }

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    // ---- Build update fields ----
    const updateFields = {};

    if (extractedData) {
      updateFields["Extracted Data (JSON)"] =
        typeof extractedData === "string"
          ? extractedData
          : JSON.stringify(extractedData);
    }

    if (generatedDraft) {
      updateFields["Generated Draft"] = generatedDraft;
    }

    if (serviceLine) {
      updateFields["Service Line (Detected)"] = serviceLine;
    }

    if (deadline) {
      updateFields["Submission Deadline"] = deadline;
    }

    if (errorLog) {
      updateFields["Error Log"] = errorLog;
    }

    // ---- Update Airtable ----
    await updateRfpStatus(recordId, status, updateFields);

    return NextResponse.json({ success: true, recordId, status });
  } catch (error) {
    console.error("Webhook status error:", error);
    return NextResponse.json(
      { error: "Failed to update status" },
      { status: 500 }
    );
  }
}
