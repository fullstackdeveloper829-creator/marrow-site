import http from "k6/http";
import { check, sleep } from "k6";
import { Trend } from "k6/metrics";

// Breaking-point test for marrowlibrary.com.
// Ramps virtual users up in stages until error rate or latency
// crosses the thresholds below, so you can read off where the site
// starts to struggle instead of just pass/fail.
//
// Run:   BASE_URL=https://marrowlibrary.com k6 run load-tests/breaking-point.js
// Safer: run against a staging URL first by changing BASE_URL.

const BASE_URL = __ENV.BASE_URL || "https://marrowlibrary.com";

const pageLatency = new Trend("page_latency");

export const options = {
  scenarios: {
    breaking_point: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "30s", target: 10 },
        { duration: "30s", target: 25 },
        { duration: "30s", target: 50 },
        { duration: "30s", target: 100 },
        { duration: "30s", target: 200 },
        { duration: "30s", target: 400 },
        { duration: "1m", target: 400 }, // hold at peak to confirm stability
        { duration: "20s", target: 0 },  // ramp down
      ],
    },
  },
  thresholds: {
    // Test auto-stops (abortOnFail) if these are breached, so a runaway
    // stage can't keep hammering a site that's already falling over.
    http_req_failed: [{ threshold: "rate<0.05", abortOnFail: true }],
    http_req_duration: [{ threshold: "p(95)<3000", abortOnFail: true }],
  },
};

const PAGES = ["/", "/download", "/privacy", "/terms"];

export default function () {
  // 1. Land on a page, like a real visitor browsing.
  const page = PAGES[Math.floor(Math.random() * PAGES.length)];
  let res = http.get(`${BASE_URL}${page}`, { tags: { name: "page" } });
  pageLatency.add(res.timings.duration);
  check(res, { "page status is 200": (r) => r.status === 200 });
  sleep(Math.random() * 2 + 1); // think time, 1-3s

  // 2. Read-only API check (license validation with a dummy key).
  res = http.get(`${BASE_URL}/api/license/validate?key=LOAD-TEST-INVALID`, {
    tags: { name: "license_validate" },
  });
  check(res, {
    "license validate responds": (r) => r.status === 200 || r.status === 400,
  });
  sleep(Math.random() * 1 + 0.5);

  // 3. Hit the (disabled) checkout redirect — no Stripe call, no side effects.
  res = http.get(`${BASE_URL}/api/checkout`, {
    redirects: 0,
    tags: { name: "checkout_redirect" },
  });
  check(res, { "checkout redirects": (r) => r.status === 302 });

  sleep(Math.random() * 2 + 1);
}
