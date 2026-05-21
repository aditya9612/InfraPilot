import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, Check, X } from 'lucide-react';

interface Props {
    onCapture: (file: File, dataUrl: string) => void;
    onCancel: () => void;
}

const DSRCameraCapture: React.FC<Props> = ({ onCapture, onCancel }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        startCamera();
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => {
                    track.stop();
                });
            }
        };
    }, []);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment' }, 
                audio: false 
            });
            streamRef.current = mediaStream;
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
            setError(null);
        } catch (err) {
            setError('Camera access denied or not available.');
            console.error(err);
        }
    };

    const takePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            if (context) {
                canvasRef.current.width = videoRef.current.videoWidth;
                canvasRef.current.height = videoRef.current.videoHeight;
                context.drawImage(videoRef.current, 0, 0);
                const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.8);
                setCapturedImage(dataUrl);
            }
        }
    };

    const confirmPhoto = () => {
        if (capturedImage) {
            fetch(capturedImage)
                .then(res => res.blob())
                .then(blob => {
                    const file = new File([blob], `dsr_site_${Date.now()}.jpg`, { type: 'image/jpeg' });
                    onCapture(file, capturedImage);
                });
        }
    };

    const retake = () => {
        setCapturedImage(null);
    };

    return (
        <div className="relative w-full max-w-2xl mx-auto bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-800">
            {error ? (
                <div className="p-8 text-center text-rose-400 font-bold">
                    <X className="w-12 h-12 mx-auto mb-4" />
                    <p>{error}</p>
                    <button onClick={startCamera} className="mt-4 px-6 py-2 bg-slate-800 rounded-xl text-white">Retry</button>
                </div>
            ) : (
                <>
                    <div className="aspect-video bg-black flex items-center justify-center overflow-hidden relative">
                        {capturedImage ? (
                            <img src={capturedImage} alt="Captured Site" className="w-full h-full object-cover" />
                        ) : (
                            <video 
                                ref={videoRef} 
                                autoPlay 
                                playsInline 
                                className="w-full h-full object-cover"
                            />
                        )}
                        <canvas ref={canvasRef} className="hidden" />
                        
                        {!capturedImage && (
                            <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-lg border border-white/10">
                                <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                                <span className="text-[10px] font-bold text-white uppercase tracking-widest">Live Site Feed</span>
                            </div>
                        )}
                    </div>

                    <div className="p-6 flex items-center justify-center gap-6 bg-slate-800/80 backdrop-blur-xl border-t border-white/5">
                        {capturedImage ? (
                            <>
                                <button 
                                    onClick={retake}
                                    className="p-4 bg-slate-700 text-white rounded-2xl hover:bg-slate-600 transition-all active:scale-90 flex flex-col items-center gap-1 min-w-[80px]"
                                >
                                    <RefreshCw className="w-6 h-6" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">Retake</span>
                                </button>
                                <button 
                                    onClick={confirmPhoto}
                                    className="p-5 bg-emerald-500 text-white rounded-3xl hover:bg-emerald-400 shadow-xl shadow-emerald-500/20 transition-all active:scale-90 flex items-center gap-3 px-8"
                                >
                                    <Check className="w-7 h-7 font-black" />
                                    <span className="text-sm font-black uppercase tracking-[0.1em]">Use Photo</span>
                                </button>
                            </>
                        ) : (
                            <>
                                <button 
                                    onClick={onCancel}
                                    className="p-4 bg-slate-700/50 text-slate-400 rounded-2xl hover:bg-rose-500 hover:text-white transition-all flex flex-col items-center gap-1 min-w-[80px]"
                                >
                                    <X className="w-6 h-6" />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">Cancel</span>
                                </button>
                                <button 
                                    onClick={takePhoto}
                                    className="p-8 bg-white text-slate-900 rounded-full hover:scale-105 shadow-2xl transition-all active:scale-95 border-8 border-slate-700/30"
                                >
                                    <Camera className="w-8 h-8" />
                                </button>
                            </>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default DSRCameraCapture;
