/**
 * POST /api/webhook/status
 *
 * Callback endpoint for n8n to push status updates.
 * Includes detailed error logging to diagnose Airtable issues.
 */

import { NextResponse } from "next/server";
import { updateRfpStatus, isAirtableConfigured } from "@/lib/airtable";

const VALID_STATUSES = [
  "Received", "Parsing", "Drafting", "Ready for Review", "Finalized",
  "Error — Parsing", "Error — Drafting", "Error — Intake",
];

export async function POST(request) {
  try {
    const body = await request.json();
    const { recordId, status, extractedData, generatedDraft, serviceLine, deadline, errorLog } = body;

    console.log("Webhook received:", { recordId, status, serviceLine, deadline });

    if (!recordId || !status) {
      return NextResponse.json(
        { error: "recordId and status are required" },
        { status: 400 }
      );
    }

    if (!isAirtableConfigured()) {
      console.log("Airtable not configured — skipping update");
      return NextResponse.json({ success: true, recordId, status, note: "Airtable not configured" });
    }

    // Build update fields — only include fields that have values
    const updateFields = {};

    if (extractedData) {
      try {
        updateFields["Extracted Data (JSON)"] =
          typeof extractedData === "string"
            ? extractedData
            : JSON.stringify(extractedData);
      } catch (e) {
        console.error("Failed to stringify extractedData:", e);
      }
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

    console.log("Updating Airtable record:", recordId, "with fields:", Object.keys(updateFields));

    try {
      await updateRfpStatus(recordId, status, updateFields);
    } catch (airtableError) {
      // Log the detailed error but try a minimal update (status only)
      console.error("Airtable full update failed:", airtableError.message);
      console.error("Attempted fields:", JSON.stringify(updateFields).substring(0, 500));
      
      try {
        // Fallback: just update the status without extra fields
        await updateRfpStatus(recordId, status, {});
        console.log("Fallback status-only update succeeded");
        return NextResponse.json({ 
          success: true, recordId, status, 
          warning: "Status updated but extra fields failed — check Airtable field names" 
        });
      } catch (fallbackError) {
        console.error("Even status-only update failed:", fallbackError.message);
        return NextResponse.json(
          { error: `Airtable update failed: ${fallbackError.message}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true, recordId, status });
  } catch (error) {
    console.error("Webhook status error:", error);
    return NextResponse.json(
      { error: "Failed to update status" },
      { status: 500 }
    );
  }
}
