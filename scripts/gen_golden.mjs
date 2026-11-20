// Records hook outputs into test/golden.json for `new-api plugin test --fixture`.
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
// Usage: node scripts/gen_golden.mjs [repo]  (default: the current directory)
const repo = resolve(process.argv[2] || ".");
const p = await import(pathToFileURL(repo + "/plugin.js").href);
const BASE = "https://dashscope.aliyuncs.com";
const cases = [];
const drv = (requestBody, extra) => Object.assign({
  requestBody, requestHeaders: { "Content-Type": "application/json", Accept: "" }, model: requestBody.model, upstreamModel: requestBody.model,
  baseUrl: BASE, apiKey: "test-key", authHeader: "Bearer test-key", upstream: { kind: "vendor" }, config: {}, publicTaskId: "task_public",
}, extra || {});
function add(name, hook, args) {
  const result = p[hook](...JSON.parse(JSON.stringify(args)));
  cases.push({ name, hook, args, expected: JSON.parse(JSON.stringify(result === undefined ? null : result)) });
}
function addError(name, hook, args) {
  try {
    p[hook](...JSON.parse(JSON.stringify(args)));
  } catch (e) {
    cases.push({ name, hook, args, expectedError: e.message.slice(0, 60) });
    return;
  }
  throw new Error("expected an error: " + name);
}
const img = { model: "wan2.7-image", input: { messages: [{ role: "user", content: [{ text: "a cat" }] }] }, parameters: { n: 1, size: "1024x1024" } };
add("wan2.7 image request", "buildSubmitRequest", [drv(img)]);
const q3 = { model: "qwen-image-3.0-pro", input: { messages: [{ role: "user", content: [{ image: "https://x/a.png" }, { text: "blue" }] }] }, parameters: { size: "1024*1024" } };
add("qwen-image-3.0 reservation", "extractUsage", [drv(q3)]);
add("qwen-image-3.0 mapped alias request", "buildSubmitRequest", [drv(Object.assign({}, q3, { model: "my-image" }), { model: "my-image", upstreamModel: "qwen-image-3.0-pro" })]);
const imageReply = { request_id: "r1", output: { choices: [{ message: { content: [{ image: "https://oss.example/a.png" }] } }] }, usage: { image_count: 1 } };
add("image reply completes immediately", "parseSubmitResponse", [drv(img), { statusCode: 200, headers: {}, body: imageReply }]);
add("image settles on usage", "extractUsageOnComplete", [{ model: "wan2.7-image", upstreamModel: "wan2.7-image" }, { status: "SUCCESS" }, imageReply]);
addError("image n over the model limit", "buildSubmitRequest", [drv(Object.assign({}, img, { parameters: { n: 5 } }))]);
const wan = { model: "wan3.0-video", input: { prompt: "a fox" }, parameters: { duration: 2, resolution: "480P", ratio: "16:9" } };
add("wan3.0 video request", "buildSubmitRequest", [drv(wan)]);
add("wan3.0 video reservation", "extractUsage", [drv(wan)]);
add("wan3.0 smart duration reserves 30s", "extractUsage", [drv(Object.assign({}, wan, { parameters: { duration: -1 } }))]);
const i2v = { model: "happyhorse-1.1-i2v", input: { prompt: "run" }, parameters: { resolution: "720P" }, images: ["https://x/a.png"] };
add("happyhorse i2v request", "buildSubmitRequest", [drv(i2v)]);
addError("happyhorse t2v duration limit", "buildSubmitRequest", [drv({ model: "happyhorse-1.1-t2v", input: { prompt: "x" }, parameters: { duration: 20 } })]);
add("video submit reply", "parseSubmitResponse", [drv(wan), { statusCode: 200, headers: {}, body: { request_id: "r", output: { task_id: "dash-1", task_status: "PENDING" } } }]);
const q = { taskId: "dash-1", baseUrl: BASE, apiKey: "test-key", model: "wan3.0-video", upstreamModel: "wan3.0-video" };
add("task query", "buildQueryRequest", [q]);
const done = { output: { task_status: "SUCCEEDED", video_url: "https://oss.example/v.mp4" }, usage: { input_video_duration: 0, output_video_duration: 2, SR: 480 } };
add("task running", "parseTaskResult", [q, { output: { task_status: "RUNNING" } }, { status: 200, headers: {} }]);
add("task succeeded", "parseTaskResult", [q, done, { status: 200, headers: {} }]);
add("task failed", "parseTaskResult", [q, { output: { task_status: "FAILED", code: "InternalError", message: "boom" } }, { status: 200, headers: {} }]);
add("wan3.0 settles input plus output seconds", "extractUsageOnComplete", [q, { status: "SUCCESS" }, done]);
add("video artifact", "listArtifacts", [{ status: "SUCCESS", data: done }]);
add("artifact falls back to the stored link", "buildContentRequest", [{ artifactKey: "video", baseUrl: BASE, apiKey: "k", data: done, clientRequest: { method: "GET" } }]);
const sctx = { baseUrl: BASE, path: "/v1/audio/speech", config: { defaultVoice: "longanhuan_v3.6" } };
add("speech request", "convertRequest", [sctx, { model: "qwen-audio-3.0-tts-plus", stream: false, body: { model: "qwen-audio-3.0-tts-plus", input: "你好", voice: "alloy" } }]);
const st = { kind: "speech", format: "mp3", clientStream: false, chunks: 0, characters: 0 };
add("speech audio chunk", "convertStreamEvent", [Object.assign({ state: st }, sctx), { data: JSON.stringify({ output: { audio: { data: "SUQz" } }, usage: { characters: 4 } }) }]);
add("speech without audio fails", "convertStreamEvent", [Object.assign({ state: st }, sctx), { done: true }]);
add("speech JSON reply is refused", "convertResponse", [Object.assign({ state: st }, sctx), { status: 200, headers: {}, body: JSON.stringify({ output: { audio: { url: "https://oss/x" } } }) }]);
const actx = { baseUrl: BASE, path: "/v1/audio/transcriptions", config: {} };
add("transcription request", "convertRequest", [actx, { model: "qwen-audio-3.0-asr-flash", stream: false, form: { fields: { model: ["qwen-audio-3.0-asr-flash"], language: ["zh"] }, files: [{ field: "file", filename: "a.mp3", contentType: "audio/mpeg", size: 9 }] } }]);
add("transcription reply", "convertResponse", [Object.assign({ state: { kind: "transcription", responseFormat: "json" } }, actx), { status: 200, headers: {}, body: JSON.stringify({ output: { choices: [{ message: { content: [{ text: "你好" }] } }] }, usage: { duration: 1.4 } }) }]);
add("an empty key is refused", "checkKey", [{ baseUrl: "https://dashscope.aliyuncs.com", config: {} }, " "]);
add("a Bailian key on the Beijing host", "checkKey", [{ baseUrl: "https://dashscope.aliyuncs.com", config: {} }, "sk-x"]);
// 1.4.0: OpenAI-compatible relay upstream.
const RELAY = "https://relay.example.com";
const rcfg = { upstreamType: "openai" };
const rdrv = (requestBody, extra) => drv(requestBody, Object.assign({ baseUrl: RELAY, apiKey: "relay-key", config: rcfg }, extra || {}));
add("Bailian chat keeps its route path", "prepareRequest", [{ baseUrl: BASE, path: "/v1/chat/completions", config: {} }, { path: "/v1/chat/completions", upstreamPath: "/compatible-mode/v1/chat/completions", model: "qwen-plus", stream: false, body: { model: "qwen-plus" }, headers: {} }]);
add("relay chat goes to /v1/chat/completions", "prepareRequest", [{ baseUrl: RELAY, path: "/v1/chat/completions", config: rcfg }, { path: "/v1/chat/completions", upstreamPath: "/compatible-mode/v1/chat/completions", model: "qwen-plus", stream: true, body: { model: "qwen-plus", stream: true }, headers: {} }]);
add("relay Claude messages go to /v1/messages", "prepareRequest", [{ baseUrl: RELAY, path: "/v1/messages", config: rcfg }, { path: "/v1/messages", upstreamPath: "/apps/anthropic/v1/messages", model: "qwen-plus", stream: false, body: { model: "qwen-plus" }, headers: {} }]);
const rimg = { model: "wan2.7-image", input: { messages: [{ role: "user", content: [{ text: "a cat" }] }] }, parameters: { n: 2, size: "1024*1024" } };
add("relay image generation request", "buildSubmitRequest", [rdrv(rimg)]);
add("relay image reservation", "extractUsage", [rdrv(rimg)]);
add("relay image reply completes immediately", "parseSubmitResponse", [rdrv(rimg), { statusCode: 200, headers: {}, body: { created: 1, data: [{ url: "https://cdn.relay.example/a.png" }, { b64_json: "iVBORw0KGgo=" }] } }]);
addError("relay refuses video", "buildSubmitRequest", [rdrv(wan)]);
addError("relay refuses input images", "buildSubmitRequest", [rdrv({ model: "wan2.7-image", input: { messages: [{ role: "user", content: [{ image: "https://x/a.png" }, { text: "x" }] }] }, parameters: {} })]);
const rsctx = { baseUrl: RELAY, path: "/v1/audio/speech", config: rcfg };
add("relay speech request", "convertRequest", [rsctx, { model: "qwen-audio-3.0-tts-plus", stream: false, body: { model: "my-tts", input: "你好", voice: "alloy" } }]);
add("relay speech error", "convertResponse", [Object.assign({ state: { kind: "speech", relay: true } }, rsctx), { status: 429, headers: {}, body: JSON.stringify({ error: { message: "slow down", code: "rate_limit" } }) }]);
const ractx = { baseUrl: RELAY, path: "/v1/audio/transcriptions", config: rcfg };
add("relay transcription request", "convertRequest", [ractx, { model: "qwen-audio-3.0-asr-flash", stream: false, form: { fields: { model: ["x"], response_format: ["verbose_json"] }, files: [{ field: "file", filename: "a.mp3", contentType: "audio/mpeg", size: 9 }] } }]);
add("relay transcription bills seconds", "convertResponse", [Object.assign({ state: { kind: "transcription", relay: true, responseFormat: "verbose_json" } }, ractx), { status: 200, headers: {}, body: JSON.stringify({ text: "你好", duration: 2.2 }) }]);
const rmctx = { baseUrl: RELAY, path: "/v1/models", config: rcfg };
add("relay model list chains to /v1/models", "convertResponse", [Object.assign({ state: null }, rmctx), { status: 404, headers: {}, body: "" }]);
add("relay model list as the relay returns it", "convertResponse", [Object.assign({ state: { kind: "models", relay: true, ids: [], pages: 0 } }, rmctx), { status: 200, headers: {}, body: JSON.stringify({ data: [{ id: "gpt-5.5" }, { id: "wan3.0-video" }] }) }]);
add("relay key check refuses a bare Bailian host", "checkKey", [{ baseUrl: "https://dashscope.aliyuncs.com", config: rcfg }, "relay-key"]);
add("relay key check accepts the relay", "checkKey", [{ baseUrl: RELAY, config: rcfg }, "relay-key"]);
// 1.1.0: pay-as-you-go image and video families.
const PAYG = "https://dashscope.aliyuncs.com";
const pdrv = (requestBody, extra) => drv(requestBody, Object.assign({ baseUrl: PAYG }, extra || {}));
const msg = (text, images) => ({ messages: [{ role: "user", content: (images || []).map((image) => ({ image })).concat([{ text }]) }] });
const zimg = { model: "z-image-turbo", input: msg("a cat"), parameters: { size: "1024x1536" } };
add("z-image request sends prompt_extend and no n", "buildSubmitRequest", [pdrv(zimg)]);
add("z-image reservation prices prompt rewriting", "extractUsage", [pdrv(Object.assign({}, zimg, { parameters: { prompt_extend: true } }))]);
add("qwen-image-2.1-pro request with three images", "buildSubmitRequest", [pdrv({ model: "qwen-image-2.1-pro", input: msg("merge", ["https://x/1.png", "https://x/2.png", "https://x/3.png"]), parameters: { prompt_extend_mode: "direct" } })]);
add("qwen-image-3.0 reservation", "extractUsage", [pdrv({ model: "qwen-image-3.0", input: msg("blue", ["https://x/a.png"]), parameters: { size: "1024*1024" } })]);
add("wan2.6-image edit request", "buildSubmitRequest", [pdrv({ model: "wan2.6-image", input: msg("hat", ["https://x/a.png"]), parameters: { size: "1K" } })]);
addError("wan2.6-image without a reference image", "buildSubmitRequest", [pdrv({ model: "wan2.6-image", input: msg("hat"), parameters: {} })]);
add("wan2.6-t2i async image-generation request", "buildSubmitRequest", [pdrv({ model: "wan2.6-t2i", mode: "async", input: msg("a cat"), parameters: { size: "1280*1280" } })]);
const t2i25 = { model: "wan2.5-t2i-preview", input: msg("a cat"), parameters: { negative_prompt: "dogs", size: "1280*1280", prompt_extend: false } };
add("wan2.5-t2i-preview text2image request", "buildSubmitRequest", [pdrv(t2i25)]);
const i2i25 = { model: "wan2.5-i2i-preview", input: msg("watercolor", ["https://x/a.png"]), parameters: {} };
add("wan2.5-i2i-preview image2image request", "buildSubmitRequest", [pdrv(i2i25)]);
addError("wan2.5-i2i-preview without an image", "buildSubmitRequest", [pdrv({ model: "wan2.5-i2i-preview", input: msg("x"), parameters: {} })]);
add("async image submit reply", "parseSubmitResponse", [pdrv(i2i25), { statusCode: 200, headers: {}, body: { request_id: "r", output: { task_id: "img-1", task_status: "PENDING" } } }]);
const iq = { taskId: "img-1", baseUrl: PAYG, apiKey: "test-key", model: "wan2.5-i2i-preview", upstreamModel: "wan2.5-i2i-preview" };
const imgDone = { output: { task_status: "SUCCEEDED", results: [{ url: "https://oss.example/1.png" }] }, usage: { image_count: 1 } };
add("async image task succeeded", "parseTaskResult", [iq, imgDone, { status: 200, headers: {} }]);
add("async image task settles", "extractUsageOnComplete", [iq, { status: "SUCCESS" }, imgDone]);
add("wan2.7-t2v request", "buildSubmitRequest", [pdrv({ model: "wan2.7-t2v", input: { prompt: "a fox", audio_url: "https://x/a.mp3" }, parameters: { resolution: "720P", duration: 2 } })]);
add("wan2.7-i2v request with frames and audio", "buildSubmitRequest", [pdrv({ model: "wan2.7-i2v", input: { prompt: "run", audio_url: "https://x/a.mp3" }, parameters: { resolution: "720P" }, images: ["https://x/1.png", "https://x/2.png"] })]);
add("wan2.6-t2v sends a pixel size", "buildSubmitRequest", [pdrv({ model: "wan2.6-t2v", input: { prompt: "a fox" }, parameters: { resolution: "720P", ratio: "4:3", duration: 2, shot_type: "multi" } })]);
add("wan2.5-t2v-preview reservation from a native size", "extractUsage", [pdrv({ model: "wan2.5-t2v-preview", input: { prompt: "x" }, parameters: { size: "832*480", duration: 5 } })]);
const flash = { model: "wan2.6-i2v-flash", input: { prompt: "run" }, parameters: { resolution: "720P", duration: 2, audio: false }, images: ["https://x/a.png"] };
add("wan2.6-i2v-flash request", "buildSubmitRequest", [pdrv(flash)]);
add("wan2.6-i2v-flash reservation prices audio", "extractUsage", [pdrv(flash)]);
addError("wan2.5-i2v-preview duration", "buildSubmitRequest", [pdrv({ model: "wan2.5-i2v-preview", input: { img_url: "https://x/a.png" }, parameters: { duration: 3 } })]);
add("wan2.6-i2v-flash settles audio", "extractUsageOnComplete", [{ model: "wan2.6-i2v-flash", upstreamModel: "wan2.6-i2v-flash" }, { status: "SUCCESS" }, { output: {}, usage: { duration: 2, SR: 720, audio: false } }]);
add("wan2.5-t2v-preview settles video_duration", "extractUsageOnComplete", [{ model: "wan2.5-t2v-preview", upstreamModel: "wan2.5-t2v-preview" }, { status: "SUCCESS" }, { output: {}, usage: { video_duration: 5, video_ratio: "832*480" } }]);
add("pay-as-you-go model list adds unlisted task models", "convertResponse", [{ baseUrl: PAYG, path: "/v1/models", config: {}, state: null }, { status: 200, headers: {}, body: JSON.stringify({ data: [{ id: "qwen3.8-max" }, { id: "z-image-turbo" }], has_more: false }) }]);
// Through another New API gateway (type-60 channel): the middle gateway's native routes under the plugin key, Bearer token.
const GW = "http://middle.example:3000";
const gw = (requestBody) => drv(requestBody, { baseUrl: GW, apiKey: "sk-gateway", authHeader: "Bearer sk-gateway", upstream: { kind: "new_api" } });
add("new_api: image request goes to the middle gateway", "buildSubmitRequest", [gw(img)]);
add("new_api: video request goes to the middle gateway", "buildSubmitRequest", [gw(wan)]);
add("new_api: legacy image task request", "buildSubmitRequest", [gw({ model: "wan2.5-t2i-preview", input: msg("x"), parameters: {} })]);
const gq = { taskId: "task_middle", baseUrl: GW, apiKey: "sk-gateway", authHeader: "Bearer sk-gateway", upstream: { kind: "new_api" }, model: "wan3.0-video", upstreamModel: "wan3.0-video" };
add("new_api: query on the middle gateway's task route", "buildQueryRequest", [gq]);
const middleDone = { request_id: "r1", output: { task_id: "task_middle", task_status: "SUCCEEDED", video_url: GW + "/v1/videos/task_middle/content?sig=1" }, usage: { output_video_duration: 4, input_video_duration: 0, SR: 480, duration: 4 } };
add("new_api: middle gateway task reply succeeds", "parseTaskResult", [gq, middleDone, { status: 200, headers: {} }]);
add("new_api: middle gateway task reply settles", "extractUsageOnComplete", [gq, { status: "SUCCESS" }, middleDone]);
writeFileSync(repo + "/test/golden.json", JSON.stringify({ unixNow: 1794880000, cases }, null, 2) + "\n");
console.log("cases:", cases.length);
