import { useState } from 'react';
import axios from 'axios';
import UploadZone from './components/UploadZone';
import GraphVis from './components/GraphVis';
import StatsPanel from './components/StatsPanel';
import type { CircuitData, PerfSpecs, GraphNode } from './types';

import { Layout } from 'lucide-react';

// You might need to adjust this URL depending on your deployment
const API_URL = 'http://localhost:8000';

function App() {
  const [data, setData] = useState<CircuitData | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  const handleUpload = async (file: File, specs: PerfSpecs) => {
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('perf_specs', JSON.stringify(specs));

    try {
      const response = await axios.post(`${API_URL}/upload`, formData);
      setData(response.data);
    } catch (error) {
      console.error("Upload failed", error);
      alert("Failed to upload/process file. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadJson = () => {
    if (!data) return;
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    const filename = data.metadata.filename || 'circuit.scs';
    link.download = filename.replace('.scs', '.json');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-screen h-screen bg-white text-gray-900 font-sans overflow-hidden flex flex-col relative">

      {/* Top Bar (only visible when data is loaded) */}
      {data && (
        <div className="h-16 border-b border-gray-100 flex items-center px-6 bg-white z-10 shrink-0 justify-between">
          <div className="flex items-center gap-2 font-semibold text-lg tracking-tight">
            <div className="p-1.5 bg-blue-600 rounded-md text-white">
              <Layout size={18} strokeWidth={2.5} />
            </div>
            <span className="text-gray-900">
              ASPECTOR Circuit Visualizer
            </span>
          </div>

          <button
            onClick={() => { setData(null); setSelectedNode(null); }}
            className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors px-3 py-1.5 hover:bg-gray-50 rounded"
          >
            ← Upload New File
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative z-0">

        {/* If no data, show upload zone centered */}
        {!data && (
          <div className="w-full h-full flex items-center justify-center p-4">
            <UploadZone onUpload={handleUpload} isLoading={loading} />
          </div>
        )}

        {/* If data, show splitscreen */}
        {data && (
          <>
            <div className="flex-1 relative">
              <GraphVis
                data={data}
                onNodeClick={setSelectedNode}
                onDownloadJson={handleDownloadJson}
              />
            </div>
            <StatsPanel data={data} selectedNode={selectedNode} />
          </>
        )}
      </div>
    </div>
  );
}

export default App;
