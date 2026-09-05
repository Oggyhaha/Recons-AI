"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  FileUp
} from "lucide-react";
import { api } from "@/lib/api";
import { SampleTemplate } from "@/lib/types";

interface CsvUploaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CsvUploaderModal: React.FC<CsvUploaderModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [templates, setTemplates] = useState<SampleTemplate[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
      setFile(null);
      setUploadResult(null);
      setError(null);
    }
  }, [isOpen]);

  const loadTemplates = async () => {
    try {
      const res = await api.getSampleTemplates();
      setTemplates(res.templates);
    } catch (e) {
      console.error("Failed to fetch templates:", e);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (selectedFile: File) => {
    if (!selectedFile.name.toLowerCase().endsWith(".csv")) {
      setError("Please select a valid .csv file.");
      return;
    }
    setFile(selectedFile);
    setError(null);
    setUploadResult(null);
  };

  const handleUpload = async () => {
    if (!file) return;
    try {
      setUploading(true);
      setError(null);
      const res = await api.uploadCsv(file, "AUTO_DETECT");
      setUploadResult(res);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error("Upload failed:", err);
      setError(err.message || "Failed to process and reconcile CSV file.");
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto"
    >
      <div className="bg-white rounded-2xl shadow-fin-elevated border border-slate-200 w-full max-w-3xl max-h-[95vh] sm:max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 flex items-center justify-between bg-[#0C2340] text-white">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-white/10 border border-white/20 rounded-xl text-[#3395FF] shrink-0">
              <UploadCloud className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-300 font-mono tracking-wider">
                  DATA INGESTION ENGINE
                </span>
                <span className="text-slate-500 hidden sm:inline">•</span>
                <span className="text-xs sm:text-sm font-bold text-white">
                  Real Bank Statement & Settlement CSV Uploader
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5">
                Upload real CSV files for automated 4-way matching, fee auditing, and cash recalibration
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors shrink-0"
            aria-label="Close CSV uploader"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-3.5 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5 flex-1 bg-slate-50/40">
          {/* Sample Templates Strip */}
          <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-[#0C83FF]" />
                <span className="text-xs font-bold text-[#0C2340] uppercase tracking-wider">
                  Download Sample Test CSVs (1-Click Test)
                </span>
              </div>
              <span className="text-[11px] text-blue-600 font-medium">Ready to upload</span>
            </div>
            <p className="text-xs text-slate-600 mb-3">
              Don't have a real bank file handy? Download one of our pre-structured sample CSVs:
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={api.downloadSampleTemplateUrl("unified")}
                download="unified_transactions_template.csv"
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-[#0C83FF]" />
                <span>Unified Multi-Source CSV</span>
              </a>
              <a
                href={api.downloadSampleTemplateUrl("bank_statement")}
                download="bank_statement_template.csv"
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-[#0C83FF]" />
                <span>HDFC Bank Payout Statement</span>
              </a>
              <a
                href={api.downloadSampleTemplateUrl("orders")}
                download="orders_commerce_template.csv"
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-[#0C83FF]" />
                <span>Shopify Orders Export</span>
              </a>
            </div>
          </div>

          {/* Drag and Drop Zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
              dragActive
                ? "border-[#0C83FF] bg-blue-50/50 scale-[0.99]"
                : "border-slate-300 hover:border-[#0C83FF] bg-white hover:bg-slate-50/50"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0C83FF] flex items-center justify-center mx-auto mb-3 border border-blue-100 shadow-2xs">
              <FileUp className="w-6 h-6" />
            </div>

            {file ? (
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-900 font-mono">{file.name}</p>
                <p className="text-xs text-slate-500 font-mono">
                  {(file.size / 1024).toFixed(1)} KB • Ready for automated reconciliation
                </p>
                <span className="inline-block mt-2 text-xs font-semibold text-[#0C83FF] bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                  Click to change file
                </span>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-800">
                  Drag and drop your bank or settlement CSV here
                </p>
                <p className="text-xs text-slate-500">
                  Or <span className="text-[#0C83FF] font-semibold underline">browse files</span> from your computer
                </p>
                <p className="text-[11px] text-slate-400 mt-2">
                  Supports HDFC, ICICI, SBI bank statements & Razorpay settlement reports
                </p>
              </div>
            )}
          </div>

          {/* Error Notice */}
          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Summary */}
          {uploadResult && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{uploadResult.message}</span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
                <div className="p-2.5 bg-white rounded-lg border border-emerald-200/80">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Parsed Rows</span>
                  <span className="font-mono font-bold text-slate-900">{uploadResult.parsed_rows}</span>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-emerald-200/80">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Match Rate</span>
                  <span className="font-mono font-bold text-emerald-700">
                    {uploadResult.summary?.match_rate}%
                  </span>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-emerald-200/80">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Exceptions</span>
                  <span className="font-mono font-bold text-slate-900">
                    {uploadResult.summary?.exception_count}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Cancel
            </button>

            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="px-5 py-2.5 text-xs font-bold text-white bg-[#0C83FF] hover:bg-[#0266CC] disabled:opacity-50 rounded-xl shadow-sm transition-colors flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Parsing & Reconciling...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Ingest & Reconcile Now</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
