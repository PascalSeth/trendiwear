import { type NextRequest, NextResponse } from "next/server"

type SurveyType = "BUYER" | "SELLER"

// Pre-defined survey questions based on our survey document
const buyerQuestions = [
  // Current Shopping Methods
  {
    section: "Current Shopping Methods",
    question: "What methods do you currently use for buying fashion items?",
    questionType: "CHECKBOX" as const,
    options: [
      "Online marketplaces (Amazon, eBay, etc.)",
      "Brand websites",
      "Social media shopping",
      "Local boutiques/stores",
      "Street markets/fairs",
      "Second-hand platforms",
      "Other"
    ],
    isRequired: true,
    order: 1
  },
  {
    section: "Current Shopping Methods",
    question: "Which method do you prefer most and why?",
    questionType: "TEXTAREA" as const,
    isRequired: false,
    order: 2
  },

  // Online Shopping Experiences
  {
    section: "Online Shopping Experiences",
    question: "What has been your experience with online fashion shopping?",
    questionType: "TEXTAREA" as const,
    isRequired: false,
    order: 3
  },
  {
    section: "Online Shopping Experiences",
    question: "Describe your biggest challenges with online fashion shopping.",
    questionType: "TEXTAREA" as const,
    isRequired: false,
    order: 4
  },

  // Traditional vs Online
  {
    section: "Traditional vs Online",
    question: "How does online fashion shopping compare to in-person shopping for you?",
    questionType: "TEXTAREA" as const,
    isRequired: false,
    order: 5
  },
  {
    section: "Traditional vs Online",
    question: "What aspects of traditional shopping do you miss in online experiences?",
    questionType: "CHECKBOX" as const,
    options: [
      "Trying on clothes",
      "Personal styling advice",
      "Immediate purchase satisfaction",
      "Social aspects of shopping",
      "Other"
    ],
    isRequired: false,
    order: 6
  },

  // Sizing and Fit Issues
  {
    section: "Sizing and Fit Issues",
    question: "How do you typically handle sizing when shopping online?",
    questionType: "CHECKBOX" as const,
    options: [
      "Size guides and charts",
      "Brand-specific sizing knowledge",
      "Reviews and photos from other customers",
      "Returning items that don't fit",
      "Avoiding online shopping due to fit concerns"
    ],
    isRequired: false,
    order: 7
  },
  {
    section: "Sizing and Fit Issues",
    question: "What improvements would you like to see for sizing and fit?",
    questionType: "TEXTAREA" as const,
    isRequired: false,
    order: 8
  },

  // Customer Service
  {
    section: "Customer Service Experiences",
    question: "Describe your customer service experiences across different fashion platforms.",
    questionType: "TEXTAREA" as const,
    isRequired: false,
    order: 9
  },
  {
    section: "Customer Service Experiences",
    question: "What has been your worst customer service experience with fashion purchases?",
    questionType: "TEXTAREA" as const,
    isRequired: false,
    order: 10
  },

  // Pricing and Value
  {
    section: "Pricing and Value",
    question: "How do you feel about pricing in the fashion industry?",
    questionType: "TEXTAREA" as const,
    isRequired: false,
    order: 11
  },
  {
    section: "Pricing and Value",
    question: "What are your thoughts on sales, discounts, and promotions?",
    questionType: "TEXTAREA" as const,
    isRequired: false,
    order: 12
  },

  // Trust and Authenticity
  {
    section: "Trust and Authenticity",
    question: "What concerns do you have about buying fashion online?",
    questionType: "CHECKBOX" as const,
    options: [
      "Counterfeit products",
      "Quality misrepresentation",
      "Seller credibility",
      "Payment security",
      "Privacy concerns"
    ],
    isRequired: false,
    order: 13
  },

  // Personal Styling
  {
    section: "Personal Styling and Recommendations",
    question: "How do you currently get fashion advice and styling help?",
    questionType: "CHECKBOX" as const,
    options: [
      "Friends and family",
      "Social media influencers",
      "Personal stylists",
      "Online styling services",
      "Self-research"
    ],
    isRequired: false,
    order: 14
  },
  {
    section: "Personal Styling and Recommendations",
    question: "What kind of styling and recommendation services would you like to see more of?",
    questionType: "TEXTAREA" as const,
    isRequired: false,
    order: 15
  },

  // Sustainability
  {
    section: "Sustainability and Ethics",
    question: "How important are sustainability and ethical practices in your fashion purchases?",
    questionType: "TEXTAREA" as const,
    isRequired: false,
    order: 16
  },

  // Future Innovations
  {
    section: "Future of Fashion Shopping",
    question: "What innovations in fashion shopping would excite you most?",
    questionType: "TEXTAREA" as const,
    isRequired: false,
    order: 17
  },
  {
    section: "Future of Fashion Shopping",
    question: "What one major problem in fashion shopping would you like solved?",
    questionType: "TEXTAREA" as const,
    isRequired: false,
    order: 18
  },

  // Overall
  {
    section: "Overall Satisfaction & Suggestions",
    question: "Any other thoughts about your fashion shopping experiences?",
    questionType: "TEXTAREA" as const,
    isRequired: false,
    order: 19
  }
]

