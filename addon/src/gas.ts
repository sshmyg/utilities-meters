import { getSession, type GetSessionResult } from './helpers/getSession.ts';
import type { GasAddress } from './types/gas.ts';

const BASE_URL = process.env.GAS_BASE_URL;
const ACCOUNT_NUMBER = process.env.GAS_ACCOUNT_NUMBER;
const BUILDING_NUMBER = process.env.GAS_BUILDING_NUMBER;
const OWNER_NAME = process.env.GAS_OWNER_NAME;

const NEW_VALUE = process.argv[2];

const METER_PAGE_URL = `${BASE_URL}/gas-meter`;
const CHECK_URL = `${BASE_URL}/gas-meter/check`;
const SUBMIT_URL = `${BASE_URL}/gas-meter/submit`;

if (!BASE_URL || !ACCOUNT_NUMBER || !BUILDING_NUMBER || !NEW_VALUE || !OWNER_NAME) {
  console.info({ BASE_URL, ACCOUNT_NUMBER, BUILDING_NUMBER, NEW_VALUE, OWNER_NAME });
  throw new Error('BASE_URL and ACCOUNT_NUMBER and NEW_VALUE and BUILDING_NUMBER and OWNER_NAME required');
}

console.info('NODE ENV:', process.env.NODE_ENV);
console.info('NEW VALUE:', NEW_VALUE);

const checkAddress = async (session: GetSessionResult, personal_id: string, building: string) => {
  const body = JSON.stringify({
    personal_id,
    building,
  });

  const res = await fetch(CHECK_URL, {
    method: 'POST',
    headers: {
      accept: 'application/json, text/plain, */*',
      'content-type': 'application/json',
      'x-csrf-token': session.csrfToken,
      'x-requested-with': 'XMLHttpRequest',
      cookie: session.cookie,
      referer: METER_PAGE_URL,
    },
    body,
  });

  if (!res.ok) {
    throw new Error(`GAS CHECK ADDRESS ERROR: ${res.status}`);
  }

  return res.json() as Promise<GasAddress>;
};

const sendValue = async (session: GetSessionResult, newValue: string, personal_id: string) => {
  const body = JSON.stringify({
    meter_value: newValue,
    personal_id,
  });

  const request = await fetch(SUBMIT_URL, {
    method: 'POST',
    headers: {
      accept: 'application/json, text/plain, */*',
      'content-type': 'application/json',
      'x-csrf-token': session.csrfToken,
      'x-requested-with': 'XMLHttpRequest',
      cookie: session.cookie,
      referer: METER_PAGE_URL,
    },
    body,
  });

  if (!request.ok) {
    throw new Error(`Send value error, status: ${request.status}`);
  }

  const response = await request.json();

  console.log('GAS SAVE RESPONSE:', response);
};

try {
  (async () => {
    const session = await getSession(METER_PAGE_URL);

    console.log('GAS SESSION:', session);

    const address = await checkAddress(session, ACCOUNT_NUMBER, BUILDING_NUMBER);

    console.log('GAS ADDRESS:', address);

    if (process.env.NODE_ENV !== 'production') {
      return;
    }

    if (address.name !== OWNER_NAME) {
      throw new Error(`GAS: checkAddress failed ${JSON.stringify(address)}`);
    }

    await sendValue(session, NEW_VALUE, ACCOUNT_NUMBER);
  })();
} catch (error) {
  console.error(error);
}
