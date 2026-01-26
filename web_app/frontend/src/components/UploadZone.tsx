import React, { useCallback, useState, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import clsx from 'clsx';

interface UploadZoneProps {
    onUpload: (file: File) => Promise<void>;
    isLoading: boolean;
}

const UploadZone: React.FC<UploadZoneProps> = ({ onUpload, isLoading }) => {
    const [file, setFile] = useState<File | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const onDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    }, []);

    const onDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    }, []);

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            validateAndSetFile(e.dataTransfer.files[0]);
        }
    }, []);

    const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            validateAndSetFile(e.target.files[0]);
        }
    };

    const validateAndSetFile = (file: File) => {
        if (!file.name.endsWith('.scs')) {
            setError("Please upload a .scs file");
            return;
        }
        setError(null);
        setFile(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;
        try {
            await onUpload(file);
        } catch (err) {
            setError("Upload failed. Check console or try again.");
        }
    };

    return (
        <div className="w-full max-w-md px-6 animate-fade-in-up">
            <div className="text-center mb-10">
                <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-6">
                    <span className="text-white font-bold text-2xl tracking-tighter">SCS</span>
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">
                    Upload Netlist
                </h1>
                <p className="text-gray-500 text-lg">
                    Import your circuit topology
                </p>
            </div>

            <div
                className="bg-white rounded-[2rem] border border-gray-200 overflow-hidden p-2"
            >
                <div
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={clsx(
                        "rounded-[1.5rem] border border-dashed transition-all duration-200 p-8 text-center cursor-pointer min-h-[220px] flex flex-col items-center justify-center gap-4",
                        isDragOver
                            ? "border-blue-500 bg-blue-50/50"
                            : "border-gray-300 hover:border-gray-400 hover:bg-gray-50/50"
                    )}
                >
                    <input type="file" ref={fileInputRef} onChange={onFileSelect} accept=".scs" className="hidden" />

                    {!file ? (
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 font-medium text-xl">
                                +
                            </div>
                            <div className="text-gray-500 font-medium">Select .scs file</div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-4 w-full bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                                SCS
                            </div>
                            <div className="flex-1 text-left">
                                <div className="font-bold text-gray-900 truncate">{file.name}</div>
                                <div className="text-gray-500 text-xs font-mono">{(file.size / 1024).toFixed(1)} KB</div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-2 mt-2">
                    <button
                        onClick={handleSubmit}
                        disabled={!file || isLoading}
                        className={clsx(
                            "w-full py-3.5 rounded-full font-bold text-base transition-all flex items-center justify-center gap-2",
                            file && !isLoading
                                ? "bg-blue-600 hover:bg-blue-700 text-white"
                                : "bg-gray-100 text-gray-300 cursor-not-allowed"
                        )}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 size={20} className="animate-spin" />
                                Processing...
                            </>
                        ) : (
                            "Generate Visualization"
                        )}
                    </button>
                </div>
            </div>

            {error && (
                <div className="mt-6 flex justify-center animate-fade-in-up">
                    <div className="bg-red-50 text-red-600 px-4 py-2 rounded-full text-sm font-bold border border-red-100">
                        Error: {error}
                    </div>
                </div>
            )}
        </div>
    );
};

export default UploadZone;