const sellerQuestions = [
  // Current Selling Methods
  {
    section: "Current Selling Methods",
    question: "What methods do you currently use to sell fashion items or services?",
    questionType: "CHECKBOX" as const,
    options: [
      "Online marketplaces (Etsy, eBay, Shopify stores)",
      "Social media platforms (Instagram, Facebook Marketplace)",
      "Your own website",
      "Local boutiques or pop-up shops",
      "Wholesale to retailers",
      "Direct-to-consumer through personal networks",
      "Other"
    ],
    isRequired: true,
    order: 1
  },
  {
    section: "Current Selling Methods",
    question: "Which selling method has been most profitable for you and why?",
    questionType: "TEXTAREA" as const,
    isRequired: false,
    order: 2
  },

  // Online Selling Platforms
  {
    section: "Online Selling Platforms",
    question: "What has been your experience selling on different online platforms?",
    questionType: "TEXTAREA" as const,
    isRequired: false,
    order: 3
  },
  {
    section: "Online Selling Platforms",
    question: "What are your biggest challenges as an online fashion seller?",
    questionType: "TEXTAREA" as const,
    isRequired: false,
    order: 4
  },

  // Traditional vs Online Selling
  {
    section: "Traditional vs Online Selling",
    question: "How does online selling compare to traditional selling methods for you?",
    questionType: "TEXTAREA" as const,
    isRequired: false,
    order: 5
  },

  // Customer Management
  {
    section: "Customer Management",
    question: "How do you currently manage customer relationships and communication?",
    questionType: "CHECKBOX" as const,
    options: [
      "Email, phone, social media messaging",
      "Platform messaging systems",
      "CRM tools or spreadsheets",
      "Personal relationships and word-of-mouth"
    ],
    isRequired: false,
    order: 6
  },
  {
    section: "Customer Management",
    question: "What challenges do you face with customer service and satisfaction?",
    questionType: "TEXTAREA" as const,
    isRequired: false,
    order: 7
  },

  // Inventory and Production
  {
    section: "Inventory and Production",
    question: "How do you manage your inventory and production?",
    questionType: "CHECKBOX" as const,
    options: [
      "Small batch production",
      "Made-to-order items",
      "Bulk manufacturing",
      "Sourcing from suppliers"
    ],
    isRequired: false,
    order: 8
  },

  // Marketing
  {
    section: "Marketing and Customer Acquisition",
    question: "How do you currently market your fashion items or services?",
    questionType: "CHECKBOX" as const,
    options: [
      "Social media marketing",
      "Influencer partnerships",
      "Email newsletters",
      "Local advertising",
      "Word-of-mouth and referrals",
      "Other"
    ],
    isRequired: false,
    order: 9
  },
  {
    section: "Marketing and Customer Acquisition",
    question: "What marketing challenges do you face?",
    questionType: "TEXTAREA" as const,
    isRequired: false,
    order: 10
  },

  // Pricing
  {
    section: "Pricing and Profitability",
    question: "How do you determine pricing for your products or services?",
    questionType: "CHECKBOX" as const,
    options: [
      "Cost-plus pricing",
      "Market research and competitor analysis",
      "Value-based pricing",
      "Dynamic pricing strategies"
    ],
    isRequired: false,
    order: 11
  },

  // Technology
  {
    section: "Technology and Tools",
    question: "What tools and technology do you currently use for your fashion business?",
    questionType: "TEXTAREA" as const,
    isRequired: false,
    order: 12
  },
  {
    section: "Technology and Tools",
    question: "What technology challenges do you face?",
    questionType: "TEXTAREA" as const,
    isRequired: false,
    order: 13
  },

  // Business Growth
  {
    section: "Business Growth and Scaling",
    question: "What are your goals for growing your fashion business?",
    questionType: "TEXTAREA" as const,
    isRequired: false,
    order: 14
  },
  {
    section: "Business Growth and Scaling",
    question: "What obstacles do you face in scaling your business?",
    questionType: "TEXTAREA" as const,
    isRequired: false,
    order: 15
  },

  // Industry Trends
  {
    section: "Industry Trends and Future",
    question: "What trends in the fashion industry excite you most?",
    questionType: "TEXTAREA" as const,
    isRequired: false,
    order: 16
  },
  {
    section: "Industry Trends and Future",
    question: "What changes would you like to see in the fashion selling landscape?",
    questionType: "TEXTAREA" as const,
    isRequired: false,
    order: 17
  },

  // Overall
  {
    section: "Overall Experience",
    question: "What has been your most positive experience as a fashion seller?",
    questionType: "TEXTAREA" as const,
    isRequired: false,
    order: 18
  },
  {
    section: "Overall Experience",
    question: "What has been your most challenging experience as a fashion seller?",
    questionType: "TEXTAREA" as const,
    isRequired: false,
    order: 19
  },
  {
    section: "Overall Experience",
    question: "What advice would you give to someone starting a fashion business today?",
    questionType: "TEXTAREA" as const,
    isRequired: false,
    order: 20
  },
  {
    section: "Overall Experience",
    question: "What one major improvement would transform fashion selling for small businesses?",
    questionType: "TEXTAREA" as const,
    isRequired: false,
    order: 21
  },
  {
    section: "Overall Experience",
    question: "Any other thoughts about your experiences as a fashion seller?",
    questionType: "TEXTAREA" as const,
    isRequired: false,
    order: 22
  }
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const surveyType = searchParams.get("surveyType") as SurveyType

    if (!surveyType) {
      return NextResponse.json({ error: "surveyType parameter is required" }, { status: 400 })
    }

    // Return pre-defined questions based on survey type
    const questions = surveyType === "BUYER" ? buyerQuestions : sellerQuestions

    return NextResponse.json({
      surveyType,
      questions,
      totalQuestions: questions.length
    })

  } catch (error) {
    console.error('Survey questions fetch error:', error)
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}