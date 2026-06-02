import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Trash2 } from 'lucide-react';
import Modal from '../../../components/common/Modal';
import toast from 'react-hot-toast';

interface AudioRecordModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (audioBase64: string) => Promise<void>;
}

const AudioRecordModal = ({ isOpen, onClose, onSave }: AudioRecordModalProps) => {
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [recordingTime, setRecordingTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<any>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (!isOpen) {
            deleteRecording();
        }
    }, [isOpen]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                setAudioBlob(blob);
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);
            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } catch (error) {
            console.error("Error accessing microphone:", error);
            toast.error("Microphone access denied or not available");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            setIsRecording(false);
            clearInterval(timerRef.current);
        }
    };

    const deleteRecording = () => {
        if (isRecording) stopRecording();
        setAudioBlob(null);
        setRecordingTime(0);
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = "";
        }
        setIsPlaying(false);
    };

    const togglePlay = () => {
        if (!audioRef.current || !audioBlob) return;
        
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            if (!audioRef.current.src) {
                audioRef.current.src = URL.createObjectURL(audioBlob);
                audioRef.current.onended = () => setIsPlaying(false);
            }
            audioRef.current.play();
            setIsPlaying(true);
        }
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const blobToBase64 = (blob: Blob): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    };

    const handleSave = async () => {
        if (!audioBlob) return;
        setIsSaving(true);
        try {
            const base64 = await blobToBase64(audioBlob);
            await onSave(base64);
            onClose();
        } catch (e) {
            toast.error("Failed to save audio");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Record Audio"
            maxWidth="max-w-md"
            footer={
                <>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors"
                        disabled={isSaving}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!audioBlob || isSaving}
                        className="px-6 py-2 bg-indigo-500 text-white text-sm font-bold rounded-xl shadow-sm hover:bg-indigo-600 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSaving ? "Saving..." : "Save Audio"}
                    </button>
                </>
            }
        >
            <div className="p-4 py-6 flex flex-col items-center justify-center min-h-[200px] bg-slate-50/50 rounded-2xl border border-slate-100">
                {!isRecording && !audioBlob && (
                    <div className="flex flex-col items-center gap-4">
                        <button 
                            type="button"
                            onClick={startRecording}
                            className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center hover:bg-emerald-200 hover:scale-105 transition-all shadow-sm"
                        >
                            <Mic className="w-8 h-8" />
                        </button>
                        <p className="text-sm font-medium text-slate-500">Click to start recording</p>
                    </div>
                )}
                
                {isRecording && (
                    <div className="flex flex-col items-center gap-4">
                        <button 
                            type="button"
                            onClick={stopRecording}
                            className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center hover:bg-rose-200 transition-all animate-pulse shadow-sm"
                        >
                            <Square className="w-6 h-6 fill-current" />
                        </button>
                        <div className="flex items-center gap-2 text-rose-500 font-bold text-lg">
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
                            {formatTime(recordingTime)}
                        </div>
                    </div>
                )}

                {audioBlob && !isRecording && (
                    <div className="w-full max-w-sm flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
                        <button 
                            type="button"
                            onClick={togglePlay}
                            className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-100 transition-colors shrink-0"
                        >
                            {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
                        </button>
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 w-full opacity-30"></div>
                        </div>
                        <button 
                            type="button"
                            onClick={deleteRecording}
                            className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                        <audio ref={audioRef} className="hidden" />
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default AudioRecordModal;
