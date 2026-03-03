"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function ProposalViewPage() {
  const params = useParams();
  const router = useRouter();
  const [proposal, setProposal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchProposal() {
      try {
        const res = await fetch(`/api/proposals/${params.id}`);
        if (!res.ok) throw new Error("Proposal not found");
        const data = await res.json();
        setProposal(data.proposal);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    if (params.id) fetchProposal();
  }, [params.id]);

  if (loading) {
    return (
      <div className="max-w-[960px] mx-auto px-6 py-12 text-center text-gray-400">
        Loading proposal...
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="max-w-[960px] mx-auto px-6 py-12 text-center">
        <div className="text-red-600 mb-4">{error || "Proposal not found"}</div>
        <Link href="/dashboard" className="text-brand-teal font-medium">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  // Parse the generated draft into sections
  // Expected format: Markdown with ## headers for each section
  const parseSections = (draft) => {
    if (!draft) return [{ title: "Draft", content: "No draft generated yet." }];

    const sections = [];
    const parts = draft.split(/^## /m);

    for (const part of parts) {
      if (!part.trim()) continue;
      const newlineIdx = part.indexOf("\n");
      if (newlineIdx === -1) {
        sections.push({ title: part.trim(), content: "" });
      } else {
        sections.push({
          title: part.substring(0, newlineIdx).trim(),
          content: part.substring(newlineIdx + 1).trim(),
        });
      }
    }

    return sections.length > 0
      ? sections
      : [{ title: "Full Draft", content: draft }];
  };

  const sections = parseSections(proposal.generatedDraft);
  const extractedData = proposal.extractedData || {};

  return (
    <div className="max-w-[960px] mx-auto px-6 py-12">
      {/* Back button */}
      <button
        onClick={() => router.push("/dashboard")}
        className="flex items-center gap-1.5 text-brand-teal text-sm font-medium mb-6 bg-transparent border-none cursor-pointer p-0 hover:opacity-80"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <line strokeLinecap="round" strokeLinejoin="round" x1="19" y1="12" x2="5" y2="12"/>
          <polyline strokeLinecap="round" strokeLinejoin="round" points="12 19 5 12 12 5"/>
        </svg>
        Back to Dashboard
      </button>

      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-brand-navy">
              {proposal.rfpName}
            </h1>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold
              ${proposal.status === "Ready for Review" ? "bg-green-100 text-green-800" : "bg-purple-100 text-purple-800"}`}>
              {proposal.status}
            </span>
          </div>
          <div className="flex gap-4 text-[13px] text-gray-500 items-center">
            {proposal.serviceLine && (
              <span className="px-2.5 py-0.5 rounded-md border border-green-200 bg-green-50 text-green-700 text-[11px] font-semibold">
                {proposal.serviceLine}
              </span>
            )}
            {proposal.deadline && (
              <span>
                Due{" "}
                {new Date(proposal.deadline).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            )}
          </div>
        </div>
        <button className="px-5 py-2.5 rounded-lg bg-brand-navy text-white text-sm font-semibold hover:opacity-90 border-none cursor-pointer">
          Export Draft
        </button>
      </div>

      {/* Extracted data summary */}
      {Object.keys(extractedData).length > 0 && (
        <div className="rounded-xl border border-gray-200 p-5 mb-8 bg-gray-50">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
            Extracted RFP Data
          </div>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(extractedData).map(([key, val]) => (
              <div key={key}>
                <div className="text-[11px] font-semibold text-gray-400 mb-0.5 capitalize">
                  {key.replace(/([A-Z])/g, " $1").trim()}
                </div>
                <div className="text-[13px] text-gray-700 leading-relaxed">
                  {typeof val === "string" ? val : JSON.stringify(val)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section tabs + content */}
      <div className="grid grid-cols-[200px_1fr] gap-6">
        {/* Section nav */}
        <div className="flex flex-col gap-0.5">
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-3 py-2">
            Sections
          </div>
          {sections.map((s, i) => (
            <button
              key={i}
              onClick={() => setActiveSection(i)}
              className={`px-3 py-2.5 rounded-lg border-none text-[13px] text-left cursor-pointer transition-all
                ${activeSection === i
                  ? "bg-brand-navy text-white font-semibold"
                  : "bg-transparent text-gray-600 hover:bg-gray-100"}`}
            >
              {s.title}
            </button>
          ))}
        </div>

        {/* Content panel */}
        <div className="rounded-xl border border-gray-200 bg-white p-8 min-h-[400px]">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl font-bold text-brand-navy">
              {sections[activeSection]?.title}
            </h2>
            <span className="text-[11px] text-gray-400 font-medium">
              AI Generated · Review Required
            </span>
          </div>
          <div className="text-sm text-gray-700 leading-[1.8] whitespace-pre-wrap">
            {sections[activeSection]?.content}
          </div>
        </div>
      </div>
    </div>
  );
}
