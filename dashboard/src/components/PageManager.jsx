import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function PageManager() {
  const [pages, setPages] = useState([]);
  const [newPageId, setNewPageId] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/get_page.php')
      .then(res => res.json())
      .then(data => {
        if (data.success) setPages(data.pages);
        setLoading(false);
      });
  }, []);

  const handleCreate = () => {
    if (!newPageId.trim()) return alert('Enter a page ID');
    // Go to builder for new page
    navigate(`/admin/page-builder/${encodeURIComponent(newPageId)}`);
  };

  const handleEdit = (id) => {
    navigate(`/admin/page-builder/${encodeURIComponent(id)}`);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Page Manager</h1>
      <div className="mb-6 flex gap-2">
        <input
          className="border px-3 py-2 rounded w-full"
          placeholder="New page ID (e.g. about, services, custom-page)"
          value={newPageId}
          onChange={e => setNewPageId(e.target.value)}
        />
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          onClick={handleCreate}
        >Create New Page</button>
      </div>
      <h2 className="text-lg font-semibold mb-2">Existing Pages</h2>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <ul className="divide-y">
          {pages.length === 0 && <li className="py-2 text-gray-500">No pages found.</li>}
          {pages.map(page => (
            <li key={page.id} className="flex items-center justify-between py-2">
              <span>{page.id}</span>
              <button
                className="bg-gray-200 text-gray-700 px-3 py-1 rounded hover:bg-gray-300"
                onClick={() => handleEdit(page.id)}
              >Edit</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
} 