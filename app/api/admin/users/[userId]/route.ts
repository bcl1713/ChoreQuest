import { NextRequest, NextResponse } from "next/server";
import { handleRouteError } from "@/lib/api-error-handler";
import {
  authenticateAndFetchUserProfile,
  extractBearerToken,
} from "@/lib/api-auth-helpers";
import { adminUserDetailService } from "@/lib/admin-user-detail-service";
import {
  isGoldLedgerEntryType,
  type GoldLedgerEntryType,
} from "@/lib/admin-user-gold-ledger";
import { ValidationError } from "@/lib/errors";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await params;
    const token = extractBearerToken(request);
    const supabase = createServerSupabaseClient(token);
    const requesterProfile = await authenticateAndFetchUserProfile(
      supabase,
      token,
    );

    const rawLedgerEventType = request.nextUrl.searchParams.get("ledgerEventType");
    let ledgerEventType: GoldLedgerEntryType | null = null;
    if (rawLedgerEventType && rawLedgerEventType !== "ALL") {
      if (!isGoldLedgerEntryType(rawLedgerEventType)) {
        throw new ValidationError(
          "Invalid ledger event type",
          "ADMIN_GOLD_LEDGER_INVALID_EVENT_TYPE",
        );
      }
      ledgerEventType = rawLedgerEventType;
    }

    const detail = await adminUserDetailService.getUserDetail(
      supabase,
      requesterProfile,
      userId,
      {
        ledgerStartDate: request.nextUrl.searchParams.get("ledgerStartDate"),
        ledgerEndDate: request.nextUrl.searchParams.get("ledgerEndDate"),
        ledgerEventType: ledgerEventType as GoldLedgerEntryType | null,
      },
    );

    return NextResponse.json({ success: true, detail });
  } catch (error) {
    return handleRouteError(error);
  }
}
