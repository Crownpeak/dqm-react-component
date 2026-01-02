/// <reference lib="webworker" />

import { WebWorkerMLCEngineHandler } from '@mlc-ai/web-llm';

const handler = new WebWorkerMLCEngineHandler();

// Route all messages to the handler.
self.onmessage = (event) => {
  handler.onmessage(event);
};

