const CREATE_TASK_URL = 'https://api.capsolver.com/createTask';
const GET_RESULT_URL = 'https://api.capsolver.com/getTaskResult';

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 90000;

interface SolveRecaptchaV3Params {
  apiKey: string;
  siteKey: string;
  pageUrl: string;
  action: string;
}

interface CreateTaskResponse {
  errorId: number;
  errorCode?: string;
  errorDescription?: string;
  taskId?: string;
}

interface GetTaskResultResponse {
  errorId: number;
  errorCode?: string;
  errorDescription?: string;
  status?: 'processing' | 'ready';
  solution?: { gRecaptchaResponse: string };
}

const formatCapSolverError = (result: CreateTaskResponse | GetTaskResultResponse) => {
  const parts = [result.errorCode, result.errorDescription].filter(Boolean);

  return parts.length > 0 ? parts.join(': ') : String(result.errorId);
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const solveRecaptchaV3 = async ({ apiKey, siteKey, pageUrl, action }: SolveRecaptchaV3Params) => {
  const createResponse = await fetch(CREATE_TASK_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      clientKey: apiKey,
      task: {
        type: 'ReCaptchaV3TaskProxyLess',
        websiteURL: pageUrl,
        websiteKey: siteKey,
        pageAction: action,
      },
    }),
  });

  const createResult = (await createResponse.json()) as CreateTaskResponse;

  if (createResult.errorId !== 0 || !createResult.taskId) {
    throw new Error(`CapSolver create task failed: ${formatCapSolverError(createResult)}`);
  }

  const deadline = Date.now() + POLL_TIMEOUT_MS;

  while (Date.now() < deadline) {
    await wait(POLL_INTERVAL_MS);

    const resultResponse = await fetch(GET_RESULT_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ clientKey: apiKey, taskId: createResult.taskId }),
    });

    const result = (await resultResponse.json()) as GetTaskResultResponse;

    if (result.errorId !== 0) {
      throw new Error(`CapSolver get result failed: ${formatCapSolverError(result)}`);
    }

    if (result.status === 'ready' && result.solution) {
      return result.solution.gRecaptchaResponse;
    }
  }

  throw new Error('CapSolver: recaptcha solving timed out');
};
