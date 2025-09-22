import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

type SurveyType = "BUYER" | "SELLER"

interface SurveyAnswer {
  questionId: string
  answerText?: string
  selectedOptions?: string[]
}

interface SurveySubmission {
  surveyType: SurveyType
  respondentEmail?: string
  respondentName?: string
  isAnonymous?: boolean
  answers: SurveyAnswer[]
}

export async function POST(request: NextRequest) {
  try {
    const body: SurveySubmission = await request.json()
    const { surveyType, respondentEmail, respondentName, isAnonymous = true, answers } = body

    // Get client IP for analytics
    const ipAddress = request.headers.get('x-forwarded-for') ||
                     request.headers.get('x-real-ip') ||
                     'unknown'

    // Get user agent
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Create survey response
    const surveyResponse = await prisma.surveyResponse.create({
      data: {
        surveyType,
        respondentEmail: isAnonymous ? null : respondentEmail,
        respondentName: isAnonymous ? null : respondentName,
        isAnonymous,
        ipAddress,
        userAgent,
        completedAt: new Date(),
      },
    })

    // Create answers
    const answerPromises = answers.map((answer) =>
      prisma.surveyAnswer.create({
        data: {
          responseId: surveyResponse.id,
          questionId: answer.questionId,
          answerText: answer.answerText,
          selectedOptions: answer.selectedOptions || [],
        },
      })
    )

    await Promise.all(answerPromises)

    return NextResponse.json({
      success: true,
      responseId: surveyResponse.id,
      message: "Survey submitted successfully"
    }, { status: 201 })

  } catch (error) {
    console.error('Survey submission error:', error)
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const surveyType = searchParams.get("surveyType") as SurveyType
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")

    if (!surveyType) {
      return NextResponse.json({ error: "surveyType parameter is required" }, { status: 400 })
    }

    const where = { surveyType }

    const [responses, total] = await Promise.all([
      prisma.surveyResponse.findMany({
        where,
        include: {
          answers: {
            include: {
              question: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.surveyResponse.count({ where }),
    ])

    return NextResponse.json({
      responses,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })

  } catch (error) {
    console.error('Survey fetch error:', error)
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}