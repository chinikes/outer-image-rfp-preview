"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

export default function UploadPage() {
  const router = useRouter();
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    setError(null);
    const f = e.dataTransfer?.files?.[0];
    if (
      f &&
      (f.name.endsWith(".pdf") ||
        f.name.endsWith(".xlsx") ||
        f.name.endsWith(".xls"))
    ) {
      setFile(f);
    } else {
      setError("Only PDF and Excel files are accepted.");
    }
  }, []);

  const handleSelect = (e) => {
    setError(null);
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setResult(data.proposal);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="max-w-[680px] mx-auto px-6 py-12">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-[28px] font-bold text-brand-navy tracking-tight">
          Upload RFP
        </h1>
        <p className="text-[15px] text-gray-500 mt-2 leading-relaxed">
          Upload a PDF or Excel file. The system will extract requirements,
          match your content library, and generate a proposal draft.
        </p>
      </div>

      {!result ? (
        <>
          {/* Drop Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => {
              if (!file) document.getElementById("file-input")?.click();
            }}
            className={`border-2 border-dashed rounded-2xl text-center transition-all cursor-pointer
              ${file ? "p-8 border-brand-teal-light bg-teal-50/30" : "p-16 border-gray-300 bg-gray-50"}
              ${dragOver ? "border-brand-teal bg-cyan-50" : ""}`}
          >
            {file ? (
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-brand-teal" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline strokeLinecap="round" strokeLinejoin="round" points="14 2 14 8 20 8"/>
                  </svg>
                </div>
                <div className="flex-1 text-left">
                  <div className="text-[15px] font-semibold text-gray-700">{file.name}</div>
                  <div className="text-[13px] text-gray-400 mt-0.5">{(file.size / 1024).toFixed(0)} KB</div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); handleReset(); }}
                  className="px-3.5 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-500 text-[13px] font-medium hover:bg-gray-50"
                >
                  Remove
                </button>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 rounded-2xl bg-teal-50 flex items-center justify-center mx-auto mb-5">
                  <svg className="w-7 h-7 text-brand-teal" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline strokeLinecap="round" strokeLinejoin="round" points="17 8 12 3 7 8"/>
                    <line strokeLinecap="round" strokeLinejoin="round" x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                </div>
                <div className="text-base font-semibold text-gray-700 mb-1.5">
                  Drag & drop your RFP here
                </div>
                <div className="text-[13px] text-gray-400">
                  or{" "}
                  <span className="text-brand-teal font-semibold underline">
                    browse files
                  </span>{" "}
                  — PDF, XLSX, XLS accepted
                </div>
              </>
            )}
            <input
              id="file-input"
              type="file"
              accept=".pdf,.xlsx,.xls"
              onChange={handleSelect}
              className="hidden"
            />
          </div>

          {/* Error message */}
          {error && (
            <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Submit button */}
          {file && (
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="mt-5 w-full py-3.5 px-6 rounded-xl border-none bg-gradient-to-br from-brand-navy to-brand-navy-light text-white text-[15px] font-semibold tracking-wide flex items-center justify-center gap-2.5 hover:opacity-90 disabled:opacity-70 transition-all"
            >
              {uploading ? (
                <>
                  <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25"/>
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                  Processing upload...
                </>
              ) : (
                "Submit to Pipeline"
              )}
            </button>
          )}
        </>
      ) : (
        /* Success state */
        <div className="border-2 border-green-500 rounded-2xl p-10 text-center bg-green-50">
          <div className="w-14 h-14 rounded-full bg-green-200 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <polyline strokeLinecap="round" strokeLinejoin="round" points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div className="text-lg font-bold text-green-800 mb-1.5">
            RFP Submitted Successfully
          </div>
          <div className="text-sm text-green-600 mb-1">
            Status: <strong>{result.status}</strong>
          </div>
          <div className="text-[13px] text-gray-500 mb-6">
            The pipeline is now parsing your document. You'll see it on the
            dashboard shortly.
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={handleReset}
              className="px-5 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-600 text-sm font-medium hover:bg-gray-50"
            >
              Upload Another
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-5 py-2.5 rounded-lg border-none bg-brand-navy text-white text-sm font-semibold hover:opacity-90"
            >
              View Dashboard
            </button>
          </div>
        </div>
      )}

      {/* How It Works cards */}
      <div className="grid grid-cols-3 gap-4 mt-12">
        {[
          { step: "1", title: "Upload", desc: "Drop your RFP file — PDF or Excel format" },
          { step: "2", title: "AI Parses", desc: "Requirements extracted and classified automatically" },
          { step: "3", title: "Draft Ready", desc: "80–90% complete proposal in under 30 minutes" },
        ].map((item) => (
          <div key={item.step} className="p-5 rounded-xl bg-gray-50 border border-gray-200">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-teal to-brand-teal-accent text-white text-[13px] font-bold flex items-center justify-center mb-2.5">
              {item.step}
            </div>
            <div className="text-sm font-semibold text-gray-700 mb-1">{item.title}</div>
            <div className="text-xs text-gray-500 leading-relaxed">{item.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
