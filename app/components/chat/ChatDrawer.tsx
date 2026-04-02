'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Send, X, MessageSquare, Loader2, 
  Paperclip,
  CheckCheck
} from 'lucide-react';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import useSWR from 'swr';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import NextImage from 'next/image';
import { useSession } from 'next-auth/react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  sender: {
    id: string;
    firstName: string;
    lastName: string;
    profileImage?: string;
    professionalProfile?: {
      businessName?: string;
    };
  };
}

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  professionalId: string;
  professionalName: string;
  professionalImage?: string;
  currentUserId: string;
}

export function ChatDrawer({ 
  isOpen, 
  onClose, 
  professionalId, 
  professionalName, 
  professionalImage,
  currentUserId 
}: ChatDrawerProps) {
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [conversation, setConversation] = useState<Record<string, unknown> | null>(null);
  const [convError, setConvError] = useState<boolean>(false);
  const [convLoading, setConvLoading] = useState<boolean>(false);
  const { data: session } = useSession();

  // 1. Initialize Conversation once when opened
  const initConversation = useCallback(async () => {
    // Don't init if not open or if we're self-messaging
    if (!isOpen || !professionalId || !currentUserId) {
       return null;
    }
    
    if (professionalId === currentUserId) {
        return null;
    }
    
    try {
      setConvLoading(true);
      setConvError(false);
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ professionalId })
      });
      
      if (!res.ok) {
         const errText = await res.text();
         throw new Error(errText || "Failed to initialize");
      }
      const data = await res.json();
      setConversation(data);
      return data;
    } catch (err) {
      console.error("[ChatDrawer] Init error:", err);
      setConvError(true);
      return null;
    } finally {
      setConvLoading(false);
    }
  }, [isOpen, professionalId, currentUserId]);

  useEffect(() => {
    // Only run if open and not already initialized / currently loading
    if (isOpen && !conversation && !convLoading && currentUserId) {
      initConversation();
    }
  }, [isOpen, conversation, convLoading, currentUserId, initConversation]);

  // 2. Fetch Messages (Poll every 5s)
  const { data: messages, error: messagesError, mutate } = useSWR<Message[]>(
    conversation?.id ? `/api/conversations/${conversation.id}/messages` : null,
    fetcher,
    { 
      refreshInterval: 5000,
      revalidateOnFocus: false, // Prevent flicker on tab switch
    }
  );

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!inputText.trim() || isSending) return;

    let activeConv = conversation;
    if (!activeConv?.id) {
       console.log("[ChatDrawer] Conversation missing on send. Triggering manual init...");
       activeConv = await initConversation();
    }

    if (!activeConv?.id) {
       console.error("[ChatDrawer] Failed to establish conversation. Cannot send.");
       return;
    }

    const text = inputText;
    setInputText('');
    setIsSending(true);

    // Optimistic UI Update
    const tempId = Math.random().toString();
    const optimisticMessage: Message = {
        id: tempId,
        content: text,
        senderId: currentUserId,
        createdAt: new Date().toISOString(),
        sender: {
            id: currentUserId,
            firstName: 'You',
            lastName: '',
        }
    };

    try {
      console.log("[ChatDrawer] Sending message to server...");
      // Apply optimistic update immediately
      mutate([...(messages || []), optimisticMessage], false);

      const res = await fetch(`/api/conversations/${activeConv.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text })
      });

      if (res.ok) {
        console.log("[ChatDrawer] Message sent successfully.");
        // Trigger server-revalidation to sync everything
        mutate();
      } else {
        throw new Error("Failed to send");
      }
    } catch (err) {
      console.error("[ChatDrawer] Send error:", err);
      setInputText(text); // revert on error
      mutate(); // rollback to server state
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col h-full z-[10001] bg-white border-l border-stone-100 shadow-2xl">
        
        {/* Header */}
        <SheetHeader className="p-4 border-b border-stone-100 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border border-stone-100">
              <AvatarImage src={professionalImage} alt={professionalName} />
              <AvatarFallback className="bg-stone-100 text-stone-600 font-serif">
                {professionalName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <SheetTitle className="text-sm font-bold truncate max-w-[180px]">
                {professionalName}
              </SheetTitle>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-stone-400 uppercase tracking-widest font-mono">Online</span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-stone-50">
            <X className="h-4 w-4" />
          </Button>
        </SheetHeader>

        {/* Messages Area */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#FAFAF9]/50 custom-scrollbar"
        >
          {convError && (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <p className="text-sm text-red-500 font-medium">Failed to load chat</p>
                  <Button variant="link" onClick={() => onClose()}>Close</Button>
              </div>
          )}

          {convLoading && !conversation && (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-stone-300" />
              <p className="text-xs text-stone-400 font-serif italic">Setting up your atelier concierge...</p>
            </div>
          )}

          {conversation && !messages && !messagesError && (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-stone-300" />
            </div>
          )}

          {messagesError && (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <p className="text-sm text-red-500 font-medium">Unable to fetch message history</p>
              </div>
          )}

          {messages && messages.length === 0 && !isSending ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
              <div className="p-4 bg-stone-100 rounded-full">
                <MessageSquare className="h-8 w-8 text-stone-400" />
              </div>
              <div>
                <h4 className="font-bold text-stone-900">Start the conversation</h4>
                <p className="text-xs text-stone-500 mt-1 max-w-[200px]">
                  Introduce yourself to {professionalName.split(' ')[0]} and share your ideas.
                </p>
              </div>
            </div>
          ) : (messages && messages.length > 0) || isSending ? (
            <div className="space-y-6">
               {messages?.map((msg: Message) => {
                 const isMe = msg.senderId === currentUserId;
                 return (
                    <motion.div 
                      key={msg.id}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className={cn(
                        "flex w-full gap-3 items-end",
                        isMe ? "flex-row-reverse" : "flex-row"
                      )}
                    >
                      {/* Avatar */}
                      <div className="h-8 w-8 rounded-full border border-stone-100 bg-stone-50 overflow-hidden shrink-0 shadow-sm">
                        {isMe ? (
                          session?.user?.image ? (
                             <NextImage src={session.user.image} alt="Me" width={32} height={32} className="w-full h-full object-cover" />
                          ) : (
                             <div className="w-full h-full flex items-center justify-center bg-stone-900 text-[10px] text-white font-black uppercase">
                                {session?.user?.firstName?.[0] || 'U'}
                             </div>
                          )
                        ) : (
                          professionalImage ? (
                             <NextImage src={professionalImage} alt={professionalName} width={32} height={32} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-stone-200 text-[10px] text-stone-500 font-black uppercase">
                               {professionalName[0]}
                            </div>
                          )
                        )}
                      </div>
                     <div className={cn(
                        "max-w-[85%] space-y-1",
                        isMe ? "items-end" : "items-start"
                     )}>
                        {/* Sender Name */}
                        {!isMe && (
                           <p className="text-[9px] font-mono font-black uppercase tracking-widest text-stone-400 mb-1 ml-1">
                              {msg.sender.professionalProfile?.businessName || `${msg.sender.firstName} ${msg.sender.lastName}`}
                           </p>
                        )}
                        <div className={cn(
                          "px-4 py-3 rounded-2xl text-sm shadow-sm",
                          isMe 
                            ? "bg-stone-900 text-white rounded-tr-none" 
                            : "bg-white text-stone-800 border border-stone-100 rounded-tl-none"
                        )}>
                          {msg.content}
                        </div>
                        <div className={cn(
                            "flex items-center gap-2 px-1 text-[9px] font-mono uppercase tracking-tighter text-stone-400",
                            isMe ? "justify-end" : "justify-start"
                        )}>
                          {format(new Date(msg.createdAt), 'HH:mm')}
                          {isMe && <CheckCheck className="h-3 w-3 text-emerald-500" />}
                        </div>
                     </div>
                   </motion.div>
                 );
               })}
            </div>
          ) : null}
        </div>

        {/* Footer / Input */}
        <div className="p-4 border-t border-stone-100 bg-white">
          <form 
            onSubmit={handleSendMessage}
            className="flex items-center gap-2 bg-stone-100 rounded-2xl p-1 px-2 pr-1"
          >
            <Button type="button" variant="ghost" size="icon" className="rounded-full h-8 w-8 text-stone-400 hover:text-stone-900">
               <Paperclip className="h-4 w-4" />
            </Button>
            <Input 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type your message..."
              className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm h-10 px-0"
            />
            <Button 
                type="submit" 
                disabled={!inputText.trim() || isSending}
                className="rounded-xl h-9 w-9 p-0 bg-stone-900 hover:bg-stone-800 shrink-0"
            >
              {isSending || (convLoading && !conversation?.id) ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                 <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
          <p className="text-[9px] text-center text-stone-400 font-mono mt-3 uppercase tracking-widest">
            Typically replies in <span className="text-stone-900 font-bold">2 hours</span>
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
