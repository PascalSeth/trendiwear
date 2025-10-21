'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { HelpCircle, Search, MessageCircle, Phone, Mail } from 'lucide-react'

interface FAQ {
  id: string
  question: string
  answer: string
  category: string
}

export default function HelpPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  const fetchFAQs = async () => {
    // For now, using static data. In a real app, this would fetch from an API
    const mockFAQs: FAQ[] = [
      {
        id: '1',
        question: 'How do I place an order?',
        answer: 'To place an order, browse our products, add items to your cart, and proceed to checkout. You can pay using various payment methods including credit cards and mobile money.',
        category: 'Orders'
      },
      {
        id: '2',
        question: 'How do I track my order?',
        answer: 'You can track your order status in the "My Orders" section of your account. We will also send you email updates as your order progresses.',
        category: 'Orders'
      },
      {
        id: '3',
        question: 'What is your return policy?',
        answer: 'We offer a 30-day return policy for most items. Items must be in their original condition and packaging. Contact our support team to initiate a return.',
        category: 'Returns'
      },
      {
        id: '4',
        question: 'How do I become a professional?',
        answer: 'Click on "Become a Professional" in your account dropdown. Fill out the registration form with your details and expertise. Our team will review your application.',
        category: 'Professionals'
      },
      {
        id: '5',
        question: 'How do I update my measurements?',
        answer: 'Go to your account settings and click on "Measurements". You can update your body measurements, size preferences, and style preferences there.',
        category: 'Account'
      },
      {
        id: '6',
        question: 'How do I contact customer support?',
        answer: 'You can contact us through the contact form below, by email at support@trendizip.com, or by phone at +254 700 000 000.',
        category: 'Support'
      }
    ]

    setFaqs(mockFAQs)
    setLoading(false)
  }

  useEffect(() => {
    fetchFAQs()
  }, [])

  const filteredFAQs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const categories = [...new Set(faqs.map(faq => faq.category))]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Help & Support</h1>
          <p className="text-gray-600">Find answers to common questions and get help</p>
        </div>

        {/* Search */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search for help..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* FAQ Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {categories.map((category) => (
            <Card key={category} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="flex items-center p-6">
                <HelpCircle className="w-8 h-8 text-blue-500 mr-4" />
                <div>
                  <h3 className="font-semibold text-gray-900">{category}</h3>
                  <p className="text-sm text-gray-600">
                    {faqs.filter(faq => faq.category === category).length} articles
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQs */}
        <Card>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {filteredFAQs.map((faq) => (
                <AccordionItem key={faq.id} value={faq.id}>
                  <AccordionTrigger className="text-left">
                    <div>
                      <span className="font-medium">{faq.question}</span>
                      <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {faq.category}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-gray-700 leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* Contact Support */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Contact Support</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center space-x-3">
                <MessageCircle className="w-6 h-6 text-blue-500" />
                <div>
                  <h4 className="font-medium">Live Chat</h4>
                  <p className="text-sm text-gray-600">Chat with our support team</p>
                  <Button variant="outline" size="sm" className="mt-2">
                    Start Chat
                  </Button>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Mail className="w-6 h-6 text-green-500" />
                <div>
                  <h4 className="font-medium">Email</h4>
                  <p className="text-sm text-gray-600">support@trendizip.com</p>
                  <Button variant="outline" size="sm" className="mt-2">
                    Send Email
                  </Button>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Phone className="w-6 h-6 text-purple-500" />
                <div>
                  <h4 className="font-medium">Phone</h4>
                  <p className="text-sm text-gray-600">+254 700 000 000</p>
                  <Button variant="outline" size="sm" className="mt-2">
                    Call Now
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Resources */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Additional Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-2">Getting Started</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• <a href="#" className="hover:text-blue-600">How to create an account</a></li>
                  <li>• <a href="#" className="hover:text-blue-600">Shopping guide</a></li>
                  <li>• <a href="#" className="hover:text-blue-600">Payment methods</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Account & Settings</h4>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• <a href="#" className="hover:text-blue-600">Managing your profile</a></li>
                  <li>• <a href="#" className="hover:text-blue-600">Privacy settings</a></li>
                  <li>• <a href="#" className="hover:text-blue-600">Notification preferences</a></li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
