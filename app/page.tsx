'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getAudioUrl } from '@/utils/unrealSpeech';
import { PlayCircle } from 'lucide-react';

// Define the expected response structure from the API
interface GenerateWordResponse {
  word: string;
  error?: string;
}

export default function SpellingGame() {
  const [currentWord, setCurrentWord] = useState<string>('');
  const [userInput, setUserInput] = useState<string>('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [learnedWords, setLearnedWords] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    loadLearnedWords();
  }, []);

  const loadLearnedWords = () => {
    const storedWords = localStorage.getItem('learnedWords');
    if (storedWords) {
      try {
        setLearnedWords(JSON.parse(storedWords));
      } catch (e) {
        console.error('Error parsing learned words from localStorage:', e);
        setLearnedWords([]);
      }
    }
  };

  const saveLearnedWord = (word: string) => {
    const updatedWords = Array.from(new Set([...learnedWords, word]));
    // const updatedWords = [...new Set([...learnedWords, word])];
    setLearnedWords(updatedWords);
    localStorage.setItem('learnedWords', JSON.stringify(updatedWords));
  };

  const generateNewWord = async () => {
    setError(null);
    setIsLoading(true);
    try {
      const response = await fetch('/api/generate-word', {
        method: 'POST', // or 'POST' depending on your API method
        headers: {
          'Cache-Control': 'no-cache', // Disable caching
        },
        cache: 'no-store', // Ensures the browser doesn't cache the response (alternative to 'no-cache')
      });
      if (!response.ok) {
        throw new Error(
          `Failed to fetch word: ${response.status} ${response.statusText}`
        );
      }
      const data: GenerateWordResponse = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setCurrentWord(data.word.toLowerCase());
      setUserInput('');
      setIsCorrect(null);
      await playWordAudio(data.word);
    } catch (error) {
      console.error('Error generating word:', error);
      setError(
        `Failed to generate or play a new word: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const playWordAudio = async (word: string) => {
    try {
      const url = await getAudioUrl(word);
      setAudioUrl(url);
      const audio = new Audio(url);

      // Ensure audio playback complies with browser restrictions
      await audio.play();
    } catch (e) {
      console.error('Error playing audio:', e);
      setError(
        `Failed to play audio: ${
          e instanceof Error ? e.message : 'Unknown error'
        }`
      );
    }
  };

  const replayAudio = () => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play().catch((e) => {
        console.error('Error replaying audio:', e);
        setError('Failed to replay audio.');
      });
    }
  };

  const checkSpelling = () => {
    const correct =
      userInput.trim().toLowerCase() === currentWord.trim().toLowerCase();
    setIsCorrect(correct);
    if (correct) {
      saveLearnedWord(currentWord);
      setUserInput(''); // Clear the input box
      generateNewWord();
    }
  };

  return (
    <div className='flex flex-col items-center justify-center min-h-screen bg-gray-100'>
      <h1 className='text-2xl font-bold mb-8'>Learn Spelling with Audio</h1>
      <div className='bg-white p-8 rounded-lg shadow-md w-96'>
        <Button
          onClick={generateNewWord}
          className='w-full mb-4'
          disabled={isLoading}>
          {isLoading ? 'Generating...' : 'Generate New Word'}
        </Button>
        <div className='mb-4 flex'>
          <Input
            type='text'
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder='Type the word you hear'
            className='flex-grow mr-2'
          />
          <Button
            onClick={replayAudio}
            className='flex-shrink-0 flex items-center'
            disabled={!audioUrl}>
            <PlayCircle className='h-4 w-4 mr-2' />
            Replay
          </Button>
        </div>
        <Button
          onClick={checkSpelling}
          className='w-full mb-4'>
          Check Spelling
        </Button>
        {isCorrect !== null && (
          <p
            className={`text-center ${
              isCorrect ? 'text-green-600' : 'text-red-600'
            }`}>
            {isCorrect ? 'Correct!' : 'Incorrect. Try again!'}
          </p>
        )}
        {error && <p className='text-center text-red-600 mt-4'>{error}</p>}
      </div>
      <div className='mt-8'>
        <h2 className='text-xl font-semibold mb-4'>Learned Words</h2>
        <ul className='list-disc pl-5'>
          {learnedWords.map((word, index) => (
            <li key={index}>{word}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
