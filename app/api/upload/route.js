/**
 * POST /api/upload
 *
 * Receives an RFP file upload, stores it in Vercel Blob,
 * creates an Airtable record, and triggers the n8n pipeline.
 *
 * This is the entry point for the entire automation system.
 */

import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { createRfpRecord, updateRfpStatus } from "@/lib/airtable";
import { triggerIntakeWorkflow } from "@/lib/n8n";

// Accepted file types
const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
  "application/vnd.ms-excel", // .xls
];

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    // ---- Validation ----
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only PDF and Excel files are accepted." },
        { status: 400 }
      );
    }

    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 20MB." },
        { status: 400 }
      );
    }

    // ---- Store in Vercel Blob ----
    const blob = await put(`rfps/${Date.now()}-${file.name}`, file, {
      access: "public",
      contentType: file.type,
    });

    // ---- Create Airtable record ----
    const record = await createRfpRecord({
      rfpName: file.name.replace(/\.[^/.]+$/, ""), // Strip extension for display
      fileUrl: blob.url,
    });

    // ---- Determine file type for n8n routing ----
    const fileType = file.type === "application/pdf" ? "pdf" : "xlsx";

    // ---- Trigger n8n pipeline ----
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhook/status`;
    const webhookResult = await triggerIntakeWorkflow({
      recordId: record.id,
      fileUrl: blob.url,
      fileName: file.name,
      fileType,
      callbackUrl,
    });

    // If webhook fails, still return success but note the issue
    // The file is stored and tracked — n8n can be re-triggered manually
    if (!webhookResult.success) {
      await updateRfpStatus(record.id, "Error — Intake", {
        "Error Log": `n8n webhook failed: ${webhookResult.error}`,
      });
    }

    return NextResponse.json({
      success: true,
      proposal: {
        id: record.id,
        rfpId: record.rfpId,
        status: webhookResult.success ? "Received" : "Error — Intake",
        fileUrl: blob.url,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Upload failed. Please try again." },
      { status: 500 }
    );
  }
}
