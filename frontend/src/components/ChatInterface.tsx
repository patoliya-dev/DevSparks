/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Mic, 
  Volume2, 
  VolumeX, 
  Trash2, 
  Settings as SettingsIcon,
  History,
  Download,
  Upload,
  HelpCircle,
  MessageSquare,
  Bot,
  Cloud,
  Square,
  LogOut,
  User
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Settings from './Settings';
import ThemeDebug from './ThemeDebug';

interface Message {
  id: string;
  text: string;
  type: 'user' | 'ai' | 'system';
  timestamp: Date;
  isVoice?: boolean;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data?: unknown;
  error?: string;
}
interface ChatInterface {
  user:any
}
// Add these interfaces and props to your ChatInterface component
const ChatInterface: React.FC = () => {
  const { user, logout } = useAuth();
  console.log('user :>> ', user);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeechEnabled, setIsSpeechEnabled] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [speechSynthesisSupported, setSpeechSynthesisSupported] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Audio Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [silenceTimer, setSilenceTimer] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0); // For debugging
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isProcessingRef = useRef(false);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const voiceDetectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Audio Recording Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const silenceStartTimeRef = useRef<number | null>(null);
  const lastVoiceDetectedRef = useRef<number>(0);

  // Your API endpoint - using local API for now
  const API_ENDPOINT = 'https://9e05948d440b.ngrok-free.app/';

  // Voice Activity Detection Settings - Made more sensitive
  const VOICE_THRESHOLD = 30; // Lower threshold for better sensitivity
  const SILENCE_DURATION = 2000; // 2 seconds of silence
  const MIN_RECORDING_TIME = 1000; // Minimum 1 second recording
  const VOICE_CHECK_INTERVAL = 100; // Check every 100ms

  // Client-side initialization
  useEffect(() => {
    setIsClient(true);
    setSpeechSynthesisSupported('speechSynthesis' in window);
    
    const welcomeMsg: Message = {
      id: Date.now().toString(),
      text: "Welcome to Voice AI Assistant! Click the microphone to start speaking. I'll automatically submit after 2 seconds of silence.",
      type: 'system',
      timestamp: new Date()
    };
    setMessages([welcomeMsg]);
  }, []);

  // WAV Encoding Functions
  const floatTo16BitPCM = (output: DataView, offset: number, input: Float32Array) => {
    for (let i = 0; i < input.length; i++, offset += 2) {
      const s = Math.max(-1, Math.min(1, input[i]));
      output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
  };

  const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  const encodeWAV = (samples: Float32Array, sampleRate: number): ArrayBuffer => {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, 'data');
    view.setUint32(40, samples.length * 2, true);

    floatTo16BitPCM(view, 44, samples);
    return buffer;
  };

  const convertToWAV = async (audioBlob: Blob): Promise<Blob> => {
    const arrayBuffer = await audioBlob.arrayBuffer();
    
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    try {
      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
      const samples = audioBuffer.getChannelData(0);
      const sampleRate = audioBuffer.sampleRate;
      const wavArrayBuffer = encodeWAV(samples, sampleRate);
      return new Blob([wavArrayBuffer], { type: 'audio/wav' });
    } catch (error) {
      console.error('Error converting to WAV:', error);
      throw error;
    }
  };

  const sendAudioToAPI = async (wavBlob: Blob): Promise<string> => {
    try {
      console.log('Sending WAV file to API...', wavBlob.size, 'bytes');
      
      const formData = new FormData();
      formData.append('audio', wavBlob, 'recording.wav');
      formData.append('sessionId','');
      formData.append('user',user?.id || 'guest');



      const response = await fetch(`${API_ENDPOINT}stt`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
          'ngrok-skip-browser-warning': 'true',
          'User-Agent': 'AITalker/1.0',
        },
        mode: 'cors',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      // Check if response is JSON or WAV file
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        // Handle JSON response
        const result = await response.json();
        
        let transcription = '';
        if (typeof result === 'string') {
          transcription = result;
        } else if (result.transcription) {
          transcription = result.transcription;
        } else if (result.text) {
          transcription = result.text;
        } else if (result.transcript) {
          transcription = result.transcript;
        } else if (result.data?.transcription) {
          transcription = result.data.transcription;
        } else if (result.response) {
          transcription = result.response;
        }

        return transcription || '';
      } else if (contentType && contentType.includes('audio/wav')) {
        // Handle WAV file response
        const wavBlob = await response.blob();
        console.log('Received WAV file from API:', wavBlob.size, 'bytes');
        
        // For now, return a placeholder message
        // You can process the WAV file further if needed
        return `Received WAV file (${wavBlob.size} bytes) from API`;
      } else {
        // Try to parse as text
        const text = await response.text();
        return text || 'No transcription received';
      }
    } catch (error) {
      console.error('API transcription error:', error);
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        throw new Error('Network error: Unable to reach the API server.');
      }
      throw error;
    }
  };

  // FIXED: Improved Voice Activity Detection
  const checkVoiceActivity = useCallback(() => {
    if (!analyserRef.current || !isRecording) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Calculate average volume
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i];
    }
    const average = sum / bufferLength;
    setAudioLevel(Math.round(average)); // For debugging

    const currentTime = Date.now();
    const hasVoice = average > VOICE_THRESHOLD;

    if (hasVoice) {
      // Voice detected
      lastVoiceDetectedRef.current = currentTime;
      
      if (!isSpeaking) {
        console.log('Voice activity started, level:', average);
        setIsSpeaking(true);
        setSilenceTimer(0);
        silenceStartTimeRef.current = null;
        
        // Clear any pending auto-submit
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = null;
        }
      }
    } else {
      // No voice detected
      if (isSpeaking) {
        // Just stopped speaking
        console.log('Voice activity stopped, starting silence timer');
        setIsSpeaking(false);
        silenceStartTimeRef.current = currentTime;
        
        // Start auto-submit countdown
        if (!silenceTimeoutRef.current && recordingTime >= MIN_RECORDING_TIME / 1000) {
          console.log('Starting auto-submit timer...');
          silenceTimeoutRef.current = setTimeout(() => {
            console.log('Auto-submitting after silence');
            stopRecording();
          }, SILENCE_DURATION);
        }
      }
      
      // Update silence timer for display
      if (silenceStartTimeRef.current) {
        const silenceDuration = currentTime - silenceStartTimeRef.current;
        setSilenceTimer(Math.floor(silenceDuration / 100));
      }
    }
  }, [isRecording, isSpeaking, recordingTime]);

  // Start recording with improved voice detection
  const startRecording = async () => {
    try {
      console.log('Starting recording...');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 44100,
          channelCount: 1,
          echoCancellation: false, // Better for voice detection
          noiseSuppression: false,
          autoGainControl: false
        }
      });

      streamRef.current = stream;

      // Create audio context and analyser
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const source = audioContextRef.current.createMediaStreamSource(stream);
      const analyser = audioContextRef.current.createAnalyser();
      
      // Configure analyser for better voice detection
      analyser.fftSize = 2048;
      analyser.minDecibels = -100;
      analyser.maxDecibels = -10;
      analyser.smoothingTimeConstant = 0.8;
      
      source.connect(analyser);
      analyserRef.current = analyser;

      // Setup MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log('MediaRecorder stopped, processing...');
        
        // Cleanup
        setIsSpeaking(false);
        setSilenceTimer(0);
        setAudioLevel(0);
        silenceStartTimeRef.current = null;
        lastVoiceDetectedRef.current = 0;
        
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = null;
        }
        
        if (voiceDetectionIntervalRef.current) {
          clearInterval(voiceDetectionIntervalRef.current);
          voiceDetectionIntervalRef.current = null;
        }
        
        await processRecording();
      };

      // Start recording and timers
      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingTime(0);
      setIsSpeaking(false);
      setSilenceTimer(0);
      setAudioLevel(0);
      
      // Start recording timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      // Start voice detection interval
      voiceDetectionIntervalRef.current = setInterval(checkVoiceActivity, VOICE_CHECK_INTERVAL);

      console.log('Recording started with voice detection');

    } catch (error) {
      console.error('Failed to start recording:', error);
      const errorMsg: Message = {
        id: Date.now().toString(),
        text: 'Failed to access microphone. Please check your permissions.',
        type: 'system',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    }
  };

  const stopRecording = () => {
    console.log('Stopping recording manually or auto-submit...');
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Clear all timers
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }

    if (voiceDetectionIntervalRef.current) {
      clearInterval(voiceDetectionIntervalRef.current);
      voiceDetectionIntervalRef.current = null;
    }

    setIsRecording(false);
    setRecordingTime(0);
    setIsSpeaking(false);
    setSilenceTimer(0);
    setAudioLevel(0);
  };

  const processRecording = async () => {
    try {
      if (audioChunksRef.current.length === 0) {
        throw new Error('No audio data recorded');
      }

      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      console.log('Processing audio blob, size:', audioBlob.size);

      const wavBlob = await convertToWAV(audioBlob);
      console.log('WAV conversion complete, size:', wavBlob.size);

      const processingMsg: Message = {
        id: 'processing-' + Date.now(),
        text: 'Processing audio with API...',
        type: 'system',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, processingMsg]);

      const transcription = await sendAudioToAPI(wavBlob);

      setMessages(prev => prev.filter(msg => msg.id !== processingMsg.id));

      if (transcription.trim()) {
        const userMessage: Message = {
          id: Date.now().toString(),
          text: transcription,
          type: 'user',
          timestamp: new Date(),
          isVoice: true
        };
        setMessages(prev => [...prev, userMessage]);

        await handleVoiceResponse(transcription);
      } else {
        const errorMsg: Message = {
          id: Date.now().toString(),
          text: 'No speech detected in the recording. Please try again.',
          type: 'system',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMsg]);
      }

    } catch (error) {
      console.error('Failed to process recording:', error);
      
      setMessages(prev => prev.filter(msg => msg.text.includes('Processing audio')));
      
      const errorMsg: Message = {
        id: Date.now().toString(),
        text: `Failed to process audio: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'system',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    }
  };

  const handleVoiceResponse = async (transcription: string) => {
    try {
      const apiResponse = await sendToAI(transcription);
      
      const aiMessage: Message = {
        id: Date.now().toString(),
        text: apiResponse.message,
        type: apiResponse.success ? 'ai' : 'system',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      if (isSpeechEnabled && apiResponse.success && speechSynthesisSupported) {
        speak(apiResponse.message);
      }
    } catch (error) {
      console.error('Failed to get AI response:', error);
      const errorMsg: Message = {
        id: Date.now().toString(),
        text: 'Failed to get AI response. Please try again.',
        type: 'system',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    }
  };

  const speak = useCallback((text: string, callback?: () => void) => {
    if (!isClient || !speechSynthesisSupported) return;
    
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => {
      setSpeaking(false);
      if (callback) callback();
    };
    utterance.onerror = () => setSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
  }, [isClient, speechSynthesisSupported]);

  const cancelSpeech = useCallback(() => {
    if (isClient && speechSynthesisSupported) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    }
  }, [isClient, speechSynthesisSupported]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatSilenceTime = (centiseconds: number): string => {
    const seconds = centiseconds / 10;
    return `${seconds.toFixed(1)}s`;
  };

  const sendToAI = async (message: string): Promise<ApiResponse> => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, timestamp: new Date() }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, message: data.response, data };
    } catch (error) {
      console.error('API Error:', error);
      return { 
        success: false, 
        message: 'Sorry, I encountered an error processing your request.', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    cancelSpeech();
    
    const welcomeMsg: Message = {
      id: Date.now().toString(),
      text: "Chat cleared! Click the microphone to start speaking. I'll automatically submit after 2 seconds of silence.",
      type: 'system',
      timestamp: new Date()
    };
    setMessages([welcomeMsg]);
  };

  const toggleSpeech = () => {
    if (speaking) {
      cancelSpeech();
    }
    setIsSpeechEnabled(!isSpeechEnabled);
  };

  const sidebarOptions = [
    { icon: MessageSquare, label: 'New Conversation', action: clearChat },
    { icon: History, label: 'Chat History', action: () => console.log('Chat History') },
    { icon: SettingsIcon, label: 'Settings', action: () => setIsSettingsOpen(true) },
    { icon: Download, label: 'Export Chat', action: () => console.log('Export') },
    { icon: Upload, label: 'Import Chat', action: () => console.log('Import') },
    { icon: HelpCircle, label: 'Help', action: () => console.log('Help') },
    { icon: LogOut, label: 'Logout', action: logout },
  ];

  useEffect(() => {
    setIsClient(true);
    setSpeechSynthesisSupported('speechSynthesis' in window);
    
    const welcomeMsg: Message = {
      id: Date.now().toString(),
      text: `Welcome back, ${user?.name ?? 'User'}! Click the microphone to start speaking. I'll automatically submit after 2 seconds of silence.`,
      type: 'system',
      timestamp: new Date()
    };
    setMessages([welcomeMsg]);
  }, [user?.name]);
  if (!isClient) {
    return (
      <div className="flex h-screen bg-gray-100">
        <div className="w-64 bg-white shadow-lg border-r">
          <div className="p-4 border-b">
            <div className="flex items-center space-x-2">
              <Bot className="h-8 w-8 text-blue-500" />
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Voice AI Assistant</h2>
            </div>
          </div>
          <div className="p-4">Loading...</div>
        </div>
        
        <div className="flex-1 flex flex-col">
          <div className="bg-white shadow-sm p-4 border-b">
            <h1 className="text-xl font-semibold text-gray-800">Loading...</h1>
          </div>
          
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <p>Loading Voice AI Assistant...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-gray-800 shadow-lg border-r border-gray-200 dark:border-gray-700 flex flex-col transition-colors duration-300">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bot className="h-8 w-8 text-blue-500" />
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Voice AI Assistant</h2>
            </div>
            <button
              onClick={logout}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Logout"
            >
              <LogOut className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
          
          {/* User Info */}
          {user && (
            <div className="mt-3 flex items-center space-x-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Status Section */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Status</h3>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Cloud className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">API Transcription Ready</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isSpeaking ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {isSpeaking ? 'Voice Detected' : 'Listening for Voice'}
              </span>
            </div>
            {isRecording && (
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Audio Level: {audioLevel}
                </span>
              </div>
            )}
          </div>
        </div>
        
        {/* Sidebar Menu */}
        <div className="flex-1 p-4">
          <div className="space-y-1">
            {sidebarOptions.map((option, index) => (
              <button
                key={index}
                onClick={option.action}
                className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left group"
              >
                <option.icon size={20} className="text-gray-600 dark:text-gray-400 group-hover:text-blue-600" />
                <span className="text-gray-800 dark:text-gray-200 group-hover:text-blue-600">{option.label}</span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Voice Settings */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Voice Settings</h3>
          <div className="space-y-2">
            <button
              onClick={toggleSpeech}
              className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                isSpeechEnabled 
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800' 
                  : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              {isSpeechEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
              <span>{isSpeechEnabled ? 'Voice Enabled' : 'Voice Disabled'}</span>
            </button>
            
            <button
              onClick={clearChat}
              className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 dark:hover:text-red-400 transition-colors text-gray-600 dark:text-gray-400"
            >
              <Trash2 size={20} />
              <span>Clear Conversation</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow-sm p-4 border-b border-gray-200 dark:border-gray-700 transition-colors duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-semibold text-gray-800 dark:text-white">
                Voice AI Assistant
              </h1>
              
              {isRecording && (
                <div className="flex items-center space-x-1 px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-xs">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span>RECORDING {formatTime(recordingTime)}</span>
                </div>
              )}

              {isRecording && isSpeaking && (
                <div className="flex items-center space-x-1 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-xs">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span>SPEAKING (Level: {audioLevel})</span>
                </div>
              )}

              {isRecording && !isSpeaking && silenceTimer > 0 && (
                <div className="flex items-center space-x-1 px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 text-xs">
                  <div className="w-2 h-2 rounded-full bg-orange-500" />
                  <span>SILENCE {formatSilenceTime(silenceTimer)} / 2.0s</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1 px-2 py-1 rounded-full text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400">
                <Cloud className="w-3 h-3" />
                <span>Auto-Submit (2s silence)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 pb-50 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
          {messages.length <= 1 && (
            <div className="text-center text-gray-500 dark:text-gray-400 mt-16">
              <Bot className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <p className="text-xl font-medium mb-2">
                Voice AI Assistant Ready!
              </p>
              <p className="text-sm mb-2">
                Click the microphone to start speaking
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {`I'll automatically submit after 2 seconds of silence`}
              </p>
            </div>
          )}

          <div className="space-y-4 max-w-4xl">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-3 rounded-2xl ${
                    message.type === 'user'
                      ? 'bg-blue-500 text-white rounded-br-sm'
                      : message.type === 'ai'
                      ? 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-bl-sm shadow-sm'
                      : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border border-yellow-300 dark:border-yellow-800'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.text}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs opacity-70">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                    {message.isVoice && (
                      <div className="flex items-center space-x-1">
                        <Mic size={12} className="opacity-70" />
                        <span className="text-xs opacity-70">Auto</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 max-w-xs lg:max-w-md px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm">
                  <div className="flex items-center space-x-2">
                    <div className="animate-pulse flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce delay-75"></div>
                      <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce delay-150"></div>
                    </div>
                    <span className="text-sm">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div ref={messagesEndRef} />
        </div>

        {/* Voice Controls */}
        <div className="fixed bottom-0 left-64 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-20 transition-colors duration-300" style={{padding:'calc(var(--spacing) * 7.2)'}}>
          <div className="flex justify-center items-center space-x-6">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isLoading}
              className={`p-6 rounded-full transition-all duration-200 shadow-lg ${
                isRecording
                  ? isSpeaking 
                    ? 'bg-green-500 text-white hover:bg-green-600 scale-110' 
                    : 'bg-orange-500 text-white hover:bg-orange-600 scale-110'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {isRecording ? <Square size={32} /> : <Mic size={32} />}
            </button>
            
            {isRecording && (
              <div className="text-center">
                <div className="relative inline-block">
                  {/* Google-style mic animation */}
                  <div className="relative w-20 h-20 flex items-center justify-center">
                    {/* Ripple circles */}
                    <div className="absolute inset-0 rounded-full border-2 border-blue-400/30 google-mic-ripple"></div>
                    <div className="absolute inset-0 rounded-full border-2 border-blue-400/20 google-mic-ripple"></div>
                    <div className="absolute inset-0 rounded-full border-2 border-blue-400/10 google-mic-ripple"></div>
                    
                    {/* Main mic button */}
                    <div className={`relative w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center shadow-lg google-mic-pulse ${
                      isSpeaking ? 'bg-green-500' : 'bg-blue-500'
                    }`}>
                      <Mic size={32} className="text-white" />
                    </div>
                  </div>
                </div>
                {isSpeaking ? (
                  <p className="text-sm text-green-600 font-medium mt-2">
                    Speaking detected (Level: {audioLevel})
                  </p>
                ) : silenceTimer > 0 ? (
                  <p className="text-sm text-orange-600 mt-2">
                    Silence: {formatSilenceTime(silenceTimer)} / 2.0s
                  </p>
                ) : (
                  <p className="text-sm text-gray-500 mt-2">Listening...</p>
                )}
              </div>
            )}
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {isRecording 
                ? isSpeaking
                  ? 'Keep speaking or pause for 2 seconds to auto-submit'
                  : silenceTimer > 0
                    ? 'Auto-submitting soon...'
                    : 'Waiting for speech...'
                : 'Click microphone to start'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <Settings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        isSpeechEnabled={isSpeechEnabled}
        onToggleSpeech={toggleSpeech}
      />

      {/* Theme Debug - Remove this in production */}
      <ThemeDebug />
    </div>
  );
};

export default ChatInterface;
