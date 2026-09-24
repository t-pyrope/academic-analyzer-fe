import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";

type Measurement = {
  analysisId: string;
  openaiCallCount: number;
  approximateBytesSent: number;
  approximateBytesReceived: number;
  analysisSuccess?: boolean;
};

const context = new AsyncLocalStorage<Measurement>();

// Only explicitly constructed metadata reaches the logger.
function log(metadata: object) {
  try {
    console.log(JSON.stringify(metadata));
  } catch {
    // Measurement failures must never change application behavior.
  }
}

export function approximateJsonBytes(value: unknown): number {
  try {
    return Buffer.byteLength(JSON.stringify(value) ?? "", "utf8");
  } catch {
    return 0;
  }
}

function measurement(): Measurement {
  return {
    analysisId: randomUUID(),
    openaiCallCount: 0,
    approximateBytesSent: 0,
    approximateBytesReceived: 0,
  };
}

export async function measureAnalysisRequest(
  handler: (
    measureDocument: <T>(work: () => Promise<T>) => Promise<T>,
  ) => Promise<Response>,
): Promise<Response> {
  const requestId = randomUUID();
  const requestStart = new Date().toISOString();
  const started = performance.now();
  const analyses: Measurement[] = [];
  let httpStatus = 500;
  log({ event: "analysis.request.start", requestId, requestStart });
  try {
    const response = await handler(async (work) => {
      const metrics = measurement();
      analyses.push(metrics);
      return context.run(metrics, async () => {
        log({
          event: "analysis.start",
          requestId,
          analysisId: metrics.analysisId,
        });
        try {
          const result = await work();
          metrics.analysisSuccess = true;
          return result;
        } catch (error) {
          metrics.analysisSuccess = false;
          throw error;
        }
      });
    });
    httpStatus = response.status;
    return response;
  } finally {
    const requestEnd = new Date().toISOString();
    const requestDurationMs = performance.now() - started;
    // Rejected/invalid requests still get a zero-call summary.
    for (const metrics of analyses.length ? analyses : [measurement()]) {
      log({
        event: "analysis.request.end",
        requestId,
        ...metrics,
        requestStart,
        requestEnd,
        requestDurationMs,
        httpStatus,
        success:
          httpStatus >= 200 &&
          httpStatus < 300 &&
          metrics.analysisSuccess !== false,
        callCountUnit: "sdk_operation",
        byteEstimateUnit: "payload_excluding_retries_and_transport_overhead",
      });
    }
  }
}

export async function measureOpenAICall<T>(
  operation: "files.create" | "responses.create",
  approximateBytesSent: number,
  call: () => { withResponse(): Promise<{ data: T; response: Response }> },
): Promise<T> {
  const metrics = context.getStore();
  const callId = randomUUID();
  const callStart = new Date().toISOString();
  const started = performance.now();
  let httpStatus: number | null = null;
  let success = false;
  let approximateBytesReceived = 0;
  if (metrics) {
    metrics.openaiCallCount++;
    metrics.approximateBytesSent += approximateBytesSent;
  }
  log({
    event: "analysis.openai.start",
    analysisId: metrics?.analysisId,
    callId,
    operation,
    callStart,
  });
  try {
    const { data, response } = await call().withResponse();
    httpStatus = response.status;
    approximateBytesReceived = approximateJsonBytes(data);
    success = response.ok;
    return data;
  } catch (error) {
    if (error && typeof error === "object") {
      if ("status" in error && typeof error.status === "number")
        httpStatus = error.status;
      if ("error" in error)
        approximateBytesReceived = approximateJsonBytes(error.error);
    }
    throw error;
  } finally {
    if (metrics) metrics.approximateBytesReceived += approximateBytesReceived;
    log({
      event: "analysis.openai.end",
      analysisId: metrics?.analysisId,
      callId,
      operation,
      callStart,
      callEnd: new Date().toISOString(),
      callDurationMs: performance.now() - started,
      approximateBytesSent,
      approximateBytesReceived,
      httpStatus,
      success,
    });
  }
}
