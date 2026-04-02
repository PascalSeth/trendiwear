import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: Number(process.env.EMAIL_SERVER_PORT),
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
})

export async function sendDeliveryUpdateEmail({
  to,
  orderId,
  riderName,
  riderPhone,
  deliveryPrice,
  trackingNumber,
  sellerName,
  items,
}: {
  to: string
  orderId: string
  riderName?: string
  riderPhone?: string
  deliveryPrice?: number
  trackingNumber?: string
  sellerName?: string
  items?: Array<{ name: string; quantity: number }>
}) {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject: `Delivery Update: Order #${orderId.slice(-8).toUpperCase()} from ${sellerName || 'Trendiwear'}`,
    html: `
      <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; max-width: 600px; margin: auto; border: 1px solid #f0f0f0; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.05);">
        <div style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.02em;">Order is Ready!</h1>
          <p style="color: rgba(255,255,255,0.8); margin-top: 8px; font-weight: 500;">Order #${orderId.slice(-8).toUpperCase()}</p>
        </div>

        <div style="padding: 30px;">
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            Good news! Your order from <strong>${sellerName || 'Trendiwear'}</strong> is packed and ready for delivery.
          </p>

          <div style="margin: 30px 0; padding: 20px; background: #f8fafc; border-radius: 16px;">
            <h3 style="margin: 0 0 16px 0; font-size: 14px; font-weight: 700; color: #1e293b; text-transform: uppercase; tracking: 0.05em;">Fulfillment Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Rider Name</td>
                <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600; text-align: right;">${riderName || 'In Progress'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Contact</td>
                <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600; text-align: right;">${riderPhone || 'Not provided'}</td>
              </tr>
              ${deliveryPrice ? `
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Delivery Fee</td>
                <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600; text-align: right;">GHS ${deliveryPrice.toFixed(2)}</td>
              </tr>` : ''}
              ${trackingNumber ? `
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Tracking ID</td>
                <td style="padding: 8px 0; color: #1e293b; font-size: 14px; font-weight: 600; text-align: right;">${trackingNumber}</td>
              </tr>` : ''}
            </table>
          </div>

          ${items && items.length > 0 ? `
          <div style="margin-bottom: 30px;">
            <h3 style="margin: 0 0 16px 0; font-size: 14px; font-weight: 700; color: #1e293b; text-transform: uppercase;">Items in this Shipment</h3>
            ${items.map(item => `
              <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f1f5f9;">
                <span style="color: #475569; font-size: 14px;">${item.quantity}× ${item.name}</span>
              </div>
            `).join('')}
          </div>
          ` : ''}

          <div style="text-align: center; margin-top: 40px;">
            <p style="color: #94a3b8; font-size: 13px; margin-bottom: 20px;">
              You should receive your package within 48 hours.
            </p>
            <a href="${process.env.NEXTAUTH_URL}/account/orders/${orderId}" style="background: #1e293b; color: white; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 14px; display: inline-block;">Track Order Status</a>
          </div>
        </div>

        <div style="background: #f8fafc; padding: 30px; text-align: center; border-top: 1px solid #f1f5f9;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">
            This is an automated notification from Trendiwear.<br/>
            Need help? Contact our support or <strong>${sellerName || 'the seller'}</strong> directly.
          </p>
        </div>
      </div>
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log(`Email sent to ${to} for order ${orderId}`)
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error)
    // We don't throw here to avoid failing the whole process if email fails
  }
}

export async function sendOrderConfirmationEmail({
  to,
  orderId,
  totalPrice,
  currency,
  items,
}: {
  to: string
  orderId: string
  totalPrice: number
  currency: string
  items: Array<{ name: string; quantity: number; price: number; image?: string }>
}) {
  const itemRows = items.map(item => `
    <tr>
      <td style="padding: 12px 0; color: #475569; font-size: 14px; border-bottom: 1px solid #f1f5f9;">${item.quantity}× ${item.name}</td>
      <td style="padding: 12px 0; color: #1e293b; font-size: 14px; font-weight: 600; text-align: right; border-bottom: 1px solid #f1f5f9;">${currency} ${item.price.toFixed(2)}</td>
    </tr>
  `).join('')

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject: `Order Confirmed! #${orderId.slice(-8).toUpperCase()} — TrendiZip`,
    html: `
      <div style="font-family: 'Inter', system-ui, sans-serif; max-width: 600px; margin: auto; border: 1px solid #f0f0f0; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.05);">
        <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 800;">Payment Confirmed ✓</h1>
          <p style="color: rgba(255,255,255,0.8); margin-top: 8px; font-weight: 500;">Order #${orderId.slice(-8).toUpperCase()}</p>
        </div>
        <div style="padding: 30px;">
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">Thank you for your purchase! Your payment has been received and your order is now being prepared.</p>
          <div style="margin: 30px 0; padding: 20px; background: #f8fafc; border-radius: 16px;">
            <h3 style="margin: 0 0 16px 0; font-size: 14px; font-weight: 700; color: #1e293b; text-transform: uppercase;">Order Summary</h3>
            <table style="width: 100%; border-collapse: collapse;">${itemRows}</table>
            <div style="margin-top: 16px; padding-top: 16px; border-top: 2px solid #e2e8f0; display: flex; justify-content: space-between;">
              <span style="font-size: 16px; font-weight: 700; color: #1e293b;">Total</span>
              <span style="font-size: 16px; font-weight: 700; color: #1e293b; float: right;">${currency} ${totalPrice.toFixed(2)}</span>
            </div>
          </div>
          <div style="text-align: center; margin-top: 40px;">
            <a href="${process.env.NEXTAUTH_URL}/orders" style="background: #1e293b; color: white; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 14px; display: inline-block;">View Your Orders</a>
          </div>
        </div>
        <div style="background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #f1f5f9;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">This is an automated notification from TrendiZip.</p>
        </div>
      </div>
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log(`Order confirmation email sent to ${to} for order ${orderId}`)
  } catch (error) {
    console.error(`Failed to send order confirmation email to ${to}:`, error)
  }
}

export async function sendStatusUpdateEmail({
  to,
  orderId,
  status,
  message,
}: {
  to: string
  orderId: string
  status: string
  message: string
}) {
  const statusColors: Record<string, string> = {
    PROCESSING: '#3b82f6',
    SHIPPED: '#8b5cf6',
    DELIVERED: '#059669',
    CANCELLED: '#ef4444',
  }
  const bgColor = statusColors[status] || '#1e293b'

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject: `Order Update: #${orderId.slice(-8).toUpperCase()} — ${status}`,
    html: `
      <div style="font-family: 'Inter', system-ui, sans-serif; max-width: 600px; margin: auto; border: 1px solid #f0f0f0; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.05);">
        <div style="background: ${bgColor}; padding: 40px 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 800;">Order ${status}</h1>
          <p style="color: rgba(255,255,255,0.8); margin-top: 8px;">Order #${orderId.slice(-8).toUpperCase()}</p>
        </div>
        <div style="padding: 30px;">
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">${message}</p>
          <div style="text-align: center; margin-top: 40px;">
            <a href="${process.env.NEXTAUTH_URL}/orders/${orderId}" style="background: #1e293b; color: white; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 14px; display: inline-block;">View Order Details</a>
          </div>
        </div>
        <div style="background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #f1f5f9;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">This is an automated notification from TrendiZip.</p>
        </div>
      </div>
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
  } catch (error) {
    console.error(`Failed to send status email to ${to}:`, error)
  }
}

export async function sendNewMessageEmail({
  to,
  senderName,
  messageContent,
  conversationId,
}: {
  to: string
  senderName: string
  messageContent: string
  conversationId: string
}) {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject: `New Message from ${senderName} — TrendiZip`,
    html: `
      <div style="font-family: 'Inter', system-ui, sans-serif; max-width: 600px; margin: auto; border: 1px solid #f0f0f0; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.05);">
        <div style="background: #1e293b; padding: 40px 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 800;">New Message</h1>
          <p style="color: rgba(255,255,255,0.8); margin-top: 8px;">From ${senderName}</p>
        </div>
        <div style="padding: 30px;">
          <div style="background: #f8fafc; padding: 24px; border-radius: 16px; border: 1px solid #f1f5f9; margin-bottom: 30px;">
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0; italic: true;">"${messageContent}"</p>
          </div>
          <div style="text-align: center;">
            <a href="${process.env.NEXTAUTH_URL}/messages/${conversationId}" style="background: #1e293b; color: white; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 14px; display: inline-block;">Reply Now</a>
          </div>
        </div>
        <div style="background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #f1f5f9;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">This is an automated notification from TrendiZip Concierge.</p>
        </div>
      </div>
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
  } catch (error) {
    console.error(`Failed to send message email to ${to}:`, error)
  }
}

