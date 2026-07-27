import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { mapErrorToResponse } from "@/lib/api-utils";
import { getCurrencyCode } from "@/lib/currency";

export async function GET() {
  try {
    const user = await requireAuth();

    if (!["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Fetch all failed or processing payouts
    const failedPayouts = await prisma.payoutRequest.findMany({
      where: {
        status: { in: ["FAILED", "PROCESSING", "PENDING"] },
      },
      include: {
        professional: {
          select: {
            id: true,
            businessName: true,
            user: { select: { id: true, email: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ payouts: failedPayouts });
  } catch (error) {
    const { status, message } = mapErrorToResponse(error, { route: "admin-payouts-get" });
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();

    if (!["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { payoutId, action, rejectionReason } = await request.json();

    if (!payoutId || !action) {
      return NextResponse.json({ error: "payoutId and action are required" }, { status: 400 });
    }

    const payout = await prisma.payoutRequest.findUnique({
      where: { id: payoutId },
      include: { professional: true },
    });

    if (!payout) {
      return NextResponse.json({ error: "Payout request not found" }, { status: 404 });
    }

    const currencyCode = await getCurrencyCode();
    const sellerUserId = payout.professional.userId;

    // ─── ACTION 1: MARK PAID MANUALLY ──────────────────────────────────────────
    if (action === "MARK_PAID") {
      await prisma.payoutRequest.update({
        where: { id: payoutId },
        data: {
          status: "PAID",
          processedAt: new Date(),
          failureReason: null,
        },
      });

      if (sellerUserId) {
        await prisma.notification.create({
          data: {
            userId: sellerUserId,
            type: "PAYMENT_RELEASED",
            title: "Payout Completed Manually",
            message: `Admin has verified and marked your payout of ${currencyCode} ${payout.amount.toFixed(
              2
            )} as completed!`,
            data: JSON.stringify({ payoutId, amount: payout.amount }),
          },
        });
      }

      return NextResponse.json({ success: true, message: "Payout marked as paid manually." });
    }

    // ─── ACTION 2: REFUND TO SELLER WALLET ────────────────────────────────────
    if (action === "REFUND_WALLET") {
      await prisma.$transaction(async (tx) => {
        // Refund back to seller's accountBalance
        await tx.professionalProfile.update({
          where: { id: payout.professionalId },
          data: {
            accountBalance: {
              increment: payout.amount,
            },
          },
        });

        // Set status REJECTED
        await tx.payoutRequest.update({
          where: { id: payoutId },
          data: {
            status: "REJECTED",
            failureReason: rejectionReason || "Admin refunded payout back to wallet",
          },
        });
      });

      if (sellerUserId) {
        await prisma.notification.create({
          data: {
            userId: sellerUserId,
            type: "ORDER_UPDATE",
            title: "Payout Restored to Wallet",
            message: `Your payout of ${currencyCode} ${payout.amount.toFixed(
              2
            )} was cancelled by admin and restored back to your wallet balance. ${
              rejectionReason ? `Reason: ${rejectionReason}` : ""
            }`,
            data: JSON.stringify({ payoutId, amount: payout.amount }),
          },
        });
      }

      return NextResponse.json({ success: true, message: "Payout funds restored to seller wallet." });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    const { status, message } = mapErrorToResponse(error, { route: "admin-payouts-action" });
    return NextResponse.json({ error: message }, { status });
  }
}
