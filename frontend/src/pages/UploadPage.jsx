import { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadAPI } from '../api/apiService';
import { toast } from 'react-toastify';
import { RiUploadCloud2Line, RiFilePdf2Line, RiImageLine, RiCheckLine, RiTimeLine } from 'react-icons/ri';

const REQUIRED_DOCS = ['ID Proof', 'Admission Letter', 'Passport Photo'];

const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function UploadPage() {
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedType, setSelectedType] = useState(REQUIRED_DOCS[0]);

  useEffect(() => {
    uploadAPI.getDocuments()
      .then((res) => setDocuments(res.data.documents))
      .catch(() => toast.error('Could not load documents.'));
  }, []);

  const onDrop = useCallback(async (acceptedFiles) => {
    if (!acceptedFiles.length) return;
    const file = acceptedFiles[0];

    // Client-side size check (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large. Max 10MB allowed.');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    // Fake progress for UX
    const interval = setInterval(() => {
      setUploadProgress((p) => Math.min(p + 15, 90));
    }, 200);

    try {
      const res = await uploadAPI.uploadDocument(file, selectedType);
      clearInterval(interval);
      setUploadProgress(100);
      toast.success('Document uploaded successfully! ✅');
      setDocuments((prev) => [...prev, res.data.document]);
      setTimeout(() => setUploadProgress(0), 1000);
    } catch (err) {
      clearInterval(interval);
      setUploadProgress(0);
      toast.error(err.response?.data?.message || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  }, [selectedType]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'], 'image/jpeg': ['.jpg', '.jpeg'], 'image/png': ['.png'] },
    maxFiles: 1,
    disabled: uploading,
  });

  const uploadedTypes = documents.map((d) => d.originalName).join(' ');

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-white">Document Upload</h1>
        <p className="text-sm text-slate-400 mt-1">Upload your registration documents securely</p>
      </div>

      {/* Required docs checklist */}
      <div className="glass-card p-5">
        <p className="section-label mb-3">Required Documents</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {REQUIRED_DOCS.map((doc) => {
            const uploaded = documents.length > 0;
            return (
              <div key={doc} className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm
                ${uploaded ? 'border-emerald-600/40 bg-emerald-900/20' : 'border-white/10 bg-white/5'}`}>
                <span className={`text-lg ${uploaded ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {uploaded ? <RiCheckLine /> : <RiTimeLine />}
                </span>
                <span className={uploaded ? 'text-emerald-300' : 'text-slate-400'}>{doc}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upload Area */}
      <div className="glass-card p-5 space-y-4">
        {/* Document type selector */}
        <div>
          <label className="section-label mb-2 block">Document Type</label>
          <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}
            className="input-field w-full md:w-auto">
            {REQUIRED_DOCS.map((d) => <option key={d} value={d}>{d}</option>)}
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Drop zone */}
        <div {...getRootProps()} className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-200
          ${isDragActive ? 'border-primary-500 bg-primary-600/10' : 'border-white/10 hover:border-primary-600/50 hover:bg-white/5'}
          ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
          <input {...getInputProps()} />
          <RiUploadCloud2Line className="text-5xl text-slate-500 mx-auto mb-3" />
          <p className="text-sm font-medium text-white">
            {isDragActive ? 'Drop file here…' : 'Drag & drop or click to select'}
          </p>
          <p className="text-xs text-slate-500 mt-1">PDF, JPG, PNG · Max 10MB</p>
        </div>

        {/* Progress bar */}
        {uploadProgress > 0 && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Uploading…</span><span>{uploadProgress}%</span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-primary-600 to-accent-500 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Uploaded list */}
      {documents.length > 0 && (
        <div className="glass-card p-5">
          <p className="section-label mb-3">Uploaded Documents ({documents.length})</p>
          <div className="space-y-2">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/5">
                <span className="text-xl text-slate-400">
                  {doc.mimetype === 'application/pdf' ? <RiFilePdf2Line className="text-red-400" /> : <RiImageLine className="text-blue-400" />}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{doc.originalName}</p>
                  <p className="text-xs text-slate-500">{formatSize(doc.size)} · {new Date(doc.uploadedAt).toLocaleDateString('en-IN')}</p>
                </div>
                <span className={`badge ${doc.validated ? 'badge-approved' : 'badge-pending'}`}>
                  {doc.validated ? 'Valid' : 'Pending'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
