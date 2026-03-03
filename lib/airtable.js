/**
 * Airtable Client for Outer Image RFP Portal
 *
 * Provides typed access to all Airtable tables.
 * Returns empty data gracefully when API keys are not configured.
 */

import Airtable from "airtable";

// ============================================
// CONNECTION CHECK
// ============================================

const isConfigured =
  process.env.AIRTABLE_API_KEY && process.env.AIRTABLE_BASE_ID;

let base = null;
let tables = {};

if (isConfigured) {
  base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
    process.env.AIRTABLE_BASE_ID
  );
  tables = {
    rfpTracker: base("RFP Tracker"),
    teamBios: base("Team Bios"),
    clientReferences: base("Client References"),
    portfolio: base("Portfolio"),
    rateSchedules: base("Rate Schedules"),
    boilerplate: base("Boilerplate Content"),
  };
}

/**
 * Check if Airtable is configured.
 * API routes use this to return mock data during development.
 */
export function isAirtableConfigured() {
  return isConfigured;
}

// ============================================
// RFP TRACKER
// ============================================

export async function createRfpRecord({ rfpName, fileUrl }) {
  if (!isConfigured) {
    console.warn("Airtable not configured — returning mock record");
    return {
      id: `mock_${Date.now()}`,
      rfpId: rfpName,
      status: "Received",
    };
  }

  const record = await tables.rfpTracker.create({
    "RFP Name": rfpName,
    Status: "Received",
    "File URL": fileUrl,
    "Uploaded At": new Date().toISOString(),
  });
  return {
    id: record.id,
    rfpId: record.get("RFP Name"),
    status: record.get("Status"),
  };
}

export async function updateRfpStatus(recordId, status, extraFields = {}) {
  if (!isConfigured) {
    console.warn("Airtable not configured — skipping status update");
    return null;
  }

  const record = await tables.rfpTracker.update(recordId, {
    Status: status,
    ...extraFields,
  });
  return record;
}

export async function getAllRfps() {
  if (!isConfigured) {
    return [];
  }

  const records = await tables.rfpTracker
    .select({
      sort: [{ field: "Uploaded At", direction: "desc" }],
    })
    .all();

  return records.map((r) => ({
    id: r.id,
    rfpName: r.get("RFP Name"),
    status: r.get("Status"),
    serviceLine: r.get("Service Line (Detected)") || null,
    deadline: r.get("Submission Deadline") || null,
    fileUrl: r.get("File URL"),
    extractedData: r.get("Extracted Data (JSON)")
      ? JSON.parse(r.get("Extracted Data (JSON)"))
      : null,
    generatedDraft: r.get("Generated Draft") || null,
    uploadedAt: r.get("Uploaded At"),
  }));
}

export async function getRfpById(recordId) {
  if (!isConfigured) {
    return null;
  }

  const r = await tables.rfpTracker.find(recordId);
  return {
    id: r.id,
    rfpName: r.get("RFP Name"),
    status: r.get("Status"),
    serviceLine: r.get("Service Line (Detected)") || null,
    deadline: r.get("Submission Deadline") || null,
    fileUrl: r.get("File URL"),
    extractedData: r.get("Extracted Data (JSON)")
      ? JSON.parse(r.get("Extracted Data (JSON)"))
      : null,
    generatedDraft: r.get("Generated Draft") || null,
    uploadedAt: r.get("Uploaded At"),
  };
}

// ============================================
// CONTENT QUERIES
// ============================================

export async function getTeamBios(serviceLine = null) {
  if (!isConfigured) return [];
  const options = serviceLine
    ? { filterByFormula: `FIND("${serviceLine}", {Service Lines})` }
    : {};
  const records = await tables.teamBios.select(options).all();
  return records.map((r) => ({
    id: r.id,
    name: r.get("Name"),
    title: r.get("Title"),
    bioShort: r.get("Bio (Short)"),
    bioFull: r.get("Bio (Full)"),
    serviceLines: r.get("Service Lines"),
    certifications: r.get("Certifications"),
  }));
}

export async function getReferences(serviceLine = null, clientTier = null) {
  if (!isConfigured) return [];
  let formula = [];
  if (serviceLine) formula.push(`{Service Line} = "${serviceLine}"`);
  if (clientTier) formula.push(`{Client Tier} = "${clientTier}"`);
  const options =
    formula.length > 0
      ? { filterByFormula: formula.length > 1 ? `AND(${formula.join(",")})` : formula[0] }
      : {};
  const records = await tables.clientReferences.select(options).all();
  return records.map((r) => ({
    id: r.id,
    clientName: r.get("Client Name"),
    projectName: r.get("Project Name"),
    serviceLine: r.get("Service Line"),
    description: r.get("Project Description"),
    clientTier: r.get("Client Tier"),
    contactName: r.get("Contact Name"),
    contactInfo: r.get("Contact Info"),
  }));
}

export async function getPortfolio(serviceLine = null) {
  if (!isConfigured) return [];
  const options = serviceLine
    ? { filterByFormula: `{Service Line} = "${serviceLine}"` }
    : {};
  const records = await tables.portfolio.select(options).all();
  return records.map((r) => ({
    id: r.id,
    projectName: r.get("Project Name"),
    serviceLine: r.get("Service Line"),
    clientTier: r.get("Client Tier"),
    summary: r.get("Summary"),
    projectTypeTags: r.get("Project Type Tags"),
  }));
}

export async function getRateSchedules(serviceType = null) {
  if (!isConfigured) return [];
  const options = serviceType
    ? { filterByFormula: `{Service Type} = "${serviceType}"` }
    : {};
  const records = await tables.rateSchedules.select(options).all();
  return records.map((r) => ({
    id: r.id,
    serviceType: r.get("Service Type"),
    roleLineItem: r.get("Role / Line Item"),
    rate: r.get("Rate"),
    notes: r.get("Notes"),
  }));
}

export async function getBoilerplate(serviceLine = null) {
  if (!isConfigured) return [];
  const options = serviceLine
    ? { filterByFormula: `FIND("${serviceLine}", {Service Lines})` }
    : {};
  const records = await tables.boilerplate.select(options).all();
  return records.map((r) => ({
    id: r.id,
    sectionName: r.get("Section Name"),
    content: r.get("Content"),
    serviceLines: r.get("Service Lines"),
    lastUpdated: r.get("Last Updated"),
  }));
}
