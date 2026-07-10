import React, { useState, useEffect } from 'react';
import { Mic, Square, Trash2, Send } from 'lucide-react';
import { useAudioRecorder } from '../../utils/useAudioRecorder';
import toast from 'react-hot-toast';

interface Props {
    onSend: (blob: Blob) => void;
    label?: string;
}

const VoiceSubmission: React.FC<Props> = ({ onSend, label = "Record Voice Note" }) => {
    const { isRecording, audioUrl, audioBlob, startRecording, stopRecording, clearAudio } = useAudioRecorder();
    const [duration, setDuration] = useState(0);

    useEffect(() => {
        let interval: any;
        if (isRecording) {
            interval = setInterval(() => {
                setDuration(d => d + 1);
            }, 1000);
        } else {
            setDuration(0);
        }
        return () => clearInterval(interval);
    }, [isRecording]);

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSend = () => {
        if (audioBlob) {
            onSend(audioBlob);
            clearAudio();
            toast.success("Voice note sent!");
        }
    };

    return (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
                {isRecording && (
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-xs font-bold text-red-500 tabular-nums">{formatDuration(duration)}</span>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-3">
                {!audioUrl ? (
                    <button
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${isRecording ? 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100' : 'bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-100'}`}
                    >
                        {isRecording ? (
                            <>
                                <Square className="w-5 h-5 fill-current" />
                                <span>Stop Recording</span>
                            </>
                        ) : (
                            <>
                                <Mic className="w-5 h-5" />
                                <span>Start Recording</span>
                            </>
                        )}
                    </button>
                ) : (
                    <div className="flex-1 flex flex-col gap-3">
                        <div className="bg-white border border-slate-100 rounded-xl p-2 flex items-center gap-3">
                            <audio src={audioUrl} controls className="h-8 flex-1" />
                            <button
                                onClick={clearAudio}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                        <button
                            onClick={handleSend}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                        >
                            <Send className="w-4 h-4" />
                            <span>Send Voice Note</span>
                        </button>
                    </div>
                )}
            </div>

            <p className="mt-3 text-[10px] text-slate-400 text-center italic-none">
                {isRecording ? "Recording in progress... speak clearly" : audioUrl ? "Review your recording before sending" : "Tap to start recording your update"}
            </p>
        </div>
    );
};

export default VoiceSubmission;
