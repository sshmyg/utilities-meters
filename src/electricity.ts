import { getSession, type GetSessionResult } from './helpers/getSession.ts';
import type { ElectricityAddress } from './types/electricity.ts';

const BASE_URL = process.env.ELECTRICITY_BASE_URL;
const METER_PAGE_URL = `${BASE_URL}/ua/meter`;
const REQUEST_URL = `${BASE_URL}/ua/ajax`;

const ACCOUNT_NUMBER = process.env.ELECTRICITY_ACCOUNT_NUMBER;
const NEW_VALUE = process.argv[2];

if (!BASE_URL || !ACCOUNT_NUMBER || !NEW_VALUE) {
  console.info({ BASE_URL, ACCOUNT_NUMBER, NEW_VALUE });
  throw new Error('BASE_URL and ACCOUNT_NUMBER and NEW_VALUE required');
}

const getElectricityAddress = async (session: GetSessionResult, number: string) => {
  const body = new URLSearchParams();

  body.append('method', 'checkAddress');
  body.append('number', number);

  const res = await fetch(REQUEST_URL, {
    method: 'POST',
    headers: {
      accept: 'application/json, text/javascript, */*; q=0.01',
      'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'x-csrf-token': session.csrfToken,
      'x-requested-with': 'XMLHttpRequest',
      cookie: session.cookie,
      referer: METER_PAGE_URL,
    },
    body,
  });

  if (!res.ok) {
    throw new Error(`ELECTRICITY CHECK ADDRESS ERROR: ${res.status}`);
  }

  return res.json() as Promise<ElectricityAddress>;
};

const sendValue = async (session: GetSessionResult, address: ElectricityAddress, newValue: string) => {
  const data = address.data.map((item) => ({
    ...item,
    value: newValue,
  }));

  const formData = new FormData();
  formData.append('method', 'saveReceptionMeter');
  formData.append('data', JSON.stringify(data));
  formData.append(
    'profile',
    JSON.stringify({
      ...address.profile,
      'block-id': 237,
    }),
  );

  const res = await fetch(REQUEST_URL, {
    method: 'POST',
    headers: {
      'x-csrf-token': session.csrfToken,
      'x-requested-with': 'XMLHttpRequest',
      cookie: session.cookie,
      referer: METER_PAGE_URL,
    },
    body: formData,
  });

  const text = await res.text();

  console.log('ELECTRICITY SAVE STATUS', res.ok, res.status);
  console.log('ELECTRICITY SAVE RESPONSE:', text);
};

try {
  (async () => {
    const session = await getSession(METER_PAGE_URL);

    console.log('ELECTRICITY SESSION:', session);

    const address = await getElectricityAddress(session, ACCOUNT_NUMBER);

    if (!address.result) {
      throw new Error(`GAS: checkAddress failed ${JSON.stringify(address)}`);
    }

    await sendValue(session, address, NEW_VALUE);
  })();
} catch (error) {
  console.error(error);
}
