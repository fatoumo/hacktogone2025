import { useEffect, useRef, useState } from "react";

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
  start(): void;
  stop(): void;
  abort(): void;
}

interface ISpeechRecognitionConstructor {
  new (): ISpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition?: ISpeechRecognitionConstructor;
    webkitSpeechRecognition?: ISpeechRecognitionConstructor;
  }
}

export function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);

  useEffect(() => {
    // Check if speech recognition is supported
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      setIsSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "fr-FR"; // French language

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interim = "";
        let final = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result && result[0]) {
            const transcriptText = result[0].transcript;

            if (result.isFinal) {
              final += transcriptText + " ";
            } else {
              interim += transcriptText;
            }
          }
        }

        setInterimTranscript(interim);
        if (final) {
          setTranscript((prev) => prev + final);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setTranscript("");
      setInterimTranscript("");
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const resetTranscript = () => {
    setTranscript("");
    setInterimTranscript("");
  };

  return {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  };
}