export async function sendBookingRequestEmail({
  to,
  customerName,
  serviceName,
  date,
  bookingId,
}: {
  to: string
  customerName: string
  serviceName: string
  date: string
  bookingId: string
}) {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject: `New Booking Request from ${customerName} — TrendiZip`,
    html: `
      <div style="font-family: 'Inter', system-ui, sans-serif; max-width: 600px; margin: auto; border: 1px solid #f0f0f0; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.05);">
        <div style="background: #4f46e5; padding: 40px 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 800;">New Appointment Request</h1>
          <p style="color: rgba(255,255,255,0.8); margin-top: 8px;">Waiting for your confirmation</p>
        </div>
        <div style="padding: 30px;">
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">You have a new booking request for <strong>${serviceName}</strong> on <strong>${date}</strong>.</p>
          <div style="text-align: center; margin-top: 40px;">
            <a href="${process.env.NEXTAUTH_URL}/bookings" style="background: #1e293b; color: white; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 14px; display: inline-block;">View Booking Request</a>
          </div>
        </div>
        <div style="background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #f1f5f9;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">This request will expire in 6 hours if not confirmed.</p>
        </div>
      </div>
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
  } catch (error) {
    console.error(`Failed to send booking request email to ${to}:`, error)
  }
}

export async function sendBookingStatusEmail({
  to,
  status,
  serviceName,
  date,
  businessName,
  bookingId,
}: {
  to: string
  status: 'CONFIRMED' | 'CANCELLED'
  serviceName: string
  date: string
  businessName: string
  bookingId: string
}) {
  const isConfirmed = status === 'CONFIRMED'
  const bgColor = isConfirmed ? '#059669' : '#ef4444'
  const title = isConfirmed ? 'Appointment Confirmed!' : 'Appointment Cancelled'

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject: `${title} — ${businessName}`,
    html: `
      <div style="font-family: 'Inter', system-ui, sans-serif; max-width: 600px; margin: auto; border: 1px solid #f0f0f0; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.05);">
        <div style="background: ${bgColor}; padding: 40px 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 800;">${title}</h1>
          <p style="color: rgba(255,255,255,0.8); margin-top: 8px;">Order #${bookingId.slice(-8).toUpperCase()}</p>
        </div>
        <div style="padding: 30px;">
          <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            Your booking for <strong>${serviceName}</strong> with <strong>${businessName}</strong> on <strong>${date}</strong> has been ${status.toLowerCase()}.
          </p>
          <div style="text-align: center; margin-top: 40px;">
            <a href="${process.env.NEXTAUTH_URL}/bookings" style="background: #1e293b; color: white; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 14px; display: inline-block;">View Booking History</a>
          </div>
        </div>
        <div style="background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #f1f5f9;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">Automated update from ${businessName} via TrendiZip.</p>
        </div>
      </div>
    `,
  }

  try {
    await transporter.sendMail(mailOptions)
  } catch (error) {
    console.error(`Failed to send booking status email to ${to}:`, error)
  }
}
