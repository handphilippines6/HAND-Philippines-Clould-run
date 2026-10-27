/**
 * /_functions API router — the portable port of backend/http-functions.js.
 *
 * Maps `METHOD /_functions/<endpoint>` onto the same handlers with the same
 * response contracts, CORS behavior, OPTIONS preflight, per-lane rate limits,
 * and bearer-token authorization. After every request the file-backed store
 * is flushed.
 */
import * as store from './store.js';
import {
  json,
  noContent,
  badRequest,
  unauthorized,
  notFound,
  serverError,
  getJsonBody,
  getOrigin,
  isOriginAllowed,
  corsHeaders,
  getClientIp,
  hashForAudit,
  bearerToken,
  consumeRateLimit,
} from './util.js';
import * as donations from './routes/donations.js';
import * as otp from './routes/otp.js';
import * as contact from './routes/contact.js';
import * as content from './routes/content.js';
import * as fundraisers from './routes/fundraisers.js';
import * as admin from './routes/admin.js';
import * as islands from './routes/islands.js';
import { verifyWebhookSignature } from './stripe.js';
import { normalizeEmail } from './validation.js';

/* ---------------------------- helpers ----------------------------- */

function originGuard(request) {
  const origin = getOrigin(request);
  if (origin && !isOriginAllowed(origin)) {
    return json(request, { success: false, error: 'Origin not allowed.' }, 403);
  }
  return null;
}

async function requireDonorSession(request) {
  const token = bearerToken(request);
  if (!token) return null;
  const session = await store.get('DonorSessions', token);
  if (!session || new Date(session.expiresAt) < new Date()) return null;
  return session;
}

async function rateLimited(request, lane) {
  const limit = await consumeRateLimit(lane, hashForAudit(getClientIp(request) || 'unknown'));
  if (!limit.evaluation.allowed) {
    return json(
      request,
      {
        success: false,
        error: 'Too many attempts from this connection. Please try again shortly.',
        retryAfterSeconds: limit.evaluation.retryAfterSeconds,
      },
      429,
      { 'Retry-After': String(limit.evaluation.retryAfterSeconds) },
    );
  }
  return null;
}
async function requireAdmin(request) {
  const session = await admin.requireAdminSession(request);
  if (!session) {
    return json(request, { success: false, error: 'Administrator sign-in required.' }, 401);
  }
  return null;
}

/* --------------------------- route table -------------------------- */

