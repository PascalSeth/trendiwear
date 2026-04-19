'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, 
  Store, 
  Wallet, 
  Clock, 
  Sparkles, 
  Tag, 
  Truck, 
  ShieldCheck, 
  MessageSquare,
  Scissors,
  CheckCircle2,
  AlertCircle,
  X,
  CreditCard
} from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const SELLER_FAQS = [
  {
    id: 'what-is',
    question: 'What is Trendizip?',
    answer: 'Trendizip is a specialized e-commerce ecosystem designed for fashion designers and retailers. Unlike standard marketplaces, Trendizip provides you with a dedicated storefront link. This unique URL displays only your products and services, acting as your personal professional website.',
    icon: <Store className="w-5 h-5 text-violet-500" />
  },
  {
    id: 'momo-payments',
    question: 'Do I need a bank account to receive payments?',
    answer: 'No. We have integrated Mobile Money (MoMo) for your convenience. You only need a registered MoMo number to receive your funds directly.',
    icon: <Wallet className="w-5 h-5 text-emerald-500" />
  },
  {
    id: 'payout-time',
    question: 'How long does it take for money to hit my MoMo account?',
    answer: 'To ensure transaction security and manage the refund window, funds are processed and transferred to your account within 24 to 48 hours after a sale.',
    icon: <Clock className="w-5 h-5 text-amber-500" />
  },
  {
    id: 'trial-period',
    question: 'Is there a trial period for new users?',
    answer: 'Yes. Every new user is eligible for a 3-month Trial Business Account. You will have access to every premium feature for free for the first 90 days before you need to consider a subscription.',
    icon: <Sparkles className="w-5 h-5 text-indigo-500" />
  },
  {
    id: 'subscription-cost',
    question: 'What is the subscription cost after the trial?',
    answer: 'Our plans are designed to be affordable for the average fashion entrepreneur. We offer flexible weekly, monthly, and yearly options that are priced to suit your business scale.',
    icon: <CreditCard className="w-5 h-5 text-slate-500" />
  },
  {
    id: 'taxes-deductions',
    question: 'Are there taxes or deductions on my sales?',
    answer: 'No. There are zero platform deductions or hidden taxes on your purchases. You receive 100% of your listed sale price.',
    icon: <Tag className="w-5 h-5 text-rose-500" />
  },
  {
    id: 'deliveries',
    question: 'How do I handle deliveries?',
    answer: 'The platform includes a Rider Management System. While we do not provide riders directly, you can input your personal rider’s information or add tracking IDs from external delivery services (like Yango or Bolt) so your customers can track their orders.',
    icon: <Truck className="w-5 h-5 text-blue-500" />
  },
  {
    id: 'services-selling',
    question: 'Can I sell services like "Custom Tailoring"?',
    answer: 'Absolutely. Trendizip is built for both product retailers and service providers. You can list fashion design, tailoring, or consulting services just as easily as physical clothing.',
    icon: <Scissors className="w-5 h-5 text-fuchsia-500" />
  },
  {
    id: 'upload-limits',
    question: 'How many products or services can I upload?',
    answer: 'For the time being, uploads are unlimited. You can list as many products and services as you like to fill your storefront.',
    icon: <CheckCircle2 className="w-5 h-5 text-cyan-500" />
  },
  {
    id: 'refund-policy',
    question: 'What happens if a customer wants a refund?',
    answer: 'We use a fair compensation model: \n• Within 12 hours: Customers can request a full refund. \n• After 12 hours: If the item is already packaged or a rider is involved, the customer receives 80% back, and you keep 20% as compensation for your time and materials.',
    icon: <AlertCircle className="w-5 h-5 text-orange-500" />
  },
  {
    id: 'customization',
    question: 'Can I customize the look of my storefront?',
    answer: 'Customization features are currently in development and will be released in a future update. For now, the focus is on a clean, high-performance layout that highlights your products.',
    icon: <Sparkles className="w-5 h-5 text-pink-500" />
  },
  {
    id: 'security',
    question: 'Is my account secure?',
    answer: 'Security is our priority. Please note that no one from Trendizip will ever ask for your password. Keep your login details private at all times.',
    icon: <ShieldCheck className="w-5 h-5 text-emerald-600" />
  }
]

