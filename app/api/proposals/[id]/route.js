/**
 * GET /api/proposals/[id]
 *
 * Returns full proposal data for a specific RFP by Airtable record ID.
 * Includes extracted data and generated draft.
 */

import { NextResponse } from "next/server";
import { getRfpById } from "@/lib/airtable";

export async function GET(request, { params }) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: "Proposal ID is required" },
        { status: 400 }
      );
    }

    const proposal = await getRfpById(id);

    if (!proposal) {
      return NextResponse.json(
        { error: "Proposal not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ proposal });
  } catch (error) {
    console.error("Error fetching proposal:", error);
    return NextResponse.json(
      { error: "Failed to fetch proposal" },
      { status: 500 }
    );
  }
}
