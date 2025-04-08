/// <reference path="./types.d.ts" />
import React, { useState, useEffect } from 'react';
import styled from '@emotion/styled';
import { SpeechRecognition, SpeechRecognitionEvent } from './types';
import { ipcRenderer } from 'electron';

const Container = styled.div`
  padding: 20px;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
`;

const Header = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 20px;
`;

const Controls = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const Button = styled.button`
  padding: 10px 20px;
  border-radius: 5px;
  border: none;
  background-color: #007bff;
  color: white;
  cursor: pointer;
  &:hover {
    background-color: #0056b3;
  }
  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const TranscriptContainer = styled.div`
  flex: 1;
  padding: 20px;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  overflow-y: auto;
`;

const StatusText = styled.p`
  margin: 0;
  color: #666;
`;

const Instructions = styled.div`
  background-color: #e9ecef;
  padding: 15px;
  border-radius: 5px;
  margin-bottom: 15px;
`;

const App: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Initialize speech recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let currentTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
        
        if (event.results[event.results.length - 1].isFinal) {
          // Open in Chrome Canary
          // const command = 'open -a "Google Chrome Canary" "https://chat.openai.com"';
          // ipcRenderer.invoke('OPEN_IN_BROWSER', command);
          ipcRenderer.invoke('OPEN_IN_BROWSER', 'https://chat.openai.com');

        }
      };

      recognition.onerror = (event: Event) => {
        console.error('Speech recognition error:', event);
        setError('Speech recognition error occurred. Please try again.');
        stopListening();
      };

      setRecognition(recognition);
    } else {
      setError('Speech recognition is not supported in your browser.');
    }
  }, []);

  const startSystemAudioCapture = async () => {
    try {
      setError('');
      console.log('Starting system audio capture...');

      // Get system audio source
      const sourceId = await ipcRenderer.invoke('GET_SYSTEM_AUDIO_SOURCE');
      console.log('Got source ID:', sourceId);

      if (!sourceId) {
        setError('Could not find system audio source. Please check your system permissions.');
        return;
      }

      // First stop any existing streams
      stopListening();

      try {
        // Request system audio stream
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            mandatory: {
              chromeMediaSource: 'desktop',
              chromeMediaSourceId: sourceId
            }
          } as any
        });

        console.log('Got audio stream');

        // Create audio context and connect stream
        const audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);
        source.connect(audioContext.destination);

        setAudioStream(stream);
        
        if (recognition) {
          recognition.lang = 'en-US';
          recognition.continuous = true;
          recognition.interimResults = true;
          
          recognition.onerror = (event: any) => {
            console.error('Recognition error:', event);
            if (event.error === 'no-speech') {
              return; // Don't stop for no-speech errors
            }
            setError(`Speech recognition error: ${event.error}`);
            stopListening();
          };

          recognition.onend = () => {
            if (isListening) {
              try {
                recognition.start();
              } catch (e) {
                console.error('Failed to restart recognition:', e);
              }
            }
          };
          
          try {
            recognition.start();
            setIsListening(true);
          } catch (e) {
            console.error('Failed to start recognition:', e);
            setError('Failed to start speech recognition. Please try again.');
          }
        }
      } catch (streamError: any) {
        console.error('Stream error:', streamError);
        if (streamError.name === 'NotAllowedError' || streamError.name === 'PermissionDeniedError') {
          setError('Permission denied. Please allow screen capture in your system preferences.');
        } else if (streamError.name === 'NotFoundError') {
          setError('No audio source found. Please check your system audio settings.');
        } else if (streamError.name === 'NotReadableError' || streamError.name === 'AbortError') {
          setError('Could not access system audio. Please check if another application is using it.');
        } else {
          setError(`Error accessing system audio: ${streamError.message || 'Unknown error'}`);
        }
        stopListening();
      }
    } catch (error: any) {
      console.error('General error:', error);
      setError(`Unexpected error: ${error.message || 'Unknown error'}`);
      stopListening();
    }
  };

  const stopListening = () => {
    if (recognition) {
      recognition.stop();
      setIsListening(false);
    }
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop());
      setAudioStream(null);
    }
  };

  return (
    <Container>
      <Header>
        <Instructions>
          <h3>System Audio Speech Recognition</h3>
          <ol>
            <li>Click "Start Listening" to begin capturing system audio</li>
            <li>Play any audio content on your computer</li>
            <li>Watch the transcription appear below in real-time</li>
          </ol>
        </Instructions>
        <Controls>
          <Button 
            onClick={isListening ? stopListening : startSystemAudioCapture}
          >
            {isListening ? 'Stop Listening' : 'Start Listening'}
          </Button>
        </Controls>
        {error && (
          <StatusText style={{ color: '#dc3545' }}>
            {error}
          </StatusText>
        )}
        <StatusText>
          {isListening ? 'Listening to system audio...' : 'Click Start Listening to begin'}
        </StatusText>
      </Header>
      <TranscriptContainer>
        <h3>Transcript:</h3>
        <p>{transcript || 'No transcript available yet...'}</p>
      </TranscriptContainer>
    </Container>
  );
};

export default App; 