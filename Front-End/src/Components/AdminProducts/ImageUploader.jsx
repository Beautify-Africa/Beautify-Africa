import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { API_URL } from '../../services/apiConfig';

export default function ImageUploader() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadUrl, setUploadUrl] = useState('');
  const [error, setError] = useState('');
  const { token } = useAuth();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setUploadUrl('');
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select an image first.');
      return;
    }

    setIsUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Upload failed');
      }

      setUploadUrl(data.url);
      setFile(null); // Clear selection after success
    } catch (err) {
      setError(err.message || 'An error occurred during upload.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-[#0E131F] p-6 shadow-xl">
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-amber-400">CDN Storage Vault</p>
          </div>
          <h3 className="mt-1 text-lg font-bold tracking-tight text-white">Asset Studio</h3>
        </div>
        <span className="rounded-md border border-zinc-700/60 bg-zinc-800/50 px-2.5 py-1 text-[11px] font-mono text-zinc-400">
          Cloudinary Secure Pipeline
        </span>
      </div>
      <p className="mb-6 text-xs text-zinc-400">
        Upload high-resolution commerce assets directly to the edge CDN. The server dynamically verifies, transforms, and optimizes each payload.
      </p>

      {/* Upload Zone */}
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-800 bg-[#090D16] p-8 text-center hover:border-amber-400/60 transition-colors">
        {preview && !uploadUrl ? (
          <img
            src={preview}
            alt="Preview"
            className="mb-4 h-44 w-44 rounded-xl border border-zinc-700 object-cover shadow-lg"
            loading="lazy"
            decoding="async"
            fetchPriority="low"
          />
        ) : (
          <div className="mb-4 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-4 shadow-inner">
            <svg
              className="h-8 w-8 text-zinc-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
              />
            </svg>
          </div>
        )}

        <input
          type="file"
          id="image-upload"
          accept="image/jpeg, image/png, image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
        <label
          htmlFor="image-upload"
          className="cursor-pointer rounded-xl border border-zinc-700 bg-zinc-800 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-200 hover:bg-zinc-700 hover:text-white transition-all shadow-sm"
        >
          {preview && !uploadUrl ? 'Change Selected Asset' : 'Select Local Asset'}
        </label>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-400 font-medium">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="mt-5 flex justify-end">
        <button
          onClick={handleUpload}
          disabled={!file || isUploading}
          className="rounded-xl bg-amber-400 px-6 py-2.5 text-xs font-bold uppercase tracking-[0.14em] text-stone-950 hover:bg-amber-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-amber-950/30"
        >
          {isUploading ? 'Dispatching to CDN...' : 'Deploy to Cloudinary'}
        </button>
      </div>

      {/* Success Result */}
      {uploadUrl && (
        <div className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400 mb-1">
            Edge CDN Ingestion Complete
          </p>
          <p className="font-mono text-xs text-emerald-300 break-all mb-3 select-all bg-black/40 p-2 rounded border border-emerald-500/20">
            {uploadUrl}
          </p>
          <img
            src={uploadUrl}
            alt="Cloudinary Result"
            className="h-32 w-32 rounded-lg border border-emerald-500/30 object-cover shadow-md"
            loading="lazy"
            decoding="async"
            fetchPriority="low"
          />
        </div>
      )}
    </div>
  );
}
