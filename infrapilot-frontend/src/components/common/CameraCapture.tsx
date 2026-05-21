import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, Check, X } from 'lucide-react';

interface Props {
    onCapture: (file: File) => void;
    onCancel: () => void;
}

const CameraCapture: React.FC<Props> = ({ onCapture, onCancel }) => {
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
                    console.log("Camera track stopped:", track.label);
                });
            }
        };
    }, []);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'user' }, 
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
                const dataUrl = canvasRef.current.toDataURL('image/png');
                setCapturedImage(dataUrl);
            }
        }
    };

    const confirmPhoto = () => {
        if (capturedImage) {
            // Convert dataUrl to File
            fetch(capturedImage)
                .then(res => res.blob())
                .then(blob => {
                    const file = new File([blob], `selfie_${Date.now()}.png`, { type: 'image/png' });
                    onCapture(file);
                });
        }
    };

    const retake = () => {
        setCapturedImage(null);
    };

    return (
        <div className="relative w-full max-w-md mx-auto bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-800">
            {error ? (
                <div className="p-8 text-center text-rose-400 font-bold">
                    <X className="w-12 h-12 mx-auto mb-4" />
                    <p>{error}</p>
                    <button onClick={startCamera} className="mt-4 px-6 py-2 bg-slate-800 rounded-xl text-white">Retry</button>
                </div>
            ) : (
                <>
                    <div className="aspect-[4/3] bg-black flex items-center justify-center overflow-hidden">
                        {capturedImage ? (
                            <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
                        ) : (
                            <video 
                                ref={videoRef} 
                                autoPlay 
                                playsInline 
                                className="w-full h-full object-cover mirror"
                                style={{ transform: 'scaleX(-1)' }}
                            />
                        )}
                        <canvas ref={canvasRef} className="hidden" />
                    </div>

                    <div className="p-6 flex items-center justify-center gap-6 bg-slate-800/50 backdrop-blur-md">
                        {capturedImage ? (
                            <>
                                <button 
                                    onClick={retake}
                                    className="p-4 bg-slate-700 text-white rounded-full hover:bg-slate-600 transition-all active:scale-90"
                                    title="Retake"
                                >
                                    <RefreshCw className="w-6 h-6" />
                                </button>
                                <button 
                                    onClick={confirmPhoto}
                                    className="p-6 bg-emerald-500 text-white rounded-full hover:bg-emerald-400 shadow-xl shadow-emerald-500/20 transition-all active:scale-90"
                                    title="Confirm"
                                >
                                    <Check className="w-8 h-8" />
                                </button>
                            </>
                        ) : (
                            <>
                                <button 
                                    onClick={onCancel}
                                    className="p-4 bg-slate-700 text-white rounded-full hover:bg-rose-500 transition-all"
                                    title="Cancel"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                                <button 
                                    onClick={takePhoto}
                                    className="p-8 bg-white text-slate-900 rounded-full hover:scale-105 shadow-2xl transition-all active:scale-95"
                                    title="Capture Selfie"
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

export default CameraCapture;
