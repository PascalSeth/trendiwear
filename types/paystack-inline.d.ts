declare module '@paystack/inline-js' {
  interface ResumeTransactionOptions {
    onSuccess?: (transaction: { reference: string; status: string }) => void
    onCancel?: () => void
    onLoad?: () => void
  }

  class PaystackPop {
    resumeTransaction(accessCode: string, options: ResumeTransactionOptions): void
    newTransaction(options: Record<string, unknown>): void
  }

  export default PaystackPop
}
