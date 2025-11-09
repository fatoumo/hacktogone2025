"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Phone, PhoneOff } from "lucide-react";
import { useConversation } from "@elevenlabs/react";

interface VoiceChatProps {
  agentId: string;
}

export function VoiceChat({ agentId }: VoiceChatProps) {
  const conversation = useConversation({
    agentId,
    onConnect: () => {
      console.log("Connected to agent");
    },
    onDisconnect: () => {
      console.log("Disconnected from agent");
    },
    onError: (message: string) => {
      console.error("Conversation error:", message);
    },
  });

  const isConnected = conversation.status === "connected";
  const isConnecting = conversation.status === "connecting";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Voice Chat</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg">
            <div className="flex flex-col items-center gap-4">
              {/* Status Indicator */}
              <div className="text-center">
                {conversation.status === "connected" ? (
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
                    <span className="font-medium">Connected</span>
                  </div>
                ) : conversation.status === "connecting" ? (
                  <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                    <div className="w-2 h-2 bg-yellow-600 rounded-full animate-pulse" />
                    <span className="font-medium">Connecting...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="w-2 h-2 bg-gray-400 rounded-full" />
                    <span className="font-medium">Disconnected</span>
                  </div>
                )}
              </div>

              {/* Voice Indicator */}
              {isConnected && (
                <div className="relative">
                  <div
                    className={`w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center ${
                      conversation.isSpeaking ? "animate-pulse" : ""
                    }`}
                  >
                    {conversation.isSpeaking ? (
                      <Mic className="w-10 h-10 text-primary" />
                    ) : (
                      <MicOff className="w-10 h-10 text-muted-foreground" />
                    )}
                  </div>
                </div>
              )}

              {/* Connect/Disconnect Button */}
              <Button
                onClick={() => {
                  if (isConnected) {
                    conversation.endSession();
                  } else {
                    // The hook already has agentId, so we just need to provide it again for the session
                    conversation.startSession({ agentId } as any);
                  }
                }}
                variant={isConnected ? "destructive" : "default"}
                size="lg"
                disabled={isConnecting}
              >
                {isConnected ? (
                  <>
                    <PhoneOff className="mr-2 h-5 w-5" />
                    End Call
                  </>
                ) : (
                  <>
                    <Phone className="mr-2 h-5 w-5" />
                    Start Call
                  </>
                )}
              </Button>

              {/* Instructions */}
              {!isConnected && (
                <div className="text-center text-sm text-muted-foreground max-w-md">
                  <p>
                    Click the button above to start a voice conversation with the AI
                    agent. Make sure your microphone is enabled.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-2">How to use voice chat:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Click "Start Call" to begin the conversation</li>
              <li>• Speak naturally into your microphone</li>
              <li>• The agent will respond with voice</li>
              <li>• Click "End Call" to terminate the conversation</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
