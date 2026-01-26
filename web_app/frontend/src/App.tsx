import { useState } from 'react';
import axios from 'axios';
import UploadZone from './components/UploadZone';
import GraphVis from './components/GraphVis';
import type { CircuitData } from './types';



// You might need to adjust this URL depending on your deployment
const API_URL = 'http://localhost:8000';

function App() {
  const [data, setData] = useState<CircuitData | null>(null);
  const [loading, setLoading] = useState(false);


  const handleUpload = async (file: File) => {
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

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
    const filename = data.netlist || 'circuit.scs';
    link.download = filename.replace('.scs', '.json');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-screen h-screen bg-white text-gray-900 font-sans overflow-hidden flex flex-col relative">

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative z-0">

        {/* If no data, show upload zone centered */}
        {!data && (
          <div className="w-full h-full flex items-center justify-center p-4">
            <UploadZone onUpload={handleUpload} isLoading={loading} />
          </div>
        )}

        {/* If data, show splitscreen (now full screen graph) */}
        {data && (
          <div className="flex-1 relative w-full h-full">
            <GraphVis
              data={data}
              onDownloadJson={handleDownloadJson}
              onClose={() => setData(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
