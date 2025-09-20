import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const language = formData.get('language') as string || 'en';
    const model = formData.get('model') as string || 'whisper';

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    console.log('Received audio file:', {
      name: audioFile.name,
      size: audioFile.size,
      type: audioFile.type,
      language,
      model
    });

    // For now, return a mock transcription
    // In production, you would integrate with a real STT service like:
    // - OpenAI Whisper API
    // - Google Speech-to-Text
    // - Azure Speech Services
    // - AWS Transcribe

    const mockTranscriptions = [
      "Hello, how are you today?",
      "What's the weather like?",
      "Tell me a joke",
      "What time is it?",
      "How can I help you?",
      "This is a test message",
      "I'm testing the voice recognition",
      "Can you hear me clearly?",
      "Thank you for your help",
      "Goodbye for now"
    ];

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Return a random mock transcription
    const randomTranscription = mockTranscriptions[Math.floor(Math.random() * mockTranscriptions.length)];

    return NextResponse.json({
      success: true,
      transcription: randomTranscription,
      language,
      model,
      confidence: 0.95
    });

  } catch (error) {
    console.error('STT API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
