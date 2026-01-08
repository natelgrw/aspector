import React, { useCallback, useState, useRef } from 'react';
import { Upload, FileText, Check, AlertCircle, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import type { PerfSpecs } from '../types';

interface UploadZoneProps {
    onUpload: (file: File, specs: PerfSpecs) => Promise<void>;
    isLoading: boolean;
}

const UploadZone: React.FC<UploadZoneProps> = ({ onUpload, isLoading }) => {
    const [file, setFile] = useState<File | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [specs, setSpecs] = useState<PerfSpecs>({
        gain: 0,
        UGBW: 0,
        PM: 0,
        power: 0
    });

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
            await onUpload(file, specs);
        } catch (err) {
            setError("Upload failed. Check console or try again.");
        }
    };

    return (
        <div className="w-full max-w-2xl px-4">
            <div className="text-center mb-10">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">
                    ASPECTOR Circuit Visualizer
                </h1>
                <p className="text-gray-500">
                    Upload your netlist file to analyze and visualize circuit topology.
                </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {/* Specs Section */}
                <div className="p-8 border-b border-gray-100 bg-gray-50/30">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="flex items-center justify-center w-5 h-5 rounded-md bg-blue-100 text-blue-600 text-xs font-bold">1</span>
                        Performance Specifications
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        {Object.keys(specs).map((key) => (
                            <div key={key}>
                                <label className="block text-xs font-medium text-gray-500 mb-1 ml-1 uppercase tracking-wide">
                                    {key}
                                </label>
                                <input
                                    type="number"
                                    step="any"
                                    value={specs[key as keyof PerfSpecs]}
                                    onChange={(e) => setSpecs({ ...specs, [key]: parseFloat(e.target.value) || 0 })}
                                    className="w-full bg-white border border-gray-200 text-gray-900 rounded px-3 py-2.5 text-sm font-mono focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-gray-300 shadow-sm"
                                    placeholder="0.0"
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Upload Section */}
                <div
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={clsx(
                        "p-12 transition-all duration-300 text-center relative cursor-pointer hover:bg-gray-50",
                        isDragOver ? "bg-blue-50/30" : "bg-white"
                    )}
                >
                    <input type="file" ref={fileInputRef} onChange={onFileSelect} accept=".scs" className="hidden" />

                    <div className="flex flex-col items-center gap-4">
                        <div className={clsx(
                            "w-16 h-16 rounded-2xl flex items-center justify-center transition-all mb-2",
                            (isDragOver || file) ? "bg-blue-50 text-blue-600 scale-105" : "bg-gray-50 text-gray-400"
                        )}>
                            {file ? <FileText size={28} /> : <Upload size={28} />}
                        </div>

                        {file ? (
                            <div>
                                <div className="font-semibold text-gray-900 text-lg mb-1">{file.name}</div>
                                <div className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB</div>
                            </div>
                        ) : (
                            <div>
                                <div className="font-medium text-gray-900 text-lg mb-1">Drag & drop your .scs file</div>
                                <div className="text-sm text-gray-400">or click to browse</div>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="absolute bottom-4 left-0 right-0 flex justify-center animate-fade-in-up">
                            <div className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-full text-sm font-medium border border-red-100 shadow-sm">
                                <AlertCircle size={16} />
                                {error}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Action */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
                    <button
                        onClick={handleSubmit}
                        disabled={!file || isLoading}
                        className={clsx(
                            "flex items-center gap-2 px-6 py-2.5 rounded font-medium transition-all shadow-sm text-sm",
                            file && !isLoading
                                ? "bg-blue-600 hover:bg-blue-700 text-white"
                                : "bg-gray-100 text-gray-400 cursor-not-allowed"
                        )}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                Generate Visualization <Check size={18} />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UploadZone;
