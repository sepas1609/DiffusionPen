import React, { useState, useRef } from 'react';
import { FileImporter, ImportedDocument } from '../../importers/FileImporter';

interface FileImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyText: (text: string, filename: string) => void;
}

export const FileImportModal: React.FC<FileImportModalProps> = ({ isOpen, onClose, onApplyText }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [importedDoc, setImportedDoc] = useState<ImportedDocument | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const importerRef = useRef(new FileImporter());

  if (!isOpen) return null;

  const handleFileProcess = async (file: File) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const result = await importerRef.current.importFile(file);
      setImportedDoc(result);
    } catch (e: any) {
      setErrorMsg(e?.message || 'Failed to parse file. Please verify format.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleApply = () => {
    if (importedDoc) {
      onApplyText(importedDoc.text, importedDoc.filename);
      onClose();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel"
        style={{
          width: '680px',
          maxWidth: '100%',
          background: '#121622',
          border: '1px solid rgba(0, 242, 254, 0.3)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 30px rgba(0, 242, 254, 0.15)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#f8fafc' }}>
              Import Document to Handwritten Synthesis
            </h3>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>
              Supports PDF, Microsoft Word (.docx), Plain Text (.txt), and Markdown (.md)
            </span>
          </div>
          <button
            className="btn btn-secondary"
            onClick={onClose}
            style={{ width: '32px', height: '32px', padding: 0, justifyContent: 'center' }}
          >
            ✕
          </button>
        </div>

        {/* Drag & Drop Area */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${isDragging ? '#00f2fe' : 'rgba(255, 255, 255, 0.15)'}`,
            borderRadius: '12px',
            background: isDragging ? 'rgba(0, 242, 254, 0.05)' : 'rgba(255, 255, 255, 0.02)',
            padding: '36px 20px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept=".pdf,.docx,.txt,.md"
            onChange={(e) => e.target.files?.[0] && handleFileProcess(e.target.files[0])}
          />
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>📄</div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#f1f5f9', marginBottom: '4px' }}>
            {isLoading ? 'Extracting text from document...' : 'Click to browse or drag & drop file here'}
          </div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            PDF reports, Word problem sets, lab notes, or essay transcripts
          </div>
        </div>

        {errorMsg && (
          <div style={{ color: '#f43f5e', fontSize: '12px', padding: '8px', background: 'rgba(244, 63, 94, 0.1)', borderRadius: '6px' }}>
            {errorMsg}
          </div>
        )}

        {/* First Page Preview Card */}
        {importedDoc && (
          <div
            style={{
              background: '#0d1017',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', background: 'rgba(0, 242, 254, 0.15)', color: '#00f2fe', padding: '2px 8px', borderRadius: '4px', fontWeight: 600, textTransform: 'uppercase' }}>
                  {importedDoc.fileType}
                </span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>{importedDoc.filename}</span>
              </div>
              <span style={{ fontSize: '11.5px', color: '#94a3b8' }}>
                {importedDoc.wordCount.toLocaleString()} words • {importedDoc.totalChars.toLocaleString()} characters
              </span>
            </div>

            <div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                Sample Preview of Page 1 Write-Up:
              </div>
              <div
                style={{
                  maxHeight: '120px',
                  overflowY: 'auto',
                  background: '#fdfbf7',
                  color: '#1e293b',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  fontFamily: 'cursive',
                  fontSize: '13.5px',
                  lineHeight: '1.5',
                  boxShadow: 'inset 0 0 10px rgba(0,0,0,0.06)',
                }}
              >
                {importedDoc.firstPagePreview || importedDoc.text.slice(0, 300)}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            disabled={!importedDoc || isLoading}
            onClick={handleApply}
          >
            Apply to Viewport & Synthesize Handwritten Output
          </button>
        </div>
      </div>
    </div>
  );
};
