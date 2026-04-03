'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, MessageSquare, Send, 
  MoreVertical, Phone, Video,
  CheckCheck, Loader2, Filter,
  ArrowLeft, ShoppingBag, Zap, Image as ImageIcon
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import useSWR from 'swr';
import { motion, AnimatePresence } from 'framer-motion';
import NextImage from 'next/image';
import { useSession } from 'next-auth/react';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface Conversation {
  id: string;
  customerId: string;
  professionalId: string;
  subject: string;
  lastMessageAt: string;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    profileImage?: string;
  };
  professional: {
    id: string;
    firstName: string;
    lastName: string;
    profileImage?: string;
    professionalProfile?: {
      businessName?: string;
      businessImage?: string;
    }
  };
  messages: Array<{
    content: string;
    createdAt: string;
  }>;
}

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
  isRead: boolean;
};

export function InboxClient({ currentUserId, businessName }: { currentUserId: string, businessName?: string }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();
  
  const [isOtherOnline, setIsOtherOnline] = useState(false);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Fetch all conversations
  const { data: conversations, mutate: mutateConvs } = useSWR<Conversation[]>(
    '/api/conversations', 
    fetcher, 
    { refreshInterval: 10000 }
  );

  // 2. Fetch specific messages
  const { data: messages, mutate: mutateMessages } = useSWR<Message[]>(
    selectedId ? `/api/conversations/${selectedId}/messages` : null,
    fetcher,
    { 
      refreshInterval: 15000, // Reduced polling frequency because we use Realtime
      revalidateOnFocus: true,
    }
  );

  const selectedConv = conversations?.find(c => c.id === selectedId);

  // 3. Realtime Messaging & Presence
  useEffect(() => {
    if (!selectedId || !currentUserId) return;

    const channelName = `conversation:${selectedId}`;
    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: currentUserId,
        },
      },
    });

    // A. Handle Postgres Changes (New Messages & Read Receipts)
    channel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'Message',
          filter: `conversationId=eq.${selectedId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
             // Avoid duplicate optimistic messages if possible
             mutateMessages(); 
             mutateConvs();
          } else if (payload.eventType === 'UPDATE') {
             // Handle Read Receipts
             mutateMessages();
          }
        }
      )
      // B. Handle Presence (Online/Offline)
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const otherUserId = selectedConv?.professionalId === currentUserId 
           ? selectedConv.customerId 
           : selectedConv?.professionalId;
        
        const isOnline = Object.values(state).flat().some((p: any) => p.user_id === otherUserId || p.presence_ref);
        // Note: In a real scenario, we'd include user_id in the presence payload
        // For now, if there's > 1 person in the channel, someone else is online
        const presenceCount = Object.keys(state).length;
        setIsOtherOnline(presenceCount > 1);
      })
      // C. Handle Broadcast (Typing Indicators)
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.userId !== currentUserId) {
          setIsOtherTyping(true);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setIsOtherTyping(false), 3000);
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ user_id: currentUserId, online_at: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(channel);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [selectedId, currentUserId, selectedConv, mutateMessages, mutateConvs]);

  // 4. Sync Read Status when opening/new messages arrive
  useEffect(() => {
    if (!selectedId) return;
    
    const markAsRead = async () => {
      try {
        await fetch(`/api/conversations/${selectedId}/read`, { method: 'PATCH' });
        mutateMessages(); // Update UI
      } catch (err) {
        console.error("Failed to mark as read", err);
      }
    };

    markAsRead();
  }, [selectedId, messages?.length, mutateMessages]);

  // Auto-scroll on messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, selectedId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSending || !selectedId) return;

    const text = inputText;
    setInputText('');
    setIsSending(true);

    // Stop typing indicator on send
    supabase.channel(`conversation:${selectedId}`).send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId: currentUserId, isTyping: false },
    });

    // Optimistic UI Update
    const optimisticMessage: Message = {
        id: Math.random().toString(),
        content: text,
        senderId: currentUserId,
        createdAt: new Date().toISOString(),
        isRead: false,
        sender: {
            id: currentUserId,
            firstName: 'You',
            lastName: '',
        }
    };

    try {
      // Apply optimistic update immediately
      mutateMessages([...(messages || []), optimisticMessage], false);

      const res = await fetch(`/api/conversations/${selectedId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text })
      });

      if (res.ok) {
        // Trigger server-revalidation to sync everything
        mutateMessages();
        mutateConvs();
      } else {
        throw new Error("Failed to send");
      }
    } catch (err) {
      console.error(err);
      setInputText(text);
      mutateMessages(); // rollback
    } finally {
      setIsSending(false);
    }
  };

  const filteredConvs = conversations?.filter((c: Conversation) => {
    const name = (c.customerId === currentUserId 
      ? (c.professional.professionalProfile?.businessName || `${c.professional.firstName} ${c.professional.lastName}`)
      : `${c.customer.firstName} ${c.customer.lastName}`).toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="flex h-[calc(100vh-160px)] bg-white rounded-[2rem] border border-stone-200 overflow-hidden shadow-2xl">
      
      {/* Sidebar - Conversation List */}
      <div className={cn(
        "w-full md:w-[350px] lg:w-[400px] border-r border-stone-100 flex flex-col transition-all",
        selectedId && "hidden md:flex"
      )}>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-serif font-bold text-stone-900 truncate">
              {businessName || "Messages"}
            </h1>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Filter className="h-5 w-5 text-stone-400" />
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <Input 
              placeholder="Search conversations..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 bg-stone-50 border-0 rounded-2xl focus-visible:ring-1 focus-visible:ring-stone-200"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 space-y-1 custom-scrollbar">
          {!conversations ? (
             <div className="flex justify-center p-8"><Loader2 className="animate-spin text-stone-200" /></div>
          ) : filteredConvs?.length === 0 ? (
             <div className="text-center p-8 text-stone-400 text-sm font-mono uppercase">No messages found</div>
          ) : (
            filteredConvs?.map((conv: Conversation) => {
              const isOtherPro = conv.professionalId !== currentUserId;
              const otherName = isOtherPro 
                ? (conv.professional.professionalProfile?.businessName || `${conv.professional.firstName} ${conv.professional.lastName}`)
                : `${conv.customer.firstName} ${conv.customer.lastName}`;
              const otherImg = isOtherPro 
                ? (conv.professional.professionalProfile?.businessImage || conv.professional.profileImage)
                : conv.customer.profileImage;
              
              const isSelected = selectedId === conv.id;

              return (
                <button
                  key={conv.id}
                  onClick={() => setSelectedId(conv.id)}
                  className={cn(
                    "w-full flex items-center gap-4 p-4 rounded-[1.5rem] transition-all group",
                    isSelected 
                      ? "bg-stone-900 text-white shadow-lg shadow-stone-200" 
                      : "hover:bg-stone-50 text-stone-600"
                  )}
                >
                  <Avatar className="h-12 w-12 border-2 border-stone-100 group-hover:scale-105 transition-transform overflow-hidden relative">
                    {otherImg ? (
                      <NextImage src={otherImg} alt={otherName} fill className="object-cover" />
                    ) : (
                      <AvatarFallback className={isSelected ? "bg-stone-800" : "bg-stone-100"}>
                        {otherName.charAt(0)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <p className={cn("text-sm font-bold truncate", isSelected ? "text-white" : "text-stone-900")}>
                        {otherName}
                      </p>
                      <span className={cn("text-[10px] font-mono uppercase tracking-widest", isSelected ? "text-stone-400" : "text-stone-400")}>
                        {format(new Date(conv.lastMessageAt), 'MMM d')}
                      </span>
                    </div>
                    <p className={cn("text-xs truncate", isSelected ? "text-stone-300" : "text-stone-500")}>
                      {conv.messages[0]?.content || "No messages yet"}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Window */}
      <div className={cn(
        "flex-1 flex flex-col bg-white transition-all",
        !selectedId && "hidden md:flex justify-center items-center"
      )}>
        {selectedId && selectedConv ? (
          <>
            {/* Chat Header */}
            <div className="p-4 md:p-6 border-b border-stone-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button 
                   variant="ghost" size="icon" className="md:hidden rounded-full"
                   onClick={() => setSelectedId(null)}
                >
                   <ArrowLeft className="h-5 w-5" />
                </Button>
                <Avatar className="h-10 w-10 md:h-12 md:w-12 border border-stone-100 overflow-hidden">
                  {selectedConv.professionalId === currentUserId ? (
                    selectedConv.customer.profileImage ? (
                      <NextImage src={selectedConv.customer.profileImage} alt={selectedConv.customer.firstName} width={48} height={48} className="object-cover w-full h-full" />
                    ) : (
                      <AvatarFallback className="bg-stone-100 font-serif">
                        {selectedConv.customer.firstName.charAt(0)}
                      </AvatarFallback>
                    )
                  ) : (
                    (selectedConv.professional.professionalProfile?.businessImage || selectedConv.professional.profileImage) ? (
                      <NextImage src={selectedConv.professional.professionalProfile?.businessImage || selectedConv.professional.profileImage || ''} alt={selectedConv.professional.firstName} width={48} height={48} className="object-cover w-full h-full" />
                    ) : (
                      <AvatarFallback className="bg-stone-100 font-serif">
                        {selectedConv.professional.firstName.charAt(0)}
                      </AvatarFallback>
                    )
                  )}
                </Avatar>
                <div>
                  <h3 className="text-base md:text-lg font-bold text-stone-900 leading-tight">
                    {selectedConv.professionalId === currentUserId 
                      ? `${selectedConv.customer.firstName} ${selectedConv.customer.lastName}`
                      : (selectedConv.professional.professionalProfile?.businessName || `${selectedConv.professional.firstName} ${selectedConv.professional.lastName}`)}
                  </h3>
                  <div className={cn(
                    "flex items-center gap-1.5 transition-opacity duration-300",
                    isOtherOnline ? "opacity-100" : "opacity-30 grayscale"
                  )}>
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      isOtherOnline ? "bg-emerald-500 animate-pulse" : "bg-stone-400"
                    )} />
                    <span className="text-[10px] text-stone-500 uppercase tracking-[0.2em] font-mono">
                      {isOtherTyping ? "Typing..." : (isOtherOnline ? "Online" : "Offline")}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 md:gap-3">
                 <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 hover:bg-stone-50"><Phone className="h-4 w-4 text-stone-400" /></Button>
                 <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 hover:bg-stone-50"><Video className="h-4 w-4 text-stone-400" /></Button>
                 <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 hover:bg-stone-50"><MoreVertical className="h-4 w-4 text-stone-400" /></Button>
              </div>
            </div>

            {/* Messages Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 bg-[#FAFAF9]/30 custom-scrollbar"
            >
              <AnimatePresence mode="wait">
              {messages?.map((msg: Message) => {
                const isMe = msg.senderId === currentUserId;
                return (
                  <motion.div 
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex gap-3", 
                      isMe ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    {/* Avatar Bubble */}
                    <div className="h-8 w-8 rounded-full border border-stone-100 bg-stone-50 overflow-hidden shrink-0 shadow-sm self-end mb-6">
                      {isMe ? (
                         session?.user?.image ? (
                           <NextImage src={session.user.image} alt="Me" width={32} height={32} className="w-full h-full object-cover" />
                         ) : (
                           <div className="w-full h-full flex items-center justify-center bg-stone-900 text-[10px] text-white font-black uppercase">
                              {session?.user?.firstName?.[0] || 'U'}
                           </div>
                         )
                      ) : (
                         // If the sender is the other person (Professional or Customer)
                         msg.senderId === selectedConv.professionalId ? (
                            (selectedConv.professional.professionalProfile?.businessImage || selectedConv.professional.profileImage) ? (
                               <NextImage 
                                 src={selectedConv.professional.professionalProfile?.businessImage || selectedConv.professional.profileImage || ''} 
                                 alt={selectedConv.professional.firstName} 
                                 width={32} height={32} className="w-full h-full object-cover" 
                               />
                            ) : (
                               <div className="w-full h-full flex items-center justify-center bg-stone-200 text-[10px] text-stone-500 font-black uppercase">
                                  {selectedConv.professional.firstName[0]}
                               </div>
                            )
                         ) : (
                            selectedConv.customer.profileImage ? (
                               <NextImage src={selectedConv.customer.profileImage} alt={selectedConv.customer.firstName} width={32} height={32} className="w-full h-full object-cover" />
                            ) : (
                               <div className="w-full h-full flex items-center justify-center bg-stone-200 text-[10px] text-stone-500 font-black uppercase">
                                  {selectedConv.customer.firstName[0]}
                               </div>
                            )
                         )
                      )}
                    </div>
                    <div className={cn("max-w-[80%] md:max-w-[70%] group", isMe ? "items-end text-right" : "items-start text-left")}>
                      {/* Sender Name */}
                      {!isMe && (
                        <p className="text-[9px] font-mono font-black uppercase tracking-widest text-stone-400 mb-1 ml-1">
                          {msg.sender.professionalProfile?.businessName || `${msg.sender.firstName} ${msg.sender.lastName}`}
                        </p>
                      )}
                      <div className={cn(
                        "px-5 py-3 md:px-6 md:py-4 rounded-[2rem] text-sm md:text-base transition-all",
                        isMe 
                          ? "bg-stone-900 text-white shadow-xl shadow-stone-200 rounded-tr-none" 
                          : "bg-white text-stone-800 border border-stone-100 shadow-sm rounded-tl-none"
                      )}>
                        {msg.content}
                      </div>
                      <div className={cn(
                        "mt-2 flex items-center gap-2 text-[10px] uppercase font-mono tracking-widest text-stone-400",
                        isMe ? "justify-end" : "justify-start"
                      )}>
                        {format(new Date(msg.createdAt), 'HH:mm aaa')}
                        {isMe && (
                          <CheckCheck className={cn(
                            "h-3 w-3",
                            msg.isRead ? "text-emerald-500" : "text-stone-300"
                          )} />
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
              </AnimatePresence>
            </div>

            {/* Input Area */}
            <div className="p-4 md:p-8 bg-white border-t border-stone-50">
              <form 
                onSubmit={handleSendMessage}
                className="max-w-4xl mx-auto flex items-center gap-3 bg-stone-50 rounded-[2rem] p-2 md:p-3 pl-6 border border-stone-100"
              >
                <Button type="button" variant="ghost" size="icon" className="rounded-full text-stone-400 hover:text-stone-900">
                  <ImageIcon className="h-5 w-5" />
                </Button>
                <input 
                  value={inputText}
                  onChange={(e) => {
                    setInputText(e.target.value);
                    // Broadcast typing status
                    supabase.channel(`conversation:${selectedId}`).send({
                      type: 'broadcast',
                      event: 'typing',
                      payload: { userId: currentUserId, isTyping: true },
                    });
                  }}
                  placeholder="Craft your message..."
                  className="flex-1 bg-transparent border-none outline-none text-sm md:text-base text-stone-800 placeholder:text-stone-400"
                />
                <Button 
                   type="submit" 
                   disabled={!inputText.trim() || isSending}
                   className="rounded-full h-10 w-10 md:h-12 md:w-12 bg-stone-900 hover:bg-stone-800 shadow-lg shadow-stone-200"
                >
                  {isSending ? <Loader2 className="animate-spin h-4 w-4" /> : <Send className="h-4 w-4 md:h-5 md:w-5" />}
                </Button>
              </form>
              <div className="mt-4 flex items-center justify-center gap-8 text-[9px] uppercase font-mono tracking-[0.3em] text-stone-300">
                <span className="flex items-center gap-2"><ShoppingBag size={10}/> Order Inquiry</span>
                <span className="flex items-center gap-2"><Zap size={10}/> Instant Reply</span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-6 text-center p-12">
            <div className="w-24 h-24 bg-stone-50 rounded-full flex items-center justify-center">
              <MessageSquare className="h-10 w-10 text-stone-200" />
            </div>
            <div>
              <h3 className="text-2xl font-serif font-bold text-stone-900">Your Concierge Inbox</h3>
              <p className="text-stone-400 max-w-sm mt-2 font-serif italic text-lg text-balance">
                Select a conversation to start chatting with your favorite ateliers and stylists.
              </p>
            </div>
            <Button variant="outline" className="rounded-full px-8 py-6 border-stone-200 font-mono text-xs uppercase tracking-widest text-stone-600 hover:bg-stone-50">
               Browse Professionals
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
