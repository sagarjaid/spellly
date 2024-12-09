export async function getAudioUrl(word: string): Promise<string> {
  const url = 'https://api.v7.unrealspeech.com/speech';
  const options = {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_UNREAL_SPEECH_API_KEY}`,
    },
    body: JSON.stringify({
      Text: word,
      VoiceId: 'Dan',
      Bitrate: '192k',
      Speed: '0',
      Pitch: '1',
      TimestampType: 'sentence',
    }),
  };

  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to generate audio: ${response.status} ${response.statusText}. ${errorText}`
      );
    }

    const data = await response.json();
    if (!data.OutputUri) {
      throw new Error('No audio URL in the response');
    }
    return data.OutputUri;
  } catch (error) {
    console.error('Error in getAudioUrl:', error);
    throw error;
  }
}