const CUSTOMER_FAQS = [
  {
    id: 'c-how-to-buy',
    question: 'How do I buy from a designer?',
    answer: 'Simply visit the designer\'s dedicated storefront link, browse their products, and add items to your cart. You can complete your purchase using secure Mobile Money (MoMo) options.',
    icon: <Store className="w-5 h-5 text-violet-500" />
  },
  {
    id: 'c-refunds',
    question: 'What is the refund policy?',
    answer: 'You can request a full refund within 12 hours of purchase. After 12 hours, if the designer has already started processing your order, a 20% cancellation fee applies as compensation for their materials and time.',
    icon: <AlertCircle className="w-5 h-5 text-amber-500" />
  },
  {
    id: 'c-tracking',
    question: 'How can I track my order?',
    answer: 'Once your order is dispatched, your designer will provide a tracking ID or rider information. You can track this directly through your Trendizip account dashboard.',
    icon: <Truck className="w-5 h-5 text-blue-500" />
  }
]

export default function FAQPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('sellers')

  const filterFAQs = (faqs: typeof SELLER_FAQS) => {
    return faqs.filter(faq => 
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  const currentSellers = filterFAQs(SELLER_FAQS)
  const currentCustomers = filterFAQs(CUSTOMER_FAQS)

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-slate-950 py-24 px-6 text-white">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-violet-600/30 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-indigo-600/20 rounded-full blur-[100px]"></div>
        
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="outline" className="mb-6 border-violet-500/50 text-violet-400 uppercase tracking-[0.2em] px-4 py-1 text-[10px] font-black">
              Help Center
            </Badge>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-6 uppercase italic">
              Frequently Asked <span className="text-violet-500">Questions</span>
            </h1>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto font-medium">
              Everything you need to know about growing your fashion empire on Trendizip.
            </p>
          </motion.div>

          {/* Search Box */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-12 max-w-xl mx-auto"
          >
            <div className="relative group">
              <div className="absolute inset-0 bg-violet-500/20 blur-xl group-focus-within:bg-violet-500/40 transition-colors rounded-3xl"></div>
              <div className="relative flex items-center bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-2 pr-4 shadow-2xl">
                <Search className="ml-4 h-5 w-5 text-slate-400" />
                <Input 
                  placeholder="Search questions (e.g., 'MoMo', 'Trial', 'Refunds')..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-transparent border-none text-white placeholder:text-slate-500 focus-visible:ring-0 h-14"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                    <X className="h-4 w-4 text-slate-400" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="max-w-4xl mx-auto px-6 -mt-10 pb-24">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-center mb-12">
            <TabsList className="bg-white/80 backdrop-blur-md border border-slate-200 shadow-xl h-14 p-0 rounded-full grid grid-cols-2 w-full max-w-md overflow-hidden">
              <TabsTrigger 
                value="sellers" 
                className="text-xs font-black uppercase tracking-widest data-[state=active]:bg-slate-950 data-[state=active]:text-white transition-all duration-300 h-full rounded-none"
              >
                For Sellers
              </TabsTrigger>
              <TabsTrigger 
                value="customers" 
                className="text-xs font-black uppercase tracking-widest data-[state=active]:bg-slate-950 data-[state=active]:text-white transition-all duration-300 h-full rounded-none"
              >
                For Customers
              </TabsTrigger>
            </TabsList>
          </div>



          <AnimatePresence mode="wait">
            <TabsContent key="sellers" value="sellers" className="mt-0">
              {currentSellers.length > 0 ? (
                <div className="space-y-4">
                  {currentSellers.map((faq, index) => (
                    <motion.div
                      key={faq.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value={faq.id} className="border-none bg-white rounded-[2rem] shadow-sm hover:shadow-md transition-all duration-300 mb-4 px-6 overflow-hidden">
                          <AccordionTrigger className="hover:no-underline py-6">
                            <div className="flex items-center gap-4 text-left">
                              <div className="p-3 bg-slate-50 rounded-2xl group-hover:scale-110 transition-transform">
                                {faq.icon}
                              </div>
                              <span className="font-black text-sm uppercase tracking-tight text-slate-900 group-hover:text-violet-600 transition-colors">
                                {faq.question}
                              </span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pb-8 pl-14 pr-4">
                            <div className="text-slate-600 text-[14px] leading-relaxed font-medium whitespace-pre-line">
                              {faq.answer}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <EmptyState />
              )}
            </TabsContent>

            <TabsContent key="customers" value="customers" className="mt-0">
              {currentCustomers.length > 0 ? (
                <div className="space-y-4">
                  {currentCustomers.map((faq, index) => (
                    <motion.div
                      key={faq.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value={faq.id} className="border-none bg-white rounded-[2rem] shadow-sm hover:shadow-md transition-all duration-300 mb-4 px-6 overflow-hidden">
                          <AccordionTrigger className="hover:no-underline py-6">
                            <div className="flex items-center gap-4 text-left">
                              <div className="p-3 bg-slate-50 rounded-2xl group-hover:scale-110 transition-transform">
                                {faq.icon}
                              </div>
                              <span className="font-black text-sm uppercase tracking-tight text-slate-900 group-hover:text-violet-600 transition-colors">
                                {faq.question}
                              </span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="pb-8 pl-14 pr-4">
                            <div className="text-slate-600 text-[14px] leading-relaxed font-medium">
                              {faq.answer}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <EmptyState />
              )}
            </TabsContent>
          </AnimatePresence>
        </Tabs>

        {/* Support Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-24 bg-slate-950 rounded-[3rem] p-12 text-center relative overflow-hidden shadow-2xl"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/20 rounded-full blur-[80px]"></div>
          
          <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-4">
            Still need <span className="text-violet-500">Help?</span>
          </h2>
          <p className="text-slate-400 mb-10 max-w-md mx-auto font-medium">
            Join our vibrant community on WhatsApp or reach out to our dedicated support team directly.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button 
              size="lg" 
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-10 h-16 uppercase text-[11px] font-black tracking-widest shadow-xl shadow-emerald-950/40 w-full sm:w-auto"
              asChild
            >
              <a href="https://chat.whatsapp.com/KdjzT2lEk8PH0PlwOu5utn?mode=gi_t" target="_blank" rel="noopener noreferrer">
                <MessageSquare className="mr-2 h-5 w-5" /> WhatsApp Community
              </a>
            </Button>

            <Button 
              size="lg" 
              variant="outline"
              className="border-white/20 text-white hover:bg-white/5 rounded-full px-10 h-16 uppercase text-[11px] font-black tracking-widest w-full sm:w-auto"
            >
              Contact Support
            </Button>
          </div>

          <div className="mt-12 pt-12 border-t border-white/5 flex flex-col items-center gap-4">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">
              Start your 3-month free trial today
            </p>
            <a 
              href="https://trendizip.com" 
              className="text-violet-500 hover:text-violet-400 font-bold transition-colors"
            >
              Trendizip.com
            </a>
          </div>
        </motion.div>
      </section>

      {/* JSON-LD Schema for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              ...SELLER_FAQS.map(faq => ({
                "@type": "Question",
                "name": faq.question,
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": faq.answer
                }
              })),
              ...CUSTOMER_FAQS.map(faq => ({
                "@type": "Question",
                "name": faq.question,
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": faq.answer
                }
              }))
            ]
          })
        }}
      />
    </div>
  )
}

function EmptyState() {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <div className="p-6 bg-slate-100 rounded-full mb-4">
        <X className="h-8 w-8 text-slate-400" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-2">No matching questions</h3>
      <p className="text-slate-500">Try adjusting your search terms or switch tabs.</p>
    </motion.div>
  )
}
