'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

type UploadResponse = {
  id: string;
  filename: string;
  url: string;
};

export default function ClientDocumentUploader() {
  const { id } = useParams(); // id comes from /clients/[id]
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [response, setResponse] = useState<UploadResponse | null>(null);

  const handleUpload = async () => {
    if (!file) {
      alert('Please select a file.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('accessToken');
    if (!token) {
      alert('You are not logged in!');
      return;
    }

    setUploading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_MAIN}/clients/${id}/documents`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Upload failed: ${errText}`);
      }

      const data: UploadResponse = await res.json();
      setResponse(data);
    } catch (err: unknown) {
      console.error('Upload error:', err);
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert('Error uploading file');
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg max-w-md mx-auto">
      <h2 className="text-lg font-semibold mb-2">Upload Client Document</h2>

      <input
        type="file"
        accept="image/*,application/pdf"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="mb-3"
      />

      <button
        onClick={handleUpload}
        disabled={!file || uploading}
        className="bg-blue-600 text-white px-4 py-2 rounded-md disabled:bg-gray-400"
      >
        {uploading ? 'Uploading...' : 'Upload'}
      </button>

      {response && (
        <div className="mt-4 bg-gray-50 p-3 rounded">
          <p>
            <b>ID:</b> {response.id}
          </p>
          <p>
            <b>Filename:</b> {response.filename}
          </p>
          <p>
            <b>URL:</b>{' '}
            <Link
              href={response.url}
              className="text-blue-600 underline break-all"
              target="_blank"
              rel="noopener noreferrer"
            >
              {response.url}
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
