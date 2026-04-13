'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, MessageSquare, Send, 
  MoreVertical, Phone, Video,
  CheckCheck, Loader2, Filter,
  ArrowLeft, ShoppingBag, Clock, Image as ImageIcon
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import useSWR from 'swr';
import { motion, AnimatePresence } from 'framer-motion';
import NextImage from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

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
};

export function InboxClient({ currentUserId }: { currentUserId: string, businessName?: string }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();

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
      refreshInterval: 5000,
      revalidateOnFocus: false,
    }
  );

  const selectedConv = conversations?.find(c => c.id === selectedId);

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

    // Optimistic UI Update
    const optimisticMessage: Message = {
        id: Math.random().toString(),
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
      mutateMessages([...(messages || []), optimisticMessage], false);

      const res = await fetch(`/api/conversations/${selectedId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text })
      });

      if (res.ok) {
        mutateMessages();
        mutateConvs();
      } else {
        throw new Error("Failed to send");
      }
    } catch {
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
    <div className="flex h-[calc(100vh-140px)] min-h-[750px] bg-white/40 backdrop-blur-xl rounded-[3rem] border border-stone-200/50 overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] relative">
      
      {/* Sidebar - Chat List */}
      <div className={cn(
        "w-full md:w-[380px] lg:w-[450px] border-r border-stone-100/50 flex flex-col transition-all bg-white/60",
        selectedId && "hidden md:flex"
      )}>
        <div className="p-8 space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-serif font-medium text-stone-900 truncate">
               My Chats
            </h2>
            <div className="flex gap-2">
               <Button variant="ghost" size="icon" className="rounded-full bg-stone-50/50 hover:bg-stone-100 transition-colors">
                 <Filter className="h-4 w-4 text-stone-400" />
               </Button>
            </div>
          </div>
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-300 group-focus-within:text-stone-900 transition-colors" />
            <Input 
              placeholder="Search by name..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-14 bg-stone-50 border-0 rounded-2xl focus-visible:ring-1 focus-visible:ring-stone-200 placeholder:text-stone-300 transition-all font-serif italic text-base shadow-inner"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-2 custom-scrollbar">
          {!conversations ? (
             <div className="flex justify-center p-12"><Loader2 className="animate-spin text-stone-200" /></div>
          ) : filteredConvs?.length === 0 ? (
             <div className="text-center py-20 px-8">
                <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-stone-100">
                   <Search className="text-stone-200" size={24} />
                </div>
                <p className="text-stone-400 text-sm font-serif italic">No chats found with that name.</p>
             </div>
          ) : (
            filteredConvs?.map((conv: Conversation, idx: number) => {
              const isOtherPro = conv.professionalId !== currentUserId;
              const otherName = isOtherPro 
                ? (conv.professional.professionalProfile?.businessName || `${conv.professional.firstName} ${conv.professional.lastName}`)
                : `${conv.customer.firstName} ${conv.customer.lastName}`;
              const otherImg = isOtherPro 
                ? (conv.professional.professionalProfile?.businessImage || conv.professional.profileImage)
                : conv.customer.profileImage;
              
              const isSelected = selectedId === conv.id;

              return (
                <motion.button
                  key={conv.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => setSelectedId(conv.id)}
                  className={cn(
                    "w-full flex items-center gap-5 p-5 rounded-[2.5rem] transition-all group relative",
                    isSelected 
                      ? "bg-stone-900 text-white shadow-2xl shadow-stone-900/20 translate-x-2" 
                      : "hover:bg-white hover:shadow-xl hover:shadow-stone-200/50 text-stone-600"
                  )}
                >
                  <Avatar className="h-14 w-14 border-2 border-stone-100 group-hover:scale-110 transition-transform duration-500 overflow-hidden relative shadow-md">
                    {otherImg ? (
                      <NextImage src={otherImg} alt={otherName} fill className="object-cover" />
                    ) : (
                      <AvatarFallback className={isSelected ? "bg-stone-800 text-stone-400" : "bg-stone-100 text-stone-300"}>
                        {otherName.charAt(0)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1 text-left min-w-0 py-1">
                    <div className="flex justify-between items-center mb-1">
                      <p className={cn("text-base font-bold truncate tracking-tight", isSelected ? "text-white" : "text-stone-900")}>
                        {otherName}
                      </p>
                      <span className={cn("text-[10px] font-mono font-black uppercase tracking-widest opacity-40", isSelected ? "text-white" : "text-stone-400")}>
                        {format(new Date(conv.lastMessageAt), 'MMM d')}
                      </span>
                    </div>
                    <p className={cn("text-xs truncate font-serif italic", isSelected ? "text-stone-400" : "text-stone-500")}>
                      {conv.messages[0]?.content || "No messages yet"}
                    </p>
                  </div>
                  {isSelected && (
                     <motion.div 
                        layoutId="active-pill"
                        className="absolute left-[-8px] top-[20%] bottom-[20%] w-1.5 bg-amber-500 rounded-full" 
                     />
                  )}
                </motion.button>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={cn(
        "flex-1 flex flex-col transition-all bg-white relative",
        !selectedId && "hidden md:flex justify-center items-center"
      )}>
        {selectedId && selectedConv ? (
          <>
            {/* Chat Header */}
            <div className="p-6 md:p-8 border-b border-stone-100/50 flex items-center justify-between bg-white/70 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-5">
                <Button 
                   variant="ghost" size="icon" className="md:hidden rounded-full bg-stone-50"
                   onClick={() => setSelectedId(null)}
                >
                   <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="relative group">
                   <div className="absolute inset-0 bg-amber-200/50 rounded-full blur-xl group-hover:blur-2xl transition-all opacity-0 group-hover:opacity-40" />
                   <Avatar className="h-12 w-12 md:h-16 md:w-16 border-2 border-white overflow-hidden shadow-xl relative z-10 transition-transform duration-700 group-hover:scale-105">
                     {selectedConv.professionalId === currentUserId ? (
                       selectedConv.customer.profileImage ? (
                         <NextImage src={selectedConv.customer.profileImage} alt={selectedConv.customer.firstName} width={64} height={64} className="object-cover w-full h-full" />
                       ) : (
                         <AvatarFallback className="bg-stone-50 font-serif text-xl border border-stone-100">
                           {selectedConv.customer.firstName.charAt(0)}
                         </AvatarFallback>
                       )
                     ) : (
                       (selectedConv.professional.professionalProfile?.businessImage || selectedConv.professional.profileImage) ? (
                         <NextImage src={selectedConv.professional.professionalProfile?.businessImage || selectedConv.professional.profileImage || ''} alt={selectedConv.professional.firstName} width={64} height={64} className="object-cover w-full h-full" />
                       ) : (
                         <AvatarFallback className="bg-stone-50 font-serif text-xl border border-stone-100">
                           {selectedConv.professional.firstName.charAt(0)}
                         </AvatarFallback>
                       )
                     )}
                   </Avatar>
                </div>
                <div>
                   <h3 className="text-xl md:text-2xl font-serif font-medium text-stone-900 leading-none mb-2">
                     {selectedConv.professionalId === currentUserId 
                       ? `${selectedConv.customer.firstName} ${selectedConv.customer.lastName}`
                       : (selectedConv.professional.professionalProfile?.businessName || `${selectedConv.professional.firstName} ${selectedConv.professional.lastName}`)}
                   </h3>
                   <div className="flex items-center gap-2">
                     <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                     <span className="text-[10px] text-stone-400 uppercase tracking-widest font-mono font-black">Active Now</span>
                   </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                 <Button variant="ghost" size="icon" className="rounded-full h-12 w-12 bg-stone-50/50 text-stone-400 hover:text-stone-900 transition-all"><Phone className="h-4 w-4" /></Button>
                 <Button variant="ghost" size="icon" className="rounded-full h-12 w-12 bg-stone-50/50 text-stone-400 hover:text-stone-900 transition-all"><Video className="h-4 w-4" /></Button>
                 <Button variant="ghost" size="icon" className="rounded-full h-12 w-12 bg-stone-50/50 text-stone-400 hover:text-stone-900 transition-all"><MoreVertical className="h-4 w-4" /></Button>
              </div>
            </div>

            {/* Messages - Beautiful Bubbles */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-8 md:p-12 space-y-10 bg-[#FAFAF9]/40 custom-scrollbar"
            >
              <AnimatePresence mode="popLayout">
              {messages?.map((msg: Message) => {
                const isMe = msg.senderId === currentUserId;
                return (
                  <motion.div 
                    key={msg.id}
                    layout
                    initial={{ opacity: 0, y: 30, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: "spring", damping: 20, stiffness: 100 }}
                    className={cn(
                      "flex gap-4", 
                      isMe ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    <div className="h-10 w-10 rounded-2xl border border-stone-200 bg-white overflow-hidden shrink-0 shadow-lg self-end mb-8 relative">
                      {isMe ? (
                         session?.user?.image ? (
                           <NextImage src={session.user.image} alt="Me" fill className="object-cover" />
                         ) : (
                           <div className="w-full h-full flex items-center justify-center bg-stone-950 text-xs text-white font-black uppercase">
                              {session?.user?.firstName?.[0] || 'U'}
                           </div>
                         )
                      ) : (
                         msg.senderId === selectedConv.professionalId ? (
                            (selectedConv.professional.professionalProfile?.businessImage || selectedConv.professional.profileImage) ? (
                               <NextImage 
                                 src={selectedConv.professional.professionalProfile?.businessImage || selectedConv.professional.profileImage || ''} 
                                 alt={selectedConv.professional.firstName} 
                                 fill className="object-cover" 
                               />
                            ) : (
                               <div className="w-full h-full flex items-center justify-center bg-stone-100 text-xs text-stone-400 font-serif">
                                  {selectedConv.professional.firstName[0]}
                               </div>
                            )
                         ) : (
                            selectedConv.customer.profileImage ? (
                               <NextImage src={selectedConv.customer.profileImage} alt={selectedConv.customer.firstName} fill className="object-cover" />
                            ) : (
                               <div className="w-full h-full flex items-center justify-center bg-stone-100 text-xs text-stone-400 font-serif">
                                  {selectedConv.customer.firstName[0]}
                               </div>
                            )
                         )
                      )}
                    </div>
                    <div className={cn("max-w-[85%] md:max-w-[65%] flex flex-col", isMe ? "items-end text-right" : "items-start text-left")}>
                      {!isMe && (
                        <p className="text-[10px] font-mono font-black uppercase tracking-widest text-stone-400 mb-2 ml-2 transition-opacity opacity-60">
                          {msg.sender.professionalProfile?.businessName || `${msg.sender.firstName} ${msg.sender.lastName}`}
                        </p>
                      )}
                      <div className={cn(
                        "px-6 py-4 md:px-8 md:py-5 rounded-[2.5rem] text-[15px] md:text-lg leading-relaxed shadow-xl",
                        isMe 
                          ? "bg-stone-950 text-white shadow-stone-900/10 rounded-tr-none" 
                          : "bg-white text-stone-800 border border-stone-100 shadow-stone-200/50 rounded-tl-none font-serif italic"
                      )}>
                        {msg.content}
                      </div>
                      <div className={cn(
                        "mt-3 flex items-center gap-3 text-[10px] font-mono tracking-[0.2em] text-stone-300 font-bold uppercase",
                        isMe ? "justify-end" : "justify-start"
                      )}>
                        {format(new Date(msg.createdAt), 'h:mm a')}
                        {isMe && <CheckCheck className="h-3.5 w-3.5 text-amber-500" />}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
              </AnimatePresence>
            </div>

            {/* Input - Elevated Floating Style */}
            <div className="p-6 md:p-10 bg-white border-t border-stone-100/50 relative overflow-hidden">
              <div className="absolute inset-0 bg-stone-50/30 -z-10" />
              <form 
                onSubmit={handleSendMessage}
                className="max-w-4xl mx-auto flex items-center gap-4 bg-white rounded-[3rem] p-3 pl-8 shadow-[0_12px_24px_-8px_rgba(0,0,0,0.08)] border border-stone-100 hover:border-stone-200 transition-all focus-within:shadow-2xl focus-within:shadow-stone-200/50"
              >
                <Button type="button" variant="ghost" size="icon" className="rounded-full text-stone-300 hover:text-stone-900 transition-colors">
                  <ImageIcon className="h-5 w-5" />
                </Button>
                <input 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type your message here..."
                  className="flex-1 bg-transparent border-none outline-none text-base md:text-lg text-stone-800 placeholder:text-stone-300 font-serif italic"
                />
                <Button 
                   type="submit" 
                   disabled={!inputText.trim() || isSending}
                   className="rounded-full h-12 w-12 md:h-14 md:w-14 bg-stone-950 hover:bg-black shadow-xl shadow-stone-900/20 active:scale-95 transition-all flex items-center justify-center shrink-0"
                >
                  {isSending ? <Loader2 className="animate-spin h-5 w-5" /> : <Send className="h-5 w-5 md:h-6 md:w-6" />}
                </Button>
              </form>
              <div className="mt-6 flex items-center justify-center gap-10 text-[10px] uppercase font-mono tracking-[0.4em] text-stone-300 font-bold">
                <span className="flex items-center gap-2 group cursor-default"><ShoppingBag size={12} className="group-hover:text-amber-500 transition-colors"/> Order Help</span>
                <span className="flex items-center gap-2 group cursor-default"><Clock size={12} className="group-hover:text-amber-500 transition-colors"/> Fast Reply</span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-8 text-center p-12 relative overflow-hidden h-full">
            {/* Ambient Background Circles */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-stone-50 rounded-full blur-[100px] -z-10" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-50/50 rounded-full blur-[100px] -z-10" />

            <div className="w-32 h-32 bg-white rounded-[2.5rem] shadow-2xl flex items-center justify-center border border-stone-100 group animate-float">
              <MessageSquare className="h-12 w-12 text-stone-200 group-hover:text-amber-500 transition-colors duration-700" />
            </div>
            <div className="space-y-4 max-w-sm">
              <h3 className="text-3xl font-serif font-medium text-stone-900 tracking-tight">Your Inbox</h3>
              <p className="text-stone-500 font-serif italic text-xl leading-relaxed opacity-60">
                 Pick a conversation from the left to start chatting with artisans and sellers.
              </p>
            </div>
            <Link href="/shopping">
              <Button variant="outline" className="rounded-full px-10 py-7 border-stone-200 font-mono text-xs uppercase tracking-widest text-stone-600 hover:bg-stone-900 hover:text-white transition-all shadow-lg hover:shadow-2xl">
                 Start Shopping
              </Button>
            </Link>
          </div>
        )}
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E5E5E5; border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #D4D4D4; }
        
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
