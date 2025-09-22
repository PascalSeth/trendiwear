'use client'

import React, { useState, useEffect } from 'react'
import { ChevronRight, ChevronLeft, CheckCircle, User, ShoppingBag, Send, Eye, EyeOff } from 'lucide-react'

type SurveyType = 'BUYER' | 'SELLER'
type QuestionType = 'TEXT' | 'TEXTAREA' | 'MULTIPLE_CHOICE' | 'CHECKBOX' | 'RATING' | 'YES_NO'

interface SurveyQuestion {
  id: string
  section: string
  question: string
  questionType: QuestionType
  options?: string[]
  isRequired: boolean
  order: number
}

interface SurveyAnswer {
  questionId: string
  answerText?: string
  selectedOptions?: string[]
}

const SurveyPage = () => {
  const [currentStep, setCurrentStep] = useState(0)
  const [surveyType, setSurveyType] = useState<SurveyType | null>(null)
  const [questions, setQuestions] = useState<SurveyQuestion[]>([])
  const [answers, setAnswers] = useState<Record<string, SurveyAnswer>>({})
  const [isAnonymous, setIsAnonymous] = useState(true)
  const [respondentEmail, setRespondentEmail] = useState('')
  const [respondentName, setRespondentName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  // Load questions when survey type is selected
  useEffect(() => {
    if (surveyType) {
      loadQuestions()
    }
  }, [surveyType]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadQuestions = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/survey/questions?surveyType=${surveyType}`)
      const data = await response.json()
      setQuestions(data.questions)
    } catch (error) {
      console.error('Error loading questions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerChange = (questionId: string, value: string | string[], type: QuestionType) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: {
        questionId,
        answerText: type === 'TEXT' || type === 'TEXTAREA' ? value as string : undefined,
        selectedOptions: type === 'CHECKBOX' || type === 'MULTIPLE_CHOICE' ? value as string[] : undefined
      }
    }))
  }

  const handleCheckboxChange = (questionId: string, option: string, checked: boolean) => {
    setAnswers(prev => {
      const current = prev[questionId] || { questionId, selectedOptions: [] }
      const selectedOptions = current.selectedOptions || []

      if (checked) {
        return {
          ...prev,
          [questionId]: {
            ...current,
            selectedOptions: [...selectedOptions, option]
          }
        }
      } else {
        return {
          ...prev,
          [questionId]: {
            ...current,
            selectedOptions: selectedOptions.filter(opt => opt !== option)
          }
        }
      }
    })
  }

  const isCurrentStepValid = () => {
    if (!questions[currentStep]) return false

    const question = questions[currentStep]
    const answer = answers[question.id]

    if (!question.isRequired) return true

    if (question.questionType === 'TEXT' || question.questionType === 'TEXTAREA') {
      return (answer?.answerText?.trim().length ?? 0) > 0
    }

    if (question.questionType === 'CHECKBOX' || question.questionType === 'MULTIPLE_CHOICE') {
      return (answer?.selectedOptions?.length ?? 0) > 0
    }

    return true
  }

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const submission = {
        surveyType,
        respondentEmail: isAnonymous ? undefined : respondentEmail,
        respondentName: isAnonymous ? undefined : respondentName,
        isAnonymous,
        answers: Object.values(answers)
      }

      const response = await fetch('/api/survey', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submission),
      })

      if (response.ok) {
        setIsSubmitted(true)
      } else {
        throw new Error('Submission failed')
      }
    } catch (error) {
      console.error('Error submitting survey:', error)
      alert('Failed to submit survey. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderQuestion = (question: SurveyQuestion) => {
    const answer = answers[question.id]

    switch (question.questionType) {
      case 'TEXT':
        return (
          <input
            type="text"
            value={answer?.answerText || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value, question.questionType)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Your answer..."
          />
        )

      case 'TEXTAREA':
        return (
          <textarea
            value={answer?.answerText || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value, question.questionType)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32 resize-none"
            placeholder="Your detailed answer..."
          />
        )

      case 'MULTIPLE_CHOICE':
        return (
          <div className="space-y-2">
            {question.options?.map((option) => (
              <label key={option} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name={question.id}
                  value={option}
                  checked={answer?.selectedOptions?.includes(option) || false}
                  onChange={(e) => handleAnswerChange(question.id, [e.target.value], question.questionType)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        )

      case 'CHECKBOX':
        return (
          <div className="space-y-2">
            {question.options?.map((option) => (
              <label key={option} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={answer?.selectedOptions?.includes(option) || false}
                  onChange={(e) => handleCheckboxChange(question.id, option, e.target.checked)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        )

      default:
        return null
    }
  }

  // Survey type selection
  if (!surveyType) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Fashion Industry Survey
            </h1>
            <p className="text-lg text-gray-600">
              Help us understand your experiences with fashion shopping and selling
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div
              onClick={() => setSurveyType('BUYER')}
              className="p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-blue-500 group"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-500 transition-colors">
                  <ShoppingBag className="w-8 h-8 text-blue-600 group-hover:text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">I&apos;m a Fashion Shopper</h3>
                <p className="text-gray-600">
                  Share your experiences with buying fashion online and in stores
                </p>
              </div>
            </div>

            <div
              onClick={() => setSurveyType('SELLER')}
              className="p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-purple-500 group"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-500 transition-colors">
                  <User className="w-8 h-8 text-purple-600 group-hover:text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">I&apos;m a Fashion Seller</h3>
                <p className="text-gray-600">
                  Tell us about your experiences selling fashion products or services
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading survey questions...</p>
        </div>
      </div>
    )
  }

  // Success state
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Thank You!
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Your feedback has been submitted successfully. Your insights will help us improve the fashion industry.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Take Another Survey
          </button>
        </div>
      </div>
    )
  }

  const currentQuestion = questions[currentStep]
  const progress = ((currentStep + 1) / questions.length) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {surveyType === 'BUYER' ? 'Fashion Shopper Survey' : 'Fashion Seller Survey'}
              </h1>
              <p className="text-sm text-gray-600">
                Question {currentStep + 1} of {questions.length}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">
                {Math.round(progress)}% Complete
              </div>
              <div className="w-32 h-2 bg-gray-200 rounded-full mt-1">
                <div
                  className="h-2 bg-blue-600 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Survey Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {currentQuestion && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="mb-6">
              <div className="text-sm font-medium text-blue-600 mb-2 uppercase tracking-wide">
                {currentQuestion.section}
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                {currentQuestion.question}
              </h2>
              {currentQuestion.isRequired && (
                <span className="text-sm text-red-600 font-medium">* Required</span>
              )}
            </div>

            <div className="mb-8">
              {renderQuestion(currentQuestion)}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="flex items-center px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </button>

              {currentStep === questions.length - 1 ? (
                <button
                  onClick={handleSubmit}
                  disabled={!isCurrentStepValid() || isSubmitting}
                  className="flex items-center px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit Survey
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  disabled={!isCurrentStepValid()}
                  className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Privacy Notice */}
        <div className="mt-8 bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              {isAnonymous ? (
                <EyeOff className="w-5 h-5 text-gray-400" />
              ) : (
                <Eye className="w-5 h-5 text-blue-600" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-900 mb-2">
                Privacy Settings
              </h3>
              <div className="flex items-center space-x-4 mb-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={isAnonymous}
                    onChange={() => setIsAnonymous(true)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Anonymous</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={!isAnonymous}
                    onChange={() => setIsAnonymous(false)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Provide contact info</span>
                </label>
              </div>

              {!isAnonymous && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Your name (optional)"
                    value={respondentName}
                    onChange={(e) => setRespondentName(e.target.value)}
                    className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="email"
                    placeholder="Your email (optional)"
                    value={respondentEmail}
                    onChange={(e) => setRespondentEmail(e.target.value)}
                    className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SurveyPage