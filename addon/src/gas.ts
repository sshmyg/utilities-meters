import { getSanctumSession, type SanctumSession } from './helpers/getSanctumSession.ts';
import { solveRecaptchaV3 } from './helpers/solveRecaptcha.ts';
import type { GasAddress, GasSiteConfig } from './types/gas.ts';

const BASE_URL = process.env.GAS_BASE_URL;
const ACCOUNT_NUMBER = process.env.GAS_ACCOUNT_NUMBER;
const BUILDING_NUMBER = process.env.GAS_BUILDING_NUMBER;
const OWNER_NAME = process.env.GAS_OWNER_NAME;
const CAPTCHA_API_KEY = process.env.GAS_CAPTCHA_API_KEY;

const NEW_VALUE = process.argv[2];

const METER_PAGE_URL = `${BASE_URL}/gas-meter`;
const API_BASE_URL = `${BASE_URL}/api/v1`;
const SITE_URL = `${API_BASE_URL}/site`;
const CHECK_URL = `${API_BASE_URL}/gas-meter/check`;
const SUBMIT_URL = `${API_BASE_URL}/gas-meter/submit`;
const RECAPTCHA_ACTION = 'gas_meter';

if (!BASE_URL || !ACCOUNT_NUMBER || !BUILDING_NUMBER || !NEW_VALUE || !OWNER_NAME || !CAPTCHA_API_KEY) {
  console.info({ BASE_URL, ACCOUNT_NUMBER, BUILDING_NUMBER, NEW_VALUE, OWNER_NAME, hasCaptchaApiKey: Boolean(CAPTCHA_API_KEY) });
  throw new Error(
    'BASE_URL and ACCOUNT_NUMBER and NEW_VALUE and BUILDING_NUMBER and OWNER_NAME and CAPTCHA_API_KEY required',
  );
}

console.info('───────────────────────────── GAS ─────────────────────────────');
console.info('NODE ENV:', process.env.NODE_ENV);
console.info('NEW VALUE:', NEW_VALUE);

const getSiteConfig = async (session: SanctumSession) => {
  const res = await fetch(SITE_URL, {
    headers: {
      accept: 'application/json, text/plain, */*',
      'x-xsrf-token': session.xsrfToken,
      'x-requested-with': 'XMLHttpRequest',
      cookie: session.cookie,
      referer: METER_PAGE_URL,
    },
  });

  if (!res.ok) {
    throw new Error(`GAS SITE CONFIG ERROR: ${res.status}`);
  }

  const payload = (await res.json()) as { data: GasSiteConfig };

  return payload.data;
};

const getRecaptchaToken = async (siteKey: string | undefined) => {
  if (!siteKey) {
    return;
  }

  return solveRecaptchaV3({
    apiKey: CAPTCHA_API_KEY,
    siteKey,
    pageUrl: METER_PAGE_URL,
    action: RECAPTCHA_ACTION,
  });
};

const checkAddress = async (
  session: SanctumSession,
  personal_id: string,
  building: string,
  recaptchaToken: string | undefined,
) => {
  const body = JSON.stringify({
    personal_id,
    building,
    ...(recaptchaToken ? { recaptcha_token: recaptchaToken } : {}),
  });

  const res = await fetch(CHECK_URL, {
    method: 'POST',
    headers: {
      accept: 'application/json, text/plain, */*',
      'content-type': 'application/json',
      'x-xsrf-token': session.xsrfToken,
      'x-requested-with': 'XMLHttpRequest',
      cookie: session.cookie,
      referer: METER_PAGE_URL,
    },
    body,
  });

  if (!res.ok) {
    throw new Error(`GAS CHECK ADDRESS ERROR: ${res.status}`);
  }

  const payload = (await res.json()) as { data: GasAddress };

  return payload.data;
};

const sendValue = async (
  session: SanctumSession,
  newValue: string,
  personal_id: string,
  recaptchaToken: string | undefined,
) => {
  const body = JSON.stringify({
    meter_value: newValue,
    personal_id,
    ...(recaptchaToken ? { recaptcha_token: recaptchaToken } : {}),
  });

  const request = await fetch(SUBMIT_URL, {
    method: 'POST',
    headers: {
      accept: 'application/json, text/plain, */*',
      'content-type': 'application/json',
      'x-xsrf-token': session.xsrfToken,
      'x-requested-with': 'XMLHttpRequest',
      cookie: session.cookie,
      referer: METER_PAGE_URL,
    },
    body,
  });

  if (!request.ok) {
    throw new Error(`Send value error, status: ${request.status}`);
  }

  console.log('GAS SAVE STATUS', request.ok, request.status);
  console.log('GAS SAVE CONTENT-TYPE:', request.headers.get('content-type'));

  const response = await request.text();

  console.log('GAS SAVE RESPONSE:', response);
};

(async () => {
  const session = await getSanctumSession(BASE_URL);

  console.log('GAS SESSION:', session);

  const siteConfig = await getSiteConfig(session);

  console.log('GAS SITE CONFIG:', siteConfig);

  const checkToken = await getRecaptchaToken(siteConfig.recaptcha_site_key);

  const address = await checkAddress(session, ACCOUNT_NUMBER, BUILDING_NUMBER, checkToken);

  console.log('GAS ADDRESS:', address);

  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  if (address.name !== OWNER_NAME) {
    throw new Error(`GAS: checkAddress failed ${JSON.stringify(address)}`);
  }

  const submitToken = await getRecaptchaToken(siteConfig.recaptcha_site_key);

  await sendValue(session, NEW_VALUE, ACCOUNT_NUMBER, submitToken);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
