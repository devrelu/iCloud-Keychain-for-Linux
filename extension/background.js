const VAULT_API_URL = "http://127.0.0.1:8765/v1/request";

async function vaultRequest(payload) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(VAULT_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: controller.signal,
    });
    const body = await response.json();
    return response.ok ? body : { ok: false, error: body.error || `HTTP ${response.status}` };
  } catch (e) {
    return { ok: false, error: e.name === "AbortError" ? "vault service timed out" : String(e) };
  } finally {
    clearTimeout(timeout);
  }
}

const FORWARDED = new Set(["ping", "match", "totp"]);

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message && FORWARDED.has(message.cmd)) {
    vaultRequest(message).then(sendResponse);
    return true; // async
  }
  sendResponse({ ok: false, error: "unknown message" });
  return false;
});
