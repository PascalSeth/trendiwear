
export const YANGO_CONFIG = {
  baseUrl: 'https://b2b.taxi.yandex.net',
  apiToken: process.env.YANGO_API_TOKEN!,
}

export interface YangoQuotePayload {
  route_points: Array<{
    point: [number, number]; // [longitude, latitude]
    fullname?: string;
  }>;
  items: Array<{
    title: string;
    quantity: number;
    cost_value: string;
    cost_currency: string;
    weight: number;
  }>;
}

export interface YangoQuoteResponse {
  offers: Array<{
    offer_id: string;
    price: string;
    currency: string;
  }>;
}

export interface YangoClaimPayload {
  route_points: Array<{
    point: [number, number];
    contact: {
      name: string;
      phone: string;
    };
    address: {
      fullname: string;
    };
    visit_order: number;
    type: 'source' | 'destination';
  }>;
  items: Array<{
    title: string;
    quantity: number;
    cost_value: string;
    cost_currency: string;
    weight: number;
  }>;
  client_requirements?: {
    taxi_class?: string;
  };
}

export async function getYangoQuote(payload: YangoQuotePayload): Promise<YangoQuoteResponse> {
  const response = await fetch(`${YANGO_CONFIG.baseUrl}/v1/offers/calculate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${YANGO_CONFIG.apiToken}`,
      'Content-Type': 'application/json',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Yango Quote Error');
  }

  return response.json();
}

export async function createYangoClaim(payload: YangoClaimPayload) {
  const response = await fetch(`${YANGO_CONFIG.baseUrl}/v1/claims/create`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${YANGO_CONFIG.apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Yango Claim Error');
  }

  return response.json();
}

export async function acceptYangoClaim(claimId: string) {
  const response = await fetch(`${YANGO_CONFIG.baseUrl}/v1/claims/accept?claim_id=${claimId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${YANGO_CONFIG.apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ version: 1 }), // Version check might be needed
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Yango Accept Error');
  }

  return response.json();
}
