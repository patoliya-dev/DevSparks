import { NextRequest, NextResponse } from 'next/server';

interface ChatRequest {
  message: string;
  timestamp: string;
}

interface ChatResponse {
  response: string;
  status: 'success' | 'error';
  timestamp: string;
}

export async function POST(request: NextRequest) {
  try {
    const { message }: ChatRequest = await request.json();

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { response: 'Please provide a message.', status: 'error', timestamp: new Date().toISOString() },
        { status: 400 }
      );
    }

    // Replace this with your actual offline AI model API call
    // For example, if using Ollama locally:
    /*
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3.1', // or your preferred model
        prompt: message,
        stream: false
      }),
    });
    
    const data = await response.json();
    const aiResponse = data.response;
    */

    // Mock AI response for demonstration (replace with your AI logic)
    const aiResponse = generateMockResponse(message);

    return NextResponse.json({
      response: aiResponse,
      status: 'success',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { 
        response: 'I apologize, but I encountered an error processing your request. Please try again.',
        status: 'error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Mock AI response generator (replace with your actual AI integration)
function generateMockResponse(message: string): string {
  const responses = {
    greeting: [
      "Hello! How can I help you today?",
      "Hi there! What would you like to talk about?",
      "Greetings! I'm here to assist you."
    ],
    question: [
      "That's an interesting question. Let me think about that...",
      "I understand what you're asking. Here's my response...",
      "Good question! Based on what I know..."
    ],
    default: [
      "I understand. Could you tell me more about that?",
      "That's fascinating. What else would you like to know?",
      "I see. Is there anything specific you'd like me to help with?"
    ]
  };

  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    return responses.greeting[Math.floor(Math.random() * responses.greeting.length)];
  } else if (lowerMessage.includes('?')) {
    return responses.question[Math.floor(Math.random() * responses.question.length)];
  } else {
    return responses.default[Math.floor(Math.random() * responses.default.length)];
  }
}
