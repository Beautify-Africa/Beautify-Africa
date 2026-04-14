import { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';

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
      const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
      const response = await fetch(`${BASE_URL}/api/upload`, {
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
    <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 font-serif text-2xl text-stone-900">Cloudinary Asset Studio</h3>
      <p className="mb-6 text-sm text-stone-500">
        Upload high-resolution product imagery directly to the global CDN. The server will optimize and format the asset.
      </p>

      {/* Upload Zone */}
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-stone-300 bg-stone-50 p-8 text-center hover:border-amber-500 transition-colors">
        {preview && !uploadUrl ? (
          <img src={preview} alt="Preview" className="mb-4 h-48 w-48 rounded-lg object-cover shadow-sm" />
        ) : (
          <div className="mb-4 rounded-full bg-stone-200 p-4">
            <svg className="h-8 w-8 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
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
          className="cursor-pointer rounded-full bg-stone-900 px-6 py-2.5 text-xs font-bold uppercase tracking-widest text-white hover:bg-stone-800 transition-all"
        >
          {preview && !uploadUrl ? 'Change Image' : 'Select Image'}
        </label>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {/* Actions */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleUpload}
          disabled={!file || isUploading}
          className="rounded-full bg-amber-600 px-8 py-3 text-xs font-bold uppercase tracking-widest text-white hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isUploading ? 'Uploading to CDN...' : 'Upload to Cloudinary'}
        </button>
      </div>

      {/* Success Result */}
      {uploadUrl && (
        <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-800 mb-2">Upload Complete</p>
          <p className="text-sm text-emerald-700 break-all mb-3">{uploadUrl}</p>
          <img src={uploadUrl} alt="Cloudinary Result" className="h-32 w-32 rounded object-cover shadow-sm" />
        </div>
      )}
    </div>
  );
}
