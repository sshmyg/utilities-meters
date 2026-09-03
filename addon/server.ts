import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';

const PORT = 8099;

type Options = {
  node_env: 'development' | 'production';
  electricity_base_url: string;
  electricity_account_number: string;
  gas_base_url: string;
  gas_account_number: string;
  gas_building_number: string;
  gas_owner_name: string;
  gas_captcha_api_key: string;
};

console.log('Starting Utilities Meters addon...');

const options = (() => {
  try {
    const opts = JSON.parse(readFileSync('/data/options.json', 'utf-8')) as Options;
    console.log('Options loaded successfully');
    return opts;
  } catch (err) {
    console.error('Failed to read /data/options.json:', err);
    process.exit(1);
  }
})();

const server = createServer((req, res) => {
  const groups = req.url?.match(/^\/submit\/(?<meter>electricity|gas)\/(?<value>.+)$/)?.groups;

  if (req.method !== 'POST' || !groups) {
    res.writeHead(404);
    res.end();
    return;
  }

  const { meter, value } = groups as { meter: 'electricity' | 'gas'; value: string };

  const env: NodeJS.ProcessEnv = {
    ...process.env,
    NODE_ENV: options.node_env,
    ...(meter === 'electricity'
      ? {
          ELECTRICITY_BASE_URL: options.electricity_base_url,
          ELECTRICITY_ACCOUNT_NUMBER: options.electricity_account_number,
        }
      : {
          GAS_BASE_URL: options.gas_base_url,
          GAS_ACCOUNT_NUMBER: options.gas_account_number,
          GAS_BUILDING_NUMBER: options.gas_building_number,
          GAS_OWNER_NAME: options.gas_owner_name,
          GAS_CAPTCHA_API_KEY: options.gas_captcha_api_key,
        }),
  };

  const proc = spawn('node', ['--experimental-strip-types', `/app/src/${meter}.ts`, value], {
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  proc.stdout.on('data', (data: Buffer) => process.stdout.write(data));
  proc.stderr.on('data', (data: Buffer) => process.stderr.write(data));

  proc.on('close', (code) => {
    res.writeHead(code === 0 ? 200 : 500);
    res.end(JSON.stringify({ success: code === 0 }));
  });
});

server.listen(PORT, () => {
  console.log(`Utilities meters addon listening on port ${PORT}`);
});
