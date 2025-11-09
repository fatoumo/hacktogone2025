"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ChatMessage } from "./ChatMessage";
import { Mic, MicOff, Send, Loader2 } from "lucide-react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Update input when transcript changes
  useEffect(() => {
    if (transcript) {
      setInput(transcript + interimTranscript);
    }
  }, [transcript, interimTranscript]);

  const handleMicToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      resetTranscript();
      startListening();
    }
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    if (isListening) {
      stopListening();
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    resetTranscript();
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";
      const assistantMessageId = (Date.now() + 1).toString();

      setMessages((prev) => [
        ...prev,
        {
          id: assistantMessageId,
          role: "assistant",
          content: "",
        },
      ]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          assistantMessage += chunk;

          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessageId
                ? { ...m, content: assistantMessage }
                : m
            )
          );
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim()) {
        const form = e.currentTarget.form;
        if (form) {
          form.requestSubmit();
        }
      }
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] max-w-4xl mx-auto p-4">
      {/* Messages Area */}
      <Card className="flex-1 overflow-y-auto mb-4 p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center">
            <div className="space-y-4 text-muted-foreground">
              <h2 className="text-2xl font-semibold text-foreground">
                Welcome to Hacktogone 2025 AI Chat
              </h2>
              <p>Start a conversation with our AI assistant</p>
              {isSupported && (
                <p className="text-sm">
                  💡 Tip: Use the microphone button to speak your message
                </p>
              )}
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                role={message.role}
                content={message.content}
              />
            ))}
            {isLoading && (
              <div className="flex gap-3 p-4 rounded-lg bg-muted">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-background flex items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="font-semibold text-sm">AI Assistant</div>
                  <div className="text-sm text-muted-foreground">
                    Thinking...
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </Card>

      {/* Input Area */}
      <Card className="p-4">
        <form onSubmit={onSubmit} className="space-y-2">
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message or click the microphone to speak..."
              className="pr-12 min-h-[80px] max-h-[200px] resize-none"
              disabled={isLoading}
            />
            {interimTranscript && (
              <div className="absolute top-2 right-14 text-xs text-muted-foreground italic">
                Listening...
              </div>
            )}
          </div>

          <div className="flex gap-2 justify-end">
            {isSupported && (
              <Button
                type="button"
                variant={isListening ? "destructive" : "outline"}
                size="icon"
                onClick={handleMicToggle}
                disabled={isLoading}
              >
                {isListening ? (
                  <MicOff className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>
            )}
            <Button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
