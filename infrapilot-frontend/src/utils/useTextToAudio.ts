import { useCallback } from 'react';

export const useTextToAudio = () => {
    const speak = useCallback((text: string) => {
        if (!window.speechSynthesis) {
            console.warn("Speech Synthesis not supported in this browser.");
            return;
        }

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);

        // Optional: Configure voice properties
        utterance.rate = 0.9; // Slightly slower for better clarity
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        // Try to find a pleasant English voice
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v =>
            v.lang.includes('en') && (v.name.includes('Google') || v.name.includes('Female'))
        );

        if (preferredVoice) {
            utterance.voice = preferredVoice;
        }

        window.speechSynthesis.speak(utterance);
    }, []);

    return { speak };
};
