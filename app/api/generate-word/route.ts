import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Ensure your API key is set in environment variables
});

// Define the expected response structure
interface ChatResponse {
  word: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Extract the dropdown values from the request body
    const { englishLevel = 'easy', vocabularyType = 'daily' } =
      await req.json();

    // Construct the user prompt dynamically
    const userPrompt = `Generate a random English word which is most common. Word can be ${englishLevel} used in ${vocabularyType} setup. Avoid using fancy words. Respond in JSON format: {word: chatgpt_random_english_word}`;

    console.log(userPrompt, 'userPrompt');

    // Generate text with OpenAI's chat model with additional randomness parameters
    const chatCompletion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful assistant that generates random English words for a spelling game where user wants to learn English word spelling. Respond with a single word in JSON format.',
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      temperature: 1, // Controls randomness (higher = more random)
      top_p: 1, // Ensure full randomness in output (nucleus sampling)
      frequency_penalty: 0.5, // Avoid repetition in outputs
      presence_penalty: 0.5, // Encourage diversity in the word generation
    });

    // Extract the response content
    const text = chatCompletion.choices[0]?.message?.content;

    if (!text) {
      throw new Error('Empty response from ChatGPT');
    }

    // Parse the JSON response
    let parsedResponse: ChatResponse;
    try {
      parsedResponse = JSON.parse(text) as ChatResponse;
    } catch (error) {
      console.error('Error parsing JSON response:', error);
      throw new Error('Invalid JSON response from ChatGPT');
    }

    // Validate the structure of the response
    if (!parsedResponse || typeof parsedResponse.word !== 'string') {
      throw new Error('Invalid response structure from ChatGPT');
    }

    const word = parsedResponse.word.trim().toLowerCase();

    // Return the response using NextResponse for consistency with Next.js API routes
    return NextResponse.json(
      { word },
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store', // Prevent caching
        },
      }
    );
  } catch (error) {
    console.error('Error generating word:', error);
    return NextResponse.json(
      { error: 'Failed to generate word' },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store', // Prevent caching
        },
      }
    );
  }
}
