// src/mocks.js
// 1. Import mocking utils.
import { setupWorker, rest } from "msw";

// 2. Define request handlers and response resolvers.
const worker = setupWorker(
  rest.get("https://cloudflare-ipfs.com/ipfs(/*)", (req, res, ctx) => {
    return res(
      ctx.delay(1500),
      ctx.status(202, "Mocked status"),
      ctx.json({
        data: {
          message: "Mocked response JSON body",
          timestamp: "2021-07-27T18:38:55.028Z",
          sender: "5EFR4EEtvCA8EW3X87CZrUx1Sncr7tpVrJHjWmqRbarTkF61",
          subject: "test subject",
        },
      })
    );
  })
);

// 3. Start the Service Worker.
worker.start();