async function route(request, pathname, searchParams, rawBody) {
  const endpoint = pathname.replace(/^\/_functions\/?/, '');
  const method = request.method.toUpperCase();
  const body = method === 'POST' ? getJsonBody(rawBody) || {} : {};

  /* CORS preflight for every endpoint (options_* handlers in the original). */
  if (method === 'OPTIONS') return noContent(request);

  const switchKey = `${method} ${endpoint}`;

  switch (switchKey) {
    /* ---- Content (public) ---- */
    case 'GET programs':
      return json(request, { success: true, programs: await content.listPrograms() });
    case 'GET program': {
      const slug = searchParams.get('slug');
      if (!slug) {
        return badRequest({ headers: corsHeaders(getOrigin(request)), body: { success: false, error: 'Program slug is required.' } });
      }
      const program = await content.getProgramBySlug(slug);
      if (!program) return json(request, { success: false, error: 'Program not found.' }, 404);
      return json(request, { success: true, program });
    }
    case 'GET campaign': {
      const campaign = await content.getCampaignByIdOrSlug({ id: searchParams.get('id'), slug: searchParams.get('slug') });
      if (!campaign) return json(request, { success: false, error: 'Campaign not found.' }, 404);
      return json(request, { success: true, campaign });
    }
    case 'GET donors': {
      const campaignId = searchParams.get('campaign');
      if (!campaignId) {
        return badRequest({ headers: corsHeaders(getOrigin(request)), body: { success: false, error: 'Campaign ID is required.' } });
      }
      return json(request, { success: true, donors: await content.listDonors(campaignId) });
    }
    case 'GET fundraiser': {
      const fundraiser = await content.getFundraiserBySlug(searchParams.get('slug'));
      if (!fundraiser) return json(request, { success: false, error: 'Fundraiser not found.' }, 404);
      return json(request, { success: true, fundraiser });
    }
    case 'GET fundraiserDonors':
      return json(request, { success: true, supporters: await content.listFundraiserSupporters(searchParams.get('slug')) });

    /* ---- Donations (public) ---- */
    case 'GET stripePublishableKey': {
      const key = donations.getPublishableKey();
      if (!key) return json(request, { success: false, error: 'The payment gateway is not configured.' }, 503);
      return json(request, { success: true, publishableKey: key });
    }
    case 'POST createPaymentIntent': {
      const guard = (await rateLimited(request, 'DONATION_INTENT')) || originGuard(request);
      if (guard) return guard;
      const result = await donations.createPaymentIntent(body);
      return json(request, result, result?.success ? 200 : 400);
    }
    case 'POST updateDonationStatus': {
      try {
        const donation = await donations.verifyAndUpdateStatus(
          String(body.paymentIntentId || ''),
          String(body.verificationToken || ''),
        );
        return json(request, { success: true, donation: { status: donation.status, paidAt: donation.paidAt || null } });
      } catch (error) {
        return json(request, { success: false, error: error.message || 'Verification failed.' }, 400);
      }
    }
    case 'POST createDonationSessionKey': {
      try {
        const { sessionKey, expiresAt } = await donations.createDonationSessionKey(
          String(body.paymentIntentId || ''),
          String(body.verificationToken || ''),
        );
        return json(request, { success: true, sessionKey, expiresAt });
      } catch (error) {
        return json(request, { success: false, error: error.message || 'Session could not be created.' }, 400);
      }
    }
    case 'POST verifyDonationSession': {
      try {
        const data = await donations.verifyDonationSession(String(body.sessionKey || ''));
        return json(request, { success: true, ...data });
      } catch (error) {
        return json(request, { success: false, error: error.message || 'Session verification failed.' }, 401);
      }
    }
    case 'GET donationStatus': {
      const donation = await store.first('Donations', (row) => row.donationId === searchParams.get('id'));
      if (!donation) return json(request, { success: false, error: 'Donation not found.' }, 404);
      return json(request, { success: true, donationId: donation.donationId, status: donation.status });
    }

    /* ---- Contact / interest ---- */
    case 'POST contactMessage': {
      const guard = (await rateLimited(request, 'CONTACT_MESSAGE')) || originGuard(request);
      if (guard) return guard;
      const result = await contact.contactMessage(body);
      return json(request, result, result?.ok ? 200 : 400);
    }

    /* ---- Donor OTP + dashboard ---- */
    case 'POST requestDonorOtp': {
      const guard = (await rateLimited(request, 'DONOR_OTP')) || originGuard(request);
      if (guard) return guard;
      const result = await otp.requestDonorOtp(body);
      return json(request, result, result?.ok ? 200 : 400);
    }
    case 'POST verifyDonorOtp': {
      const result = await otp.verifyDonorOtp(body);
      return json(request, result, result?.ok ? 200 : 400);
    }
    case 'GET donationReceipt': {
      const session = await requireDonorSession(request);
      if (!session) {
        return unauthorized({
          headers: corsHeaders(getOrigin(request)),
          body: { success: false, error: 'A donor session is required.' },
        });
      }
      const donation = await store.first(
        'Donations',
        (row) =>
          (row.donationId === searchParams.get('id') || row._id === searchParams.get('id')) &&
          normalizeEmail(row.donorEmail || '') === normalizeEmail(session.donorEmail || ''),
      );
      if (!donation) {
        return notFound({ headers: corsHeaders(getOrigin(request)), body: { success: false, error: 'Receipt not found.' } });
      }
      const pdf = donations.buildReceiptPdf(donation);
      return {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="hand-philippines-receipt-${donation.donationId || donation._id}.pdf"`,
          ...corsHeaders(getOrigin(request)),
        },
        body: pdf,
      };
    }

    /* ---- Wix member bridge (standalone: no member session) ---- */
    case 'GET getCurrentWixMember':
      return json(request, { success: true, loggedIn: false, memberId: null, email: null });
    case 'POST createSessionFromWixMember':
      return json(request, { success: false, error: 'No Wix member session is available on this deployment.' }, 401);

    /* ---- Fundraiser portal ---- */
    case 'POST fundraiserLogin': {
      const guard = (await rateLimited(request, 'FUNDRAISER_LOGIN')) || originGuard(request);
      if (guard) return guard;
      const result = await fundraisers.fundraiserLogin(body);
      return json(request, result, result?.ok ? 200 : 401);
    }
    case 'POST verifyFundraiserSession': {
      try {
        const data = await fundraisers.verifyFundraiserSession(String(body.sessionKey || ''));
        return json(request, { success: true, ...data });
      } catch (error) {
        return json(request, { success: false, error: error.message }, 401);
      }
    }
    case 'POST updateFundraiserSettings': {
      const result = await fundraisers.updateFundraiserSettings(body);
      return json(request, result, result?.ok ? 200 : 401);
    }

    /* ---- Admin ---- */
    case 'GET currentAdmin':
      return json(request, admin.currentAdmin());
    case 'POST adminLogin': {
      const guard = (await rateLimited(request, 'FUNDRAISER_LOGIN')) || originGuard(request);
      if (guard) return guard;
      const result = await admin.adminLogin(body);
      return json(request, result, result?.ok ? 200 : 401);
    }
    case 'POST verifyAdminSession': {
      try {
        const data = await admin.verifyAdminSession(String(body.sessionKey || ''));
        return json(request, { success: true, ...data });
      } catch (error) {
        return json(request, { success: false, error: error.message }, 401);
      }
    }
    case 'POST adminLogout':
      return json(request, await admin.adminLogout(String(body.sessionKey || bearerToken(request))));
    case 'GET adminOverview': {
      const denied = await requireAdmin(request);
      if (denied) return denied;
      return json(request, { success: true, ...(await admin.adminOverview()) });
    }
    case 'GET adminDonations': {
      const denied = await requireAdmin(request);
      if (denied) return denied;
      return json(request, { success: true, ...(await admin.adminDonations()) });
    }
    case 'GET adminCampaigns': {
      const denied = await requireAdmin(request);
      if (denied) return denied;
      return json(request, { success: true, ...(await admin.adminCampaigns()) });
    }
    case 'GET adminFundraisers': {
      const denied = await requireAdmin(request);
      if (denied) return denied;
      return json(request, { success: true, ...(await admin.adminFundraisers()) });
    }
    case 'GET adminContent': {
      const denied = await requireAdmin(request);
      if (denied) return denied;
      return json(request, { success: true, ...(await admin.adminContent()) });
    }
    case 'GET adminUsers': {
      const denied = await requireAdmin(request);
      if (denied) return denied;
      return json(request, { success: true, ...(await admin.adminUsers()) });
    }
    case 'GET adminSettings': {
      const denied = await requireAdmin(request);
      if (denied) return denied;
      return json(request, { success: true, ...(await admin.adminSettings()) });
    }
    case 'GET adminAuditLog': {
      const denied = await requireAdmin(request);
      if (denied) return denied;
      return json(request, { success: true, ...(await admin.adminAuditLog(searchParams)) });
    }
    case 'GET adminInterests': {
      const denied = await requireAdmin(request);
      if (denied) return denied;
      return json(request, { success: true, ...(await admin.adminInterests(searchParams)) });
    }
    case 'POST adminRefund': {
      const denied = await requireAdmin(request);
      if (denied) return denied;
      const result = await admin.adminRefund(body);
      return json(request, result, result?.ok ? 200 : 400);
    }
    case 'POST adminInterestStatus': {
      const denied = await requireAdmin(request);
      if (denied) return denied;
      const result = await admin.adminInterestStatus(body);
      return json(request, result, result?.ok ? 200 : 400);
    }

    /* ---- Adopt an Island ---- */
    case 'GET islandBoard':
      return json(request, await islands.islandBoard());
    case 'POST startIslandGift':
    case 'POST reserveIslandSlots': {
      const guard = originGuard(request);
      if (guard) return guard;
      return json(request, await islands.startIslandGift(body), 200);
    }
    case 'POST releaseIslandHold':
      return json(request, await islands.releaseIslandHold(body));

    default:
      return json(request, { success: false, error: `Unknown endpoint: ${method} /_functions/${endpoint}` }, 404);
  }
}

/* --------------------------- entry point -------------------------- */

/**
 * Handles a /_functions request. Returns the response object
 * {status, headers, body} or null when the path is not an API path.
 */
export async function handleApiRequest(request, url, rawBody) {
  if (!url.pathname.startsWith('/_functions/')) return null;

  try {
    const response = await route(request, url.pathname, url.searchParams, rawBody);
    return response;
  } catch (error) {
    console.error('[API]', error);
    return serverError({
      headers: corsHeaders(getOrigin(request)),
      body: { success: false, error: 'Unable to complete the request.' },
    });
  } finally {
    await store.flush();
  }
}
