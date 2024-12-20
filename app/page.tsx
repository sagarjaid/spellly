'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getAudioUrl } from '@/utils/unrealSpeech';
import { PlayCircle } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  const [isWordRevealed, setIsWordRevealed] = useState<boolean>(false);

  const [englishLevel, setEnglishLevel] = useState<string>('random');
  const [vocabularyType, setVocabularyType] = useState<string>('random');

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
    setLearnedWords(updatedWords);
    localStorage.setItem('learnedWords', JSON.stringify(updatedWords));
  };

  const generateNewWord = async () => {
    setError(null);
    setIsLoading(true);
    setIsWordRevealed(false); // Hide the word when a new word is generated

    try {
      const response = await fetch('/api/generate-word', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({
          englishLevel:
            englishLevel === 'random'
              ? 'easy or little difficult or difficult'
              : englishLevel,
          vocabularyType:
            vocabularyType === 'random'
              ? 'daily, academic and professional'
              : vocabularyType,
        }),
        cache: 'no-store',
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
      generateNewWord(); // Generate a new word after correct spelling
    }
  };

  const toggleWordRevealed = () => {
    setIsWordRevealed(!isWordRevealed); // Toggle the visibility of the word
  };

  return (
    <div className='flex flex-col py-20 gap-6 items-center justify-center min-h-screen'>
      <h1 className='text-2xl font-bold'>Learn Spelling with Audio</h1>
      <div className='bg-white p-8 rounded-lg border w-96'>
        <div className='mb-4 flex flex-col gap-4'>
          <Select
            defaultValue='random'
            onValueChange={setEnglishLevel}>
            <SelectTrigger>
              <SelectValue placeholder='English Level: Random' />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>English Level</SelectLabel>
                <SelectItem value='random'>Random</SelectItem>
                <SelectItem value='easy'>Easy</SelectItem>
                <SelectItem value='little difficult'>Difficult</SelectItem>
                <SelectItem value='difficult'>Hard</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select
            defaultValue='random'
            onValueChange={setVocabularyType}>
            <SelectTrigger>
              <SelectValue placeholder='Setup: Random' />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Vocabulary Type</SelectLabel>
                <SelectItem value='random'>Random</SelectItem>
                <SelectItem value='daily'>Daily</SelectItem>
                <SelectItem value='academic'>Academic</SelectItem>
                <SelectItem value='professional'>Professional</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

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
        <Button
          onClick={toggleWordRevealed}
          className='w-full mb-4'
          disabled={!currentWord}>
          {isWordRevealed && currentWord ? 'Hide Spelling' : 'Reveal Spelling'}
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
        {isWordRevealed && currentWord && (
          /* eslint-disable-next-line react/no-unescaped-entities */
          <p className='text-center mt-4 text-md font-semibold'>
            "{currentWord}"
          </p>
        )}
      </div>

      <div className='bg-white p-8 rounded-lg border w-96'>
        <h2 className='text-xl font-semibold mb-4'>Learned Words</h2>
        <ul className='list-disc flex gap-6 flex-wrap'>
          {learnedWords.map((word, index) => (
            <li key={index}>{word}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
