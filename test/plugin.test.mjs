// Runs the hooks the way new-api calls them: node --test test/
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const plugin = await import("../plugin.js");
const {
  meta, PLUGIN_KEY, MODEL_IDS, DEFAULT_MODEL_IDS, TEXT_MODELS, EMBEDDING_MODELS, IMAGE_MODELS, VIDEO_MODELS, TTS_MODELS, ASR_MODELS,
  buildSubmitRequest, parseSubmitResponse, extractUsage, extractUsageOnSubmit, extractUsageOnComplete, buildQueryRequest,
  parseTaskResult, listArtifacts, buildContentRequest, native, protocols, convertRequest, convertResponse, convertStreamEvent,
  checkKey, videoSize, modelListReply, servedModel, prepareRequest, upstreamType, relayTranscriptionReply,
} = plugin;

function header(headers, name) {
  const key = Object.keys(headers).find((k) => k.toLowerCase() === name.toLowerCase());
  return key === undefined ? undefined : headers[key];
}

const SOURCE = readFileSync(new URL("../plugin.js", import.meta.url), "utf8");
const BASE = "https://dashscope.aliyuncs.com";

function deepFreeze(value) {
  if (value && typeof value === "object") {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

function driver(requestBody, extra) {
  return deepFreeze(Object.assign({
    requestBody: requestBody,
    requestHeaders: { "Content-Type": "application/json", Accept: "" },
    model: requestBody.model,
    upstreamModel: requestBody.model,
    baseUrl: BASE,
    apiKey: "test-key",
    authHeader: "Bearer test-key",
    upstream: { kind: "vendor" },
    config: {},
    publicTaskId: "task_public",
  }, extra || {}));
}

function imageDecode(body, operation) {
  return protocols.openai_image.decodeRequest(deepFreeze({ model: body.model, operation: operation || "generate", body: { kind: "json", value: body } }));
}

function videoDecode(body, model) {
  return protocols.openai_video.decodeRequest(deepFreeze({ model: model || body.model, body: { kind: "json", value: body } }));
}

const TASK_MODELS = Object.keys(IMAGE_MODELS).concat(Object.keys(VIDEO_MODELS));

// --- manifest ---------------------------------------------------------------

test("meta is a plain JSON literal the marketplace can read", () => {
  const block = SOURCE.match(/export const meta = (\{[\s\S]*?\n\});/);
  assert.ok(block, "meta block found");
  assert.deepEqual(JSON.parse(block[1]), meta);
});

test("the source names meta only in its own declaration", () => {
  const code = SOURCE.replace(/\/\/[^\n]*\n/g, "\n");
  const uses = code.match(/\bmeta\b/g) || [];
  assert.equal(uses.length, 1);
});

test("manifest identity and hosts", () => {
  assert.equal(meta.apiVersion, 1);
  assert.equal(meta.key, PLUGIN_KEY);
  assert.match(meta.key, /^[a-z0-9-]+_bailian$/);
  assert.ok(meta.key.length <= 30);
  assert.equal(meta.channelTypes, undefined);
  assert.equal(meta.icon, "Bailian.Color");
  assert.equal(meta.name.en, "Alibaba Cloud Bailian");
  assert.equal(meta.author.url, "https://github.com/" + meta.author.name);
  assert.equal(meta.baseUrl, BASE);
  assert.equal(meta.baseUrl, "https://dashscope.aliyuncs.com");
  assert.deepEqual(meta.allowedHosts, ["dashscope-intl.aliyuncs.com"]);
  const changelog = readFileSync(new URL("../CHANGELOG.md", import.meta.url), "utf8");
  assert.match(changelog, new RegExp("version: \"?" + meta.version.replace(/\./g, "\\.") + "\"?"));
  assert.match(changelog, new RegExp("plugin: \"?" + meta.key + "\"?"));
});

test("models match the runtime tables and keep the channel form working", () => {
  assert.ok(meta.models.length > 0);
  assert.deepEqual(meta.models, DEFAULT_MODEL_IDS);
  for (const model of meta.models) assert.ok(MODEL_IDS.includes(model), model);
  // Embedding models are not pre-filled but are still served and fetched.
  for (const model of EMBEDDING_MODELS) {
    assert.ok(!meta.models.includes(model), model);
    assert.ok(MODEL_IDS.includes(model), model);
    assert.equal(servedModel(model), true);
  }
  assert.deepEqual(MODEL_IDS.filter((m) => !meta.models.includes(m)), EMBEDDING_MODELS);
  assert.equal(new Set(meta.models).size, meta.models.length);
  for (const model of TEXT_MODELS.concat(EMBEDDING_MODELS, TTS_MODELS, ASR_MODELS)) assert.ok(!TASK_MODELS.includes(model));
  assert.ok(!MODEL_IDS.some((m) => m.startsWith("bailian-text-")));
});

test("routes and protocols are scoped to the task models", () => {
  const image = Object.keys(IMAGE_MODELS).sort();
  const video = Object.keys(VIDEO_MODELS).sort();
  const family = (f) => Object.keys(IMAGE_MODELS).filter((m) => f.includes(IMAGE_MODELS[m].family)).sort();
  assert.deepEqual(meta.protocols.find((p) => p.name === "openai_image").models.slice().sort(), image);
  assert.deepEqual(meta.protocols.find((p) => p.name === "openai_video").models.slice().sort(), video);
  const byPath = Object.fromEntries(meta.routes.map((r) => [r.path, r]));
  const sync = byPath["/api/v1/services/aigc/multimodal-generation/generation"];
  assert.deepEqual(sync.models.slice().sort(), image.filter((m) => !family(["wan25t", "wan25e"]).includes(m)));
  assert.equal(sync.retainResult, false);
  assert.equal(sync.decode, "createImage");
  assert.deepEqual(byPath["/api/v1/services/aigc/image-generation/generation"].models.slice().sort(), family(["wan26i", "wan26t"]));
  assert.deepEqual(byPath["/api/v1/services/aigc/text2image/image-synthesis"].models, ["wan2.5-t2i-preview"]);
  assert.deepEqual(byPath["/api/v1/services/aigc/image2image/image-synthesis"].models, ["wan2.5-i2i-preview"]);
  assert.deepEqual(byPath["/api/v1/services/aigc/video-generation/video-synthesis"].models.slice().sort(), video);
  assert.equal(byPath["/api/v1/tasks/:task_id"].type, "query");
  for (const route of meta.routes) {
    assert.ok(!route.path.startsWith("/ali/"));
    if (route.decode) assert.equal(typeof native[route.decode], "function", route.decode);
    if (route.render) assert.equal(typeof native[route.render], "function", route.render);
  }
});

test("no retired or region-only models are declared", () => {
  for (const model of meta.models) {
    assert.doesNotMatch(model, /^(wan2\.[0-2]|wanx|qwen-image(-plus|-max|-edit)?(-\d{4}-\d{2}-\d{2})?$)|-us$/, model);
  }
});

test("usage profiles cover every task model once with complete examples", () => {
  const seen = [];
  for (const profile of meta.usageProfiles) {
    for (const model of profile.models) {
      assert.ok(TASK_MODELS.includes(model), model);
      assert.ok(!seen.includes(model), "duplicate " + model);
      seen.push(model);
    }
    const keys = Object.keys(profile.schema).sort();
    assert.ok(profile.examples.length > 0);
    for (const example of profile.examples) {
      assert.deepEqual(Object.keys(example.facts).sort(), keys);
      for (const key of keys) {
        const field = profile.schema[key];
        if (field.enum) assert.ok(field.enum.includes(example.facts[key]));
        else assert.equal(typeof example.facts[key], field.type);
      }
    }
  }
  assert.deepEqual(seen.sort(), TASK_MODELS.slice().sort());
  assert.equal(meta.usageSchema, undefined);
});

test("relay routes: text passthrough, speech and transcription converted", () => {
  const byPath = Object.fromEntries(meta.relay.map((r) => [r.incoming_path, r]));
  assert.equal(byPath["/v1/chat/completions"].upstream_path, "/compatible-mode/v1/chat/completions");
  assert.equal(byPath["/v1/responses"].upstream_path, "/compatible-mode/v1/responses");
  assert.equal(byPath["/v1/messages"].upstream_path, "/apps/anthropic/v1/messages");
  assert.equal(byPath["/v1/embeddings"].upstream_path, "/compatible-mode/v1/embeddings");
  for (const path of ["/v1/chat/completions", "/v1/responses", "/v1/messages", "/v1/embeddings"]) {
    assert.equal(byPath[path].converter, undefined, path + " uses the none converter");
    assert.equal(byPath[path].models, undefined);
  }
  assert.equal(byPath["/v1/audio/speech"].converter, "plugin");
  assert.equal(byPath["/v1/audio/transcriptions"].converter, "plugin");
  assert.equal(byPath["/v1/models"].upstream_path, "/compatible-mode/v1/models");
  assert.equal(byPath["/v1/models"].converter, "plugin");
});

// --- images -----------------------------------------------------------------

test("OpenAI image generation becomes a synchronous DashScope request", () => {
  const intent = imageDecode({ model: "wan2.7-image", prompt: "a cat", size: "1024x1024", n: 1, response_format: "url" });
  assert.equal(intent.kind, "submit");
  assert.equal(intent.action, "text_to_image");
  const ctx = driver(intent.requestBody);
  const req = buildSubmitRequest(ctx);
  assert.equal(req.url, BASE + "/api/v1/services/aigc/multimodal-generation/generation");
  assert.equal(req.headers.Authorization, "Bearer test-key");
  assert.equal(req.headers["X-DashScope-Async"], undefined);
  assert.deepEqual(req.body, {
    model: "wan2.7-image",
    input: { messages: [{ role: "user", content: [{ text: "a cat" }] }] },
    parameters: { n: 1, size: "1024*1024" },
  });
  assert.deepEqual(extractUsage(ctx), { image_count: 1 });
  assert.deepEqual(extractUsage(Object.assign({}, ctx, { usagePurpose: "billing_ratios" })), { image_count: 1 });
});

test("the channel base URL decides the host", () => {
  const intent = imageDecode({ model: "wan2.7-image", prompt: "a cat" });
  const req = buildSubmitRequest(driver(intent.requestBody, { baseUrl: "https://dashscope.aliyuncs.com/" }));
  assert.equal(req.url, "https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation");
  assert.deepEqual(req.body.parameters, { n: 1 }, "n is sent explicitly");
});

test("a mapped alias uses the upstream model profile", () => {
  const intent = imageDecode({ model: "my-image", prompt: "a cat" });
  const req = buildSubmitRequest(driver(intent.requestBody, { model: "my-image", upstreamModel: "qwen-image-3.0-pro" }));
  assert.equal(req.body.model, "qwen-image-3.0-pro");
});

test("image edits with URLs and uploads", () => {
  const intent = imageDecode({ model: "qwen-image-3.0-pro", prompt: "make it blue", image: "https://example.com/a.png", size: "2048*2048" }, "edit");
  assert.equal(intent.action, "image_to_image");
  const ctx = driver(intent.requestBody);
  const req = buildSubmitRequest(ctx);
  assert.deepEqual(req.body.input.messages[0].content, [{ image: "https://example.com/a.png" }, { text: "make it blue" }]);
  assert.deepEqual(extractUsage(ctx), { image_count: 1, output_image_type: "qima_output_2k", input_image_count: 1 });
  const multipart = protocols.openai_image.decodeRequest(deepFreeze({
    model: "wan2.7-image-pro",
    operation: "edit",
    body: { kind: "multipart", fields: { model: ["wan2.7-image-pro"], prompt: ["fix"], n: ["2"] }, files: [{ ref: "request_file:image", field: "image", filename: "a.png", mimeType: "image/PNG", size: 10 }] },
  }));
  assert.deepEqual(multipart.requestBody.input.messages[0].content[0].image, { __fileRef: "request_file:image", encoding: "dataUrl", mimeType: "image/png", maxBytes: 20971520 });
  assert.equal(multipart.requestBody.parameters.n, 2);
  assert.throws(() => imageDecode({ model: "wan2.7-image", prompt: "x" }, "edit"), /image is required/);
});

test("qwen-image-3.0-pro reserves the 1K tier for small sizes", () => {
  const intent = imageDecode({ model: "qwen-image-3.0-pro", prompt: "a cat", size: "1024x1024", n: 2 });
  assert.deepEqual(extractUsage(driver(intent.requestBody)), { image_count: 2, output_image_type: "qima_output_1k", input_image_count: 0 });
  const noSize = imageDecode({ model: "qwen-image-3.0-pro", prompt: "a cat" });
  assert.equal(extractUsage(driver(noSize.requestBody)).output_image_type, "qima_output_2k", "an unspecified size reserves 2K");
});

test("image validation rejects what DashScope would refuse", () => {
  const bad = (body, re) => assert.throws(() => buildSubmitRequest(driver(imageDecode(body).requestBody)), re);
  bad({ model: "wan2.7-image", prompt: "x", n: 5 }, /n must be an integer between 1 and 4/);
  bad({ model: "qwen-image-2.0", prompt: "x", n: 7 }, /between 1 and 6/);
  bad({ model: "qwen-image-2.0", prompt: "x", size: "4K" }, /width\*height/);
  bad({ model: "wan2.7-image", prompt: "x", size: "4K" }, /4K is only supported/);
  bad({ model: "wan2.7-image", prompt: "x", size: "4096*4096" }, /outside/);
  bad({ model: "qwen-image-2.0", prompt: "x", size: "256*256" }, /outside/);
  bad({ model: "qwen-image-2.0", prompt: "x", enable_sequential: true }, /not supported/);
  bad({ model: "wan2.7-image", prompt: "x", watermark: "no" }, /boolean/);
  bad({ model: "qwen-image-2.0", prompt: "x", images: ["https://a/1", "https://a/2", "https://a/3", "https://a/4"] }, /at most 3/);
  assert.throws(() => imageDecode({ model: "wan2.7-image", prompt: "x", quality: "hd" }), /unsupported field: quality/);
  assert.throws(() => imageDecode({ model: "wan2.7-image", prompt: "" }), /prompt is required/);
  assert.throws(() => imageDecode({ model: "wan2.7-image", prompt: "x", stream: true }), /stream/);
  assert.throws(() => imageDecode({ model: "wan2.7-image", prompt: "x", image: "file_123" }), /HTTP/);
  const fourK = buildSubmitRequest(driver(imageDecode({ model: "wan2.7-image-pro", prompt: "x", size: "4k" }).requestBody));
  assert.equal(fourK.body.parameters.size, "4K");
  const sequential = buildSubmitRequest(driver(imageDecode({ model: "wan2.7-image", prompt: "x", n: 12, enable_sequential: true }).requestBody));
  assert.equal(sequential.body.parameters.n, 12);
});

const IMAGE_REPLY = {
  request_id: "req-1",
  output: { choices: [{ finish_reason: "stop", message: { role: "assistant", content: [{ image: "https://dashscope-result.oss.example/a.png?sig=1" }] } }] },
  usage: { image_count: 1, width: 1024, height: 1024 },
};

test("a synchronous image reply completes immediately and settles on usage", () => {
  const intent = imageDecode({ model: "wan2.7-image", prompt: "a cat", n: 2 });
  const ctx = driver(intent.requestBody);
  const parsed = parseSubmitResponse(ctx, deepFreeze({ statusCode: 200, headers: {}, body: IMAGE_REPLY }));
  assert.equal(parsed.taskId, "task_public");
  assert.deepEqual(parsed.immediate, { status: "SUCCESS", progress: "100%", url: "https://dashscope-result.oss.example/a.png?sig=1" });
  const query = deepFreeze({ model: "wan2.7-image", upstreamModel: "wan2.7-image", taskId: "task_public" });
  assert.deepEqual(extractUsageOnComplete(query, parsed.immediate, IMAGE_REPLY), { image_count: 1 });
  assert.equal(extractUsageOnComplete(query, parsed.immediate, null), null);
  assert.deepEqual(extractUsageOnSubmit(ctx, IMAGE_REPLY), { image_count: 1 });
  const rendered = protocols.openai_image.render({}, deepFreeze({ created_at: 1, data: IMAGE_REPLY }));
  assert.deepEqual(rendered, { created: 1, data: [{ url: "https://dashscope-result.oss.example/a.png?sig=1" }] });
});

test("qwen-image-3.0 settles on its tiered usage", () => {
  const body = { output: { choices: [{ message: { content: [{ image: "https://x/1.png" }] } }] }, usage: { output_image_count: 1, output_image_type: "qima_output_1k", input_image_count: 0 } };
  const facts = extractUsageOnComplete(deepFreeze({ model: "qwen-image-3.0-pro" }), {}, deepFreeze(body));
  assert.deepEqual(facts, { image_count: 1, output_image_type: "qima_output_1k", input_image_count: 0 });
});

test("image errors and empty replies throw so the reservation is refunded", () => {
  const ctx = driver(imageDecode({ model: "wan2.7-image", prompt: "a cat" }).requestBody);
  assert.throws(() => parseSubmitResponse(ctx, { statusCode: 200, body: { code: "DataInspectionFailed", message: "bad" } }), /DataInspectionFailed/);
  assert.throws(() => parseSubmitResponse(ctx, { statusCode: 200, body: { output: { choices: [] } } }), /no images/);
  assert.throws(() => extractUsageOnComplete({ model: "wan2.7-image" }, {}, { output: { choices: [{ message: { content: [{ image: "https://x" }] } }] }, usage: { image_count: 0 } }), /invalid/);
});

test("native image route passes the DashScope body through validation", () => {
  const body = { model: "wan2.7-image", input: { messages: [{ role: "user", content: [{ text: "a cat" }] }] }, parameters: { size: "1024*1024" } };
  const intent = native.createImage(deepFreeze({ body: { kind: "json", value: body }, requestHeaders: {} }));
  assert.equal(intent.model, "wan2.7-image");
  const req = buildSubmitRequest(driver(intent.requestBody));
  assert.deepEqual(req.body, { model: "wan2.7-image", input: body.input, parameters: { size: "1024*1024", n: 1 } });
  assert.throws(() => native.createImage({ body: { kind: "json", value: Object.assign({ stream: true }, body) }, requestHeaders: {} }), /unsupported field/);
  assert.throws(() => native.createImage({ body: { kind: "json", value: body }, requestHeaders: { "X-Dashscope-Sse": "enable" } }), /streaming/);
  const shown = native.imageCreated({}, deepFreeze({ task_id: "task_public", data: IMAGE_REPLY }));
  assert.equal(shown.request_id, "task_public");
  assert.equal(shown.output.choices[0].message.content[0].image, IMAGE_REPLY.output.choices[0].message.content[0].image);
});

test("oss resolve header is forwarded only when the client asks", () => {
  const intent = imageDecode({ model: "wan2.7-image", prompt: "a cat", image: "oss://dashscope-instant/a.png" });
  const req = buildSubmitRequest(driver(intent.requestBody, { requestHeaders: { "X-Dashscope-Ossresourceresolve": "enable" } }));
  assert.equal(req.headers["X-DashScope-OssResourceResolve"], "enable");
});

// --- video ------------------------------------------------------------------

test("OpenAI video maps size and seconds onto wan3.0-video", () => {
  const intent = videoDecode({ model: "wan3.0-video", prompt: "a fox", seconds: "4", size: "832x480" });
  assert.equal(intent.action, "text_to_video");
  const ctx = driver(intent.requestBody);
  const req = buildSubmitRequest(ctx);
  assert.equal(req.url, BASE + "/api/v1/services/aigc/video-generation/video-synthesis");
  assert.equal(req.headers["X-DashScope-Async"], "enable");
  assert.deepEqual(req.body, { model: "wan3.0-video", input: { prompt: "a fox" }, parameters: { duration: 4, resolution: "480P", ratio: "16:9" } });
  assert.deepEqual(extractUsage(ctx), { seconds: 4, resolution: "480P" });
  assert.equal(extractUsage(Object.assign({}, ctx, { usagePurpose: "billing_ratios" })), null);
});

test("video defaults are explicit so the reservation matches the render", () => {
  const req = buildSubmitRequest(driver(videoDecode({ model: "happyhorse-1.1-t2v", prompt: "a horse" }).requestBody));
  assert.deepEqual(req.body.parameters, { resolution: "1080P", ratio: "16:9", duration: 5 });
  const wan = buildSubmitRequest(driver(videoDecode({ model: "wan3.0-video", prompt: "x" }).requestBody));
  assert.deepEqual(wan.body.parameters, { resolution: "1080P", ratio: "adaptive", duration: 5 });
});

test("wan3.0 smart duration and reference videos reserve 30 seconds", () => {
  const smart = driver(videoDecode({ model: "wan3.0-video", prompt: "x", seconds: -1, resolution: "720p" }).requestBody);
  assert.deepEqual(extractUsage(smart), { seconds: 30, resolution: "720P" });
  assert.equal(buildSubmitRequest(smart).body.parameters.duration, -1);
  const ref = driver({ model: "wan3.0-video", input: { prompt: "x", media: [{ type: "reference_video", url: "https://x/v.mp4" }] }, parameters: { duration: 5 } });
  assert.equal(extractUsage(ref).seconds, 30);
});

test("images map onto each model's media types", () => {
  const i2v = buildSubmitRequest(driver(videoDecode({ model: "happyhorse-1.1-i2v", prompt: "run", input_reference: "https://x/a.png", resolution: "720P" }).requestBody));
  assert.deepEqual(i2v.body.input, { prompt: "run", media: [{ type: "first_frame", url: "https://x/a.png" }] });
  assert.deepEqual(i2v.body.parameters, { resolution: "720P", duration: 5 }, "i2v takes no ratio");
  assert.equal(i2v.action, "image_to_video");
  const r2v = buildSubmitRequest(driver(videoDecode({ model: "happyhorse-1.1-r2v", prompt: "[Image 1] dances", images: ["https://x/1.png", "https://x/2.png"] }).requestBody));
  assert.deepEqual(r2v.body.input.media.map((m) => m.type), ["reference_image", "reference_image"]);
  const wan = buildSubmitRequest(driver(videoDecode({ model: "wan3.0-video", prompt: "x", images: ["https://x/1.png", "https://x/2.png"] }).requestBody));
  assert.deepEqual(wan.body.input.media.map((m) => m.type), ["first_frame", "last_frame"]);
  const upload = protocols.openai_video.decodeRequest(deepFreeze({
    model: "happyhorse-1.1-i2v",
    body: { kind: "multipart", fields: { model: ["happyhorse-1.1-i2v"], prompt: ["go"], seconds: ["3"] }, files: [{ ref: "request_file:input_reference", field: "input_reference", filename: "a.jpg", mimeType: "image/jpeg", size: 3 }] },
  }));
  const sent = buildSubmitRequest(driver(upload.requestBody));
  assert.deepEqual(sent.body.input.media[0].url, { __fileRef: "request_file:input_reference", encoding: "dataUrl", mimeType: "image/jpeg", maxBytes: 20971520 });
  assert.equal(sent.body.parameters.duration, 3);
});

test("video validation", () => {
  const bad = (body, re) => assert.throws(() => buildSubmitRequest(driver(videoDecode(body).requestBody)), re);
  bad({ model: "happyhorse-1.1-t2v", prompt: "x", seconds: 2 }, /between 3 and 15/);
  bad({ model: "happyhorse-1.1-t2v", prompt: "x", seconds: -1 }, /between 3 and 15/);
  bad({ model: "wan3.0-video", prompt: "x", seconds: 31 }, /-1 or an integer between 2 and 30/);
  bad({ model: "happyhorse-1.1-t2v", prompt: "" }, /prompt is required/);
  bad({ model: "happyhorse-1.1-t2v", prompt: "x", image: "https://x/a.png" }, /text-to-video only/);
  bad({ model: "happyhorse-1.1-i2v", prompt: "x" }, /exactly one first-frame/);
  bad({ model: "happyhorse-1.1-i2v", prompt: "x", images: ["https://x/1", "https://x/2"] }, /unsupported input.media type/);
  bad({ model: "happyhorse-1.1-r2v", prompt: "x" }, /reference images/);
  bad({ model: "happyhorse-1.1-t2v", prompt: "x", resolution: "4K" }, /resolution must be/);
  bad({ model: "happyhorse-1.1-t2v", prompt: "x", ratio: "adaptive" }, /ratio must be/);
  bad({ model: "happyhorse-1.1-i2v", prompt: "x", image: "https://x/a.png", ratio: "16:9" }, /parameters.ratio is not supported/);
  bad({ model: "happyhorse-1.1-t2v", prompt: "x", audio: true }, /parameters.audio is not supported/);
  bad({ model: "wan3.0-video", prompt: "x", watermark: "yes" }, /boolean/);
  bad({ model: "wan3.0-video", media: [{ type: "first_frame", url: "https://x/1" }, { type: "reference_image", url: "https://x/2" }] }, /combination/);
  assert.throws(() => videoDecode({ model: "wan3.0-video", prompt: "x", callback_url: "https://evil" }), /unsupported field: callback_url/);
  assert.throws(() => videoDecode({ model: "wan3.0-video", prompt: "x", size: "999x111" }), /unsupported size/);
  assert.throws(() => videoDecode({ model: "wan3.0-video", prompt: "x", metadata: { model: "other" } }), /metadata.model/);
});

test("size table and free-form sizes", () => {
  assert.deepEqual(videoSize("1280x720"), { resolution: "720P", ratio: "16:9" });
  assert.deepEqual(videoSize("1080x1920"), { resolution: "1080P", ratio: "9:16" });
  assert.deepEqual(videoSize("720p"), { resolution: "720P" });
  assert.deepEqual(videoSize("2520x1080"), { resolution: "1080P", ratio: "21:9" });
});

const SUBMIT_REPLY = { request_id: "r1", output: { task_id: "dash-task-1", task_status: "PENDING" } };
const DONE_REPLY = {
  request_id: "r2",
  output: { task_id: "dash-task-1", task_status: "SUCCEEDED", video_url: "https://dashscope-result.oss.example/v.mp4?sig=old" },
  usage: { input_video_duration: 0, output_video_duration: 4, SR: 480, duration: 4 },
};

test("video task lifecycle", () => {
  const ctx = driver(videoDecode({ model: "wan3.0-video", prompt: "a fox", seconds: 4, resolution: "480P" }).requestBody);
  assert.deepEqual(parseSubmitResponse(ctx, deepFreeze({ statusCode: 200, body: SUBMIT_REPLY })), { taskId: "dash-task-1", taskData: SUBMIT_REPLY });
  assert.throws(() => parseSubmitResponse(ctx, { statusCode: 200, body: { code: "InvalidParameter", message: "bad" } }), /InvalidParameter/);
  assert.throws(() => parseSubmitResponse(ctx, { statusCode: 200, body: { output: {} } }), /task_id is empty/);
  const query = deepFreeze({ taskId: "dash-task-1", baseUrl: BASE, apiKey: "test-key", model: "wan3.0-video", upstreamModel: "wan3.0-video" });
  assert.deepEqual(buildQueryRequest(query), { url: BASE + "/api/v1/tasks/dash-task-1", method: "GET", headers: { Authorization: "Bearer test-key" } });
  assert.deepEqual(parseTaskResult(query, { output: { task_status: "PENDING" } }), { status: "QUEUED" });
  assert.deepEqual(parseTaskResult(query, { output: { task_status: "RUNNING" } }), { status: "IN_PROGRESS" });
  assert.deepEqual(parseTaskResult(query, DONE_REPLY), { status: "SUCCESS", progress: "100%", url: DONE_REPLY.output.video_url });
  assert.equal(parseTaskResult(query, { output: { task_status: "FAILED", code: "InternalError", message: "boom" } }).status, "FAILURE");
  assert.equal(parseTaskResult(query, { output: { task_status: "WEIRD" } }).status, "UNKNOWN");
  assert.equal(parseTaskResult(query, { output: { task_status: "SUCCEEDED" } }).status, "FAILURE");
  assert.deepEqual(extractUsageOnComplete(query, {}, DONE_REPLY), { seconds: 4, resolution: "480P" });
  const horse = deepFreeze({ model: "happyhorse-1.1-t2v" });
  assert.deepEqual(extractUsageOnComplete(horse, {}, { output: {}, usage: { output_video_duration: 5 } }), { seconds: 5 });
  assert.equal(extractUsageOnComplete(query, {}, { output: {}, usage: { output_video_duration: 5 } }), null, "partial wan3 usage keeps the reservation");
  assert.deepEqual(listArtifacts({ status: "SUCCESS", data: DONE_REPLY }), [{ key: "video", type: "video", mimeType: "video/mp4" }]);
  assert.deepEqual(listArtifacts({ status: "IN_PROGRESS", data: DONE_REPLY }), []);
});

test("artifact download re-queries for a fresh signed URL", () => {
  const calls = [];
  globalThis.utils = {
    fetch(req) {
      calls.push(req);
      return { status: 200, headers: {}, body: { output: { task_status: "SUCCEEDED", video_url: "https://dashscope-result.oss.example/v.mp4?sig=new" } } };
    },
  };
  const ctx = deepFreeze({ artifactKey: "video", upstreamTaskId: "dash-task-1", baseUrl: BASE, apiKey: "test-key", data: DONE_REPLY, clientRequest: { method: "GET" } });
  assert.deepEqual(buildContentRequest(ctx), { url: "https://dashscope-result.oss.example/v.mp4?sig=new", method: "GET", credentialless: true });
  assert.deepEqual(calls[0], { url: BASE + "/api/v1/tasks/dash-task-1", method: "GET", headers: { Authorization: "Bearer test-key" } });
  globalThis.utils = { fetch() { throw new Error("network"); } };
  assert.equal(buildContentRequest(ctx).url, DONE_REPLY.output.video_url, "falls back to the stored URL");
  delete globalThis.utils;
  assert.throws(() => buildContentRequest(Object.assign({}, ctx, { artifactKey: "image-1" })), /artifact_not_found/);
});

test("native video routes", () => {
  const body = { model: "happyhorse-1.1-t2v", input: { prompt: "x" }, parameters: { resolution: "480P", duration: 3 } };
  const intent = native.createVideo(deepFreeze({ body: { kind: "json", value: body }, requestHeaders: {} }));
  const req = buildSubmitRequest(driver(intent.requestBody));
  assert.deepEqual(req.body.parameters, { resolution: "480P", duration: 3, ratio: "16:9" });
  assert.deepEqual(native.videoCreated({}, deepFreeze({ task_id: "task_pub", data: SUBMIT_REPLY })), { request_id: "r1", output: { task_id: "task_pub", task_status: "PENDING" } });
  const status = native.taskStatus(deepFreeze({ artifacts: { video: { key: "video", type: "video", url: "https://gw/v" } } }), deepFreeze({ task_id: "task_pub", status: "SUCCESS", data: DONE_REPLY }));
  assert.equal(status.output.task_id, "task_pub");
  assert.equal(status.output.video_url, "https://gw/v");
  const failed = native.taskStatus({}, { task_id: "t", status: "FAILURE", fail_reason: "timeout", data: SUBMIT_REPLY });
  assert.equal(failed.output.task_status, "FAILED");
  const missing = native.error({ params: { task_id: "t" } }, { httpStatus: 404, message: "nf" });
  assert.equal(missing.__body.output.task_status, "UNKNOWN");
});

test("OpenAI video render reports status and vendor errors", () => {
  assert.equal(protocols.openai_video.render({}, { data: { output: { task_status: "RUNNING" } } }).status, "in_progress");
  const failed = protocols.openai_video.render({}, { data: { output: { task_status: "FAILED", code: "X", message: "m" } } });
  assert.deepEqual(failed.error, { code: "X", message: "m" });
});

// --- pay-as-you-go image families -------------------------------------------

const PAYG = "https://dashscope.aliyuncs.com";
const IMG = "https://x/in.png";
const minimalImage = {
  qwen3: { prompt: "a cat" }, qwen21: { prompt: "a cat" }, qwen: { prompt: "a cat" }, zimage: { prompt: "a cat" }, wan27: { prompt: "a cat" },
  wan26i: { prompt: "make it blue", image: IMG }, wan26t: { prompt: "a cat" }, wan25t: { prompt: "a cat" }, wan25e: { prompt: "make it blue", image: IMG },
};
const SERVICE_OF = {
  qwen3: "multimodal-generation/generation", qwen21: "multimodal-generation/generation", qwen: "multimodal-generation/generation",
  zimage: "multimodal-generation/generation", wan27: "multimodal-generation/generation", wan26i: "multimodal-generation/generation",
  wan26t: "multimodal-generation/generation", wan25t: "text2image/image-synthesis", wan25e: "image2image/image-synthesis",
};

function profileFor(model) {
  return meta.usageProfiles.find((p) => p.models.includes(model));
}

function checkFacts(model, facts) {
  const profile = profileFor(model);
  assert.deepEqual(Object.keys(facts).sort(), Object.keys(profile.schema).sort(), model);
  for (const key of Object.keys(facts)) {
    const field = profile.schema[key];
    if (field.enum) assert.ok(field.enum.includes(facts[key]), model + " " + key + "=" + facts[key]);
    else assert.equal(typeof facts[key], field.type, model + " " + key);
  }
}

test("every image model builds a request and a reservation that fits its usage profile", () => {
  for (const model of Object.keys(IMAGE_MODELS)) {
    const family = IMAGE_MODELS[model].family;
    const intent = imageDecode(Object.assign({ model }, minimalImage[family]));
    const ctx = driver(intent.requestBody, { baseUrl: PAYG });
    const req = buildSubmitRequest(ctx);
    assert.equal(req.url, PAYG + "/api/v1/services/aigc/" + SERVICE_OF[family], model);
    const asynchronous = family === "wan25t" || family === "wan25e";
    assert.equal(header(req.headers, "x-dashscope-async"), asynchronous ? "enable" : undefined, model);
    assert.equal(req.body.model, model);
    checkFacts(model, extractUsage(ctx));
  }
});

test("z-image-turbo sends no n and prices prompt rewriting", () => {
  const plain = driver(imageDecode({ model: "z-image-turbo", prompt: "a cat", size: "1024x1536" }).requestBody);
  assert.deepEqual(buildSubmitRequest(plain).body.parameters, { size: "1024*1536", prompt_extend: false });
  assert.deepEqual(extractUsage(plain), { image_count: 1, prompt_extend: false });
  const rewritten = driver(imageDecode({ model: "z-image-turbo", prompt: "a cat", n: 1, prompt_extend: true }).requestBody);
  assert.deepEqual(buildSubmitRequest(rewritten).body.parameters, { prompt_extend: true });
  assert.deepEqual(extractUsage(rewritten), { image_count: 1, prompt_extend: true });
  assert.deepEqual(extractUsage(Object.assign({}, rewritten, { usagePurpose: "billing_ratios" })), { image_count: 1 });
  const bad = (body, re) => assert.throws(() => buildSubmitRequest(driver(imageDecode(body).requestBody)), re);
  bad({ model: "z-image-turbo", prompt: "x", n: 2 }, /n must be 1 for z-image-turbo/);
  bad({ model: "z-image-turbo", prompt: "x", image: IMG }, /only supports text to image/);
  bad({ model: "z-image-turbo", prompt: "x", watermark: true }, /parameters.watermark is not supported/);
  bad({ model: "z-image-turbo", prompt: "x", size: "256*256" }, /outside/);
  const reply = { output: { choices: [{ message: { content: [{ image: "https://x/1.png" }, { text: "rewritten" }] } }] }, usage: { image_count: 1, width: 1024, height: 1536 } };
  assert.deepEqual(extractUsageOnComplete({ model: "z-image-turbo" }, {}, reply), { image_count: 1 });
});

test("qwen-image-3.0 and 2.1 options", () => {
  const q3 = driver(imageDecode({ model: "qwen-image-3.0", prompt: "a cat", image: IMG, size: "1024x1024", prompt_extend_mode: "direct", enable_thinking: false }).requestBody);
  assert.deepEqual(buildSubmitRequest(q3).body.parameters, { n: 1, size: "1024*1024", prompt_extend_mode: "direct", enable_thinking: false });
  assert.deepEqual(extractUsage(q3), { image_count: 1, output_image_type: "qima_output_1k", input_image_count: 1 });
  const ten = Array.from({ length: 10 }, (_, i) => "https://x/" + i + ".png");
  const q21 = buildSubmitRequest(driver(imageDecode({ model: "qwen-image-2.1-pro", prompt: "merge", images: ten }).requestBody));
  assert.equal(q21.body.input.messages[0].content.length, 11);
  const bad = (body, re) => assert.throws(() => buildSubmitRequest(driver(imageDecode(body).requestBody)), re);
  bad({ model: "qwen-image-2.1-pro", prompt: "x", negative_prompt: "y" }, /parameters.negative_prompt is not supported/);
  bad({ model: "qwen-image-2.1-pro", prompt: "x", images: ten.concat(["https://x/10.png"]) }, /at most 10/);
  bad({ model: "qwen-image-3.0", prompt: "x", image: IMG, prompt_extend_mode: "agent" }, /agent only supports text to image/);
  bad({ model: "qwen-image-3.0", prompt: "x", prompt_extend_mode: "smart" }, /direct or agent/);
  bad({ model: "qwen-image-3.0", prompt: "x", enable_thinking: "yes" }, /boolean/);
  const snapshot = buildSubmitRequest(driver(imageDecode({ model: "qwen-image-2.0-pro-2026-06-22", prompt: "x", n: 6 }).requestBody));
  assert.equal(snapshot.body.parameters.n, 6);
});

test("wan 2.6 image editing needs references and wan 2.6 text to image refuses them", () => {
  const edit = driver(imageDecode({ model: "wan2.6-image", prompt: "blue", images: [IMG, "https://x/2.png"], size: "2K", n: 2 }, "edit").requestBody);
  const req = buildSubmitRequest(edit);
  assert.deepEqual(req.body.parameters, { n: 2, size: "2K" });
  assert.deepEqual(extractUsage(edit), { image_count: 2 });
  const bad = (body, re) => assert.throws(() => buildSubmitRequest(driver(imageDecode(body).requestBody)), re);
  bad({ model: "wan2.6-image", prompt: "x" }, /wan2.6-image edits images/);
  bad({ model: "wan2.6-image", prompt: "x", images: [1, 2, 3, 4, 5].map((i) => "https://x/" + i) }, /at most 4/);
  bad({ model: "wan2.6-image", prompt: "x", image: IMG, size: "4K" }, /requires a width\*height size or one of 1K, 2K/);
  bad({ model: "wan2.6-image", prompt: "x", image: IMG, size: "700*700" }, /outside/);
  bad({ model: "wan2.6-t2i", prompt: "x", image: IMG }, /only supports text to image/);
  bad({ model: "wan2.6-t2i", prompt: "x", size: "1024*1024" }, /1280\*1280 to 1440\*1440/);
  bad({ model: "wan2.6-t2i", prompt: "x", n: 5 }, /between 1 and 4/);
  bad({ model: "wan2.6-t2i", prompt: "x", size: "1K" }, /requires a width\*height size/);
  assert.equal(buildSubmitRequest(driver(imageDecode({ model: "wan2.6-t2i", prompt: "x", size: "1696x960" }).requestBody)).body.parameters.size, "1696*960");
  assert.throws(() => imageDecode({ model: "wan2.6-image", prompt: "x", image: IMG, enable_interleave: true }), /unsupported field: enable_interleave/);
});

test("wan 2.5 image previews call the async image-synthesis services", () => {
  const t2i = driver(imageDecode({ model: "wan2.5-t2i-preview", prompt: "a cat", negative_prompt: "dogs", size: "1280x1280", prompt_extend: false }).requestBody, { baseUrl: PAYG });
  const req = buildSubmitRequest(t2i);
  assert.equal(req.url, PAYG + "/api/v1/services/aigc/text2image/image-synthesis");
  assert.deepEqual(req.body, { model: "wan2.5-t2i-preview", input: { prompt: "a cat", negative_prompt: "dogs" }, parameters: { n: 1, size: "1280*1280", prompt_extend: false } });
  const i2i = driver(imageDecode({ model: "wan2.5-i2i-preview", prompt: "blue", images: [IMG, "https://x/2.png"] }, "edit").requestBody, { baseUrl: PAYG });
  assert.deepEqual(buildSubmitRequest(i2i).body, { model: "wan2.5-i2i-preview", input: { prompt: "blue", images: [IMG, "https://x/2.png"] }, parameters: { n: 1 } });
  const bad = (body, re) => assert.throws(() => buildSubmitRequest(driver(imageDecode(body).requestBody)), re);
  bad({ model: "wan2.5-i2i-preview", prompt: "x" }, /requires 1 to 3 input images/);
  bad({ model: "wan2.5-i2i-preview", prompt: "x", image: IMG, size: "1440*1440" }, /768\*768 to 1280\*1280/);
  bad({ model: "wan2.5-t2i-preview", prompt: "x", image: IMG }, /only supports text to image/);

  const submitted = deepFreeze({ request_id: "r1", output: { task_id: "img-task-1", task_status: "PENDING" } });
  assert.deepEqual(parseSubmitResponse(i2i, { statusCode: 200, body: submitted }), { taskId: "img-task-1", taskData: submitted });
  assert.deepEqual(extractUsageOnSubmit(i2i, submitted), {}, "nothing is delivered at submit");
  assert.throws(() => parseSubmitResponse(i2i, { statusCode: 200, body: { output: { task_status: "PENDING" } } }), /task_id is empty/);
  const query = deepFreeze({ taskId: "img-task-1", baseUrl: PAYG, apiKey: "test-key", model: "wan2.5-i2i-preview", upstreamModel: "wan2.5-i2i-preview" });
  assert.equal(buildQueryRequest(query).url, PAYG + "/api/v1/tasks/img-task-1");
  const done = deepFreeze({ output: { task_status: "SUCCEEDED", results: [{ url: "https://oss/1.png", orig_prompt: "blue" }, { code: "DataInspectionFailed", message: "x" }] }, usage: { image_count: 1 } });
  assert.deepEqual(parseTaskResult(query, done), { status: "SUCCESS", progress: "100%", url: "https://oss/1.png" });
  assert.deepEqual(extractUsageOnComplete(query, {}, done), { image_count: 1 });
  const none = { output: { task_status: "SUCCEEDED", results: [{ code: "DataInspectionFailed", message: "blocked" }] } };
  assert.deepEqual(parseTaskResult(query, none), { status: "FAILURE", reason: "DataInspectionFailed: blocked" });
  assert.equal(extractUsageOnComplete(query, {}, { output: { task_status: "SUCCEEDED", results: [] } }), null);
  assert.deepEqual(listArtifacts({ status: "SUCCESS", data: done }), [], "images are returned as Bailian links");
  assert.deepEqual(protocols.openai_image.render({}, { created_at: 7, data: done }), { created: 7, data: [{ url: "https://oss/1.png" }] });
});

test("native image routes: image-generation async and legacy image-synthesis bodies", () => {
  const body = { model: "wan2.6-t2i", input: { messages: [{ role: "user", content: [{ text: "a cat" }] }] }, parameters: { size: "1280*1280", n: 2 } };
  const intent = native.createImageTask(deepFreeze({ body: { kind: "json", value: body }, requestHeaders: {} }));
  const ctx = driver(intent.requestBody);
  const req = buildSubmitRequest(ctx);
  assert.equal(req.url, BASE + "/api/v1/services/aigc/image-generation/generation");
  assert.equal(header(req.headers, "x-dashscope-async"), "enable");
  assert.deepEqual(req.body, { model: "wan2.6-t2i", input: body.input, parameters: { size: "1280*1280", n: 2 } });
  assert.deepEqual(parseSubmitResponse(ctx, { statusCode: 200, body: { output: { task_id: "t-26", task_status: "PENDING" } } }).taskId, "t-26");
  const choices = { output: { task_status: "SUCCEEDED", choices: [{ message: { content: [{ image: "https://oss/a.png" }] } }] }, usage: { image_count: 1 } };
  assert.equal(parseTaskResult({ model: "wan2.6-t2i" }, choices).url, "https://oss/a.png");
  assert.deepEqual(native.taskCreated({}, { task_id: "task_pub", data: { request_id: "r", output: { task_id: "t-26", task_status: "PENDING" } } }), { request_id: "r", output: { task_id: "task_pub", task_status: "PENDING" } });

  const legacy = { model: "wan2.5-i2i-preview", input: { prompt: "blue", images: [IMG], negative_prompt: "red" }, parameters: { n: 1, size: "1024*1024" } };
  const decoded = native.createLegacyImage(deepFreeze({ body: { kind: "json", value: legacy }, requestHeaders: {} }));
  assert.equal(decoded.action, "image_to_image");
  assert.deepEqual(buildSubmitRequest(driver(decoded.requestBody)).body, { model: "wan2.5-i2i-preview", input: { prompt: "blue", images: [IMG], negative_prompt: "red" }, parameters: { n: 1, size: "1024*1024" } });
  assert.throws(() => native.createLegacyImage({ body: { kind: "json", value: { model: "wan2.5-t2i-preview", input: { prompt: "x", function: "y" } } } }), /input.function is not supported/);
  const t2i = native.createLegacyImage({ body: { kind: "json", value: { model: "wan2.5-t2i-preview", input: { prompt: "x" } } } });
  assert.equal(buildSubmitRequest(driver(t2i.requestBody)).url, BASE + "/api/v1/services/aigc/text2image/image-synthesis");
  assert.throws(() => buildSubmitRequest(driver(native.createLegacyImage({ body: { kind: "json", value: { model: "wan2.5-t2i-preview", input: {} } } }).requestBody)), /prompt must be a non-empty string/);
});

// --- pay-as-you-go video families -------------------------------------------

const minimalVideo = {
  wan3: { prompt: "a fox" }, t2v: { prompt: "a fox" }, i2v: { prompt: "run", image: IMG }, r2v: { prompt: "dance", images: [IMG] },
  t27: { prompt: "a fox" }, i27: { prompt: "run", image: IMG }, size: { prompt: "a fox" }, img: { prompt: "run", image: IMG },
};

test("every video model builds a request and a reservation that fits its usage profile", () => {
  for (const model of Object.keys(VIDEO_MODELS)) {
    const kind = VIDEO_MODELS[model].kind;
    const ctx = driver(videoDecode(Object.assign({ model }, minimalVideo[kind])).requestBody, { baseUrl: PAYG });
    const req = buildSubmitRequest(ctx);
    assert.equal(req.url, PAYG + "/api/v1/services/aigc/video-generation/video-synthesis");
    assert.equal(header(req.headers, "x-dashscope-async"), "enable");
    const facts = extractUsage(ctx);
    checkFacts(model, facts);
    assert.equal(facts.resolution, "1080P", model + " reserves its default resolution");
    assert.equal(facts.seconds, 5);
    assert.equal(req.body.parameters.duration, 5, model + " sends the duration");
    if (kind === "size") assert.equal(req.body.parameters.size, "1920*1080", model + " sends the pixel size");
    else assert.equal(req.body.parameters.resolution, "1080P", model + " sends the resolution");
  }
});

test("wan 2.7 text and image to video", () => {
  const t2v = buildSubmitRequest(driver(videoDecode({ model: "wan2.7-t2v-2026-06-12", prompt: "a fox", seconds: "2", size: "1280x720", audio_url: "https://x/a.mp3", negative_prompt: "rain" }).requestBody));
  assert.deepEqual(t2v.body, { model: "wan2.7-t2v-2026-06-12", input: { prompt: "a fox", negative_prompt: "rain", audio_url: "https://x/a.mp3" }, parameters: { duration: 2, resolution: "720P", ratio: "16:9" } });
  const i2v = buildSubmitRequest(driver(videoDecode({ model: "wan2.7-i2v", prompt: "run", images: [IMG, "https://x/last.png"], audio_url: "https://x/a.mp3", resolution: "720P", seconds: 2 }).requestBody));
  assert.deepEqual(i2v.body.input.media, [{ type: "first_frame", url: IMG }, { type: "last_frame", url: "https://x/last.png" }, { type: "driving_audio", url: "https://x/a.mp3" }]);
  assert.deepEqual(i2v.body.parameters, { resolution: "720P", duration: 2 }, "an image-led video takes no ratio");
  const sized = buildSubmitRequest(driver(videoDecode({ model: "wan2.7-i2v", image: IMG, size: "1920x1080" }).requestBody));
  assert.deepEqual(sized.body.parameters, { resolution: "1080P", duration: 5 }, "the ratio of an OpenAI size is dropped");
  const clip = buildSubmitRequest(driver({ model: "wan2.7-i2v", input: { media: [{ type: "first_clip", url: "https://x/c.mp4" }, { type: "last_frame", url: IMG }] }, parameters: { duration: 15 } }));
  assert.equal(clip.body.input.media.length, 2);
  const bad = (body, re) => assert.throws(() => buildSubmitRequest(driver(body)), re);
  bad({ model: "wan2.7-i2v", input: { media: [{ type: "first_clip", url: "https://x/c.mp4" }, { type: "first_frame", url: IMG }] } }, /first_frame .* or first_clip/);
  bad({ model: "wan2.7-i2v", input: { media: [{ type: "last_frame", url: IMG }] } }, /first_frame/);
  bad({ model: "wan2.7-i2v", input: { media: [{ type: "reference_image", url: IMG }] } }, /unsupported input.media type/);
  bad({ model: "wan2.7-t2v", input: { prompt: "x" }, parameters: { resolution: "480P" } }, /720P, 1080P/);
  bad({ model: "wan2.7-t2v", input: { prompt: "x" }, parameters: { duration: 16 } }, /between 2 and 15/);
  bad({ model: "wan2.7-t2v", input: { prompt: "x" }, parameters: { audio: true } }, /parameters.audio is not supported/);
  bad({ model: "wan2.7-t2v", input: { prompt: "x" }, parameters: { ratio: "21:9" } }, /ratio must be/);
  assert.throws(() => buildSubmitRequest(driver(videoDecode({ model: "wan2.7-t2v", prompt: "x", image: IMG }).requestBody)), /text-to-video only; use wan2.7-i2v/);
});

test("wan 2.6 and 2.5 text to video send a pixel size", () => {
  const t26 = driver(videoDecode({ model: "wan2.6-t2v", prompt: "a fox", size: "1104x832", seconds: 2, shot_type: "multi" }).requestBody);
  assert.deepEqual(buildSubmitRequest(t26).body.parameters, { size: "1088*832", duration: 2, shot_type: "multi" });
  assert.deepEqual(extractUsage(t26), { seconds: 2, resolution: "720P" });
  const nativeSize = driver({ model: "wan2.5-t2v-preview", input: { prompt: "x" }, parameters: { size: "832*480", duration: 10 } });
  assert.deepEqual(buildSubmitRequest(nativeSize).body.parameters, { size: "832*480", duration: 10 });
  assert.deepEqual(extractUsage(nativeSize), { seconds: 10, resolution: "480P" });
  const tier = buildSubmitRequest(driver(videoDecode({ model: "wan2.5-t2v-preview", prompt: "x", resolution: "480p", ratio: "9:16" }).requestBody));
  assert.equal(tier.body.parameters.size, "480*832");
  const bad = (body, re) => assert.throws(() => buildSubmitRequest(driver(body)), re);
  bad({ model: "wan2.6-t2v", input: { prompt: "x" }, parameters: { size: "832*480" } }, /size must be one of/);
  bad({ model: "wan2.5-t2v-preview", input: { prompt: "x" }, parameters: { resolution: "480P", ratio: "4:3" } }, /no 4:3 size at 480P/);
  bad({ model: "wan2.5-t2v-preview", input: { prompt: "x" }, parameters: { duration: 7 } }, /one of 5, 10/);
  bad({ model: "wan2.5-t2v-preview", input: { prompt: "x" }, parameters: { shot_type: "multi" } }, /shot_type is not supported/);
  bad({ model: "wan2.6-t2v", input: { prompt: "x" }, parameters: { shot_type: "many" } }, /single or multi/);
  bad({ model: "wan2.6-t2v", input: { prompt: "x" }, parameters: { size: "1280*720", resolution: "720P" } }, /either size or resolution/);
  bad({ model: "wan2.6-t2v", input: {} }, /prompt is required/);
});

test("wan 2.6 and 2.5 first-frame video send img_url, and the flash model prices audio", () => {
  const flash = driver(videoDecode({ model: "wan2.6-i2v-flash", prompt: "run", image: IMG, size: "1280x720", seconds: 2, audio: false }).requestBody);
  const req = buildSubmitRequest(flash);
  assert.deepEqual(req.body, { model: "wan2.6-i2v-flash", input: { prompt: "run", img_url: IMG }, parameters: { duration: 2, audio: false, resolution: "720P" } });
  assert.deepEqual(extractUsage(flash), { seconds: 2, resolution: "720P", audio: false });
  const loud = driver(videoDecode({ model: "wan2.6-i2v-flash", image: IMG, resolution: "720P" }).requestBody);
  assert.equal(buildSubmitRequest(loud).body.parameters.audio, true, "audio is priced, so its default is sent");
  assert.deepEqual(extractUsage(loud), { seconds: 5, resolution: "720P", audio: true });
  const nativeBody = driver({ model: "wan2.5-i2v-preview", input: { img_url: IMG, audio_url: "https://x/a.mp3" }, parameters: { resolution: "480P", duration: 10 } });
  assert.deepEqual(buildSubmitRequest(nativeBody).body.input, { img_url: IMG, audio_url: "https://x/a.mp3" });
  const bad = (body, re) => assert.throws(() => buildSubmitRequest(driver(body)), re);
  bad({ model: "wan2.6-i2v", input: { prompt: "x", img_url: IMG }, parameters: { audio: false } }, /parameters.audio is not supported/);
  bad({ model: "wan2.6-i2v", input: { prompt: "x" } }, /requires a first-frame image/);
  bad({ model: "wan2.6-i2v", input: { img_url: "file-1" } }, /img_url must be/);
  bad({ model: "wan2.6-i2v", input: { img_url: IMG }, parameters: { ratio: "16:9" } }, /parameters.ratio is not supported/);
  bad({ model: "wan2.5-i2v-preview", input: { img_url: IMG }, parameters: { duration: 3 } }, /one of 5, 10/);
  bad({ model: "wan2.6-i2v", input: { img_url: IMG, template: "flying" } }, /input.template is not supported/);
  bad({ model: "wan2.6-i2v", images: [IMG, IMG + "?2"], input: {} }, /exactly one first-frame image/);
});

test("pay-as-you-go video settles on the seconds and resolution Bailian reports", () => {
  const q = (model) => deepFreeze({ model, upstreamModel: model });
  assert.deepEqual(extractUsageOnComplete(q("wan2.6-i2v-flash"), {}, { output: {}, usage: { duration: 2, input_video_duration: 0, output_video_duration: 2, SR: 720, audio: false } }), { seconds: 2, resolution: "720P", audio: false });
  assert.deepEqual(extractUsageOnComplete(q("wan2.5-t2v-preview"), {}, { output: {}, usage: { video_duration: 5, video_ratio: "832×480", video_count: 1 } }), { seconds: 5, resolution: "480P" });
  assert.deepEqual(extractUsageOnComplete(q("wan2.6-t2v"), {}, { output: {}, usage: { duration: 2, size: "1280*720" } }), { seconds: 2, resolution: "720P" });
  assert.deepEqual(extractUsageOnComplete(q("wan2.7-i2v"), {}, { output: {}, usage: { duration: 15, input_video_duration: 3, output_video_duration: 12, SR: 1080 } }), { seconds: 15, resolution: "1080P" });
  assert.deepEqual(extractUsageOnComplete(q("wan3.0-video-prime"), {}, { output: {}, usage: { input_video_duration: 4, output_video_duration: 5, SR: 480 } }), { seconds: 9, resolution: "480P" });
  assert.equal(extractUsageOnComplete(q("wan2.6-i2v"), {}, { output: {} }), null);
});

// --- speech -----------------------------------------------------------------

const SPEECH_CTX = deepFreeze({ baseUrl: BASE, path: "/v1/audio/speech", config: { defaultVoice: "longanhuan_v3.6" } });

test("speech requests stream from DashScope", () => {
  const out = convertRequest(SPEECH_CTX, deepFreeze({ model: "qwen-audio-3.0-tts-plus", stream: false, body: { model: "qwen-audio-3.0-tts-plus", input: "你好", voice: "alloy", response_format: "wav", speed: 1.2, instructions: "开心" } }));
  assert.deepEqual(out.body, { model: "qwen-audio-3.0-tts-plus", input: { text: "你好", voice: "longanhuan_v3.6", format: "wav", sample_rate: 24000, rate: 1.2, instruction: "开心" } });
  assert.deepEqual(out.headers, { "X-DashScope-SSE": "enable" });
  assert.equal(out.stream, true);
  assert.equal(out.path, undefined, "the route's upstream path is used");
  assert.equal(out.state.clientStream, false);
  const named = convertRequest(SPEECH_CTX, { model: "qwen-audio-3.0-tts-plus", body: { input: "hi", voice: "longanlingxin_v3.6", metadata: { sample_rate: 16000, volume: 60 } } });
  assert.equal(named.body.input.voice, "longanlingxin_v3.6");
  assert.equal(named.body.input.format, "mp3");
  assert.equal(named.body.input.sample_rate, 16000);
  assert.equal(named.body.input.volume, 60);
  const bad = (body, re) => assert.throws(() => convertRequest(SPEECH_CTX, { model: "qwen-audio-3.0-tts-plus", body: body }), re);
  bad({ input: "" }, /input is required/);
  bad({ input: "x", response_format: "aac" }, /response_format/);
  bad({ input: "x", speed: 3 }, /speed/);
  bad({ input: "x", metadata: { foo: 1 } }, /metadata.foo/);
  bad({ input: "x", response_format: "opus", metadata: { sample_rate: 22050 } }, /sample_rate/);
  bad({ input: "x", extra: 1 }, /unsupported field/);
});

test("speech stream events become audio bytes for a plain client", () => {
  const state = { kind: "speech", format: "mp3", clientStream: false, chunks: 0, characters: 0 };
  const begin = convertStreamEvent(deepFreeze(Object.assign({ state: state }, SPEECH_CTX)), { event: "result", data: JSON.stringify({ output: { type: "sentence-begin", audio: { data: "" } }, usage: { characters: 4 } }) });
  assert.equal(begin.chunks, undefined);
  assert.equal(begin.state.characters, 4);
  const chunk = convertStreamEvent(deepFreeze(Object.assign({ state: begin.state }, SPEECH_CTX)), { data: JSON.stringify({ output: { type: "sentence-synthesis", audio: { data: "SUQz" } } }) });
  assert.deepEqual(chunk.chunks, [{ bodyBase64: "SUQz" }]);
  assert.equal(chunk.contentType, "audio/mpeg");
  const done = convertStreamEvent(deepFreeze(Object.assign({ state: chunk.state }, SPEECH_CTX)), { done: true });
  assert.ok(!done.error);
  const empty = convertStreamEvent(deepFreeze(Object.assign({ state: state }, SPEECH_CTX)), { done: true });
  assert.equal(empty.error.status, 502);
  const failed = convertStreamEvent(deepFreeze(Object.assign({ state: state }, SPEECH_CTX)), { event: "error", data: JSON.stringify({ code: "InvalidParameter", message: "voice not found" }) });
  assert.match(failed.error.message, /voice not found/);
  assert.equal(state.chunks, 0, "state is not mutated");
});

test("speech stream events for an SSE client", () => {
  const state = { kind: "speech", format: "mp3", clientStream: true, chunks: 0, characters: 0 };
  const chunk = convertStreamEvent(Object.assign({ state: state }, SPEECH_CTX), { data: JSON.stringify({ output: { audio: { data: "AAA=" } }, usage: { characters: 6 } }) });
  assert.deepEqual(chunk.events, [{ data: { type: "speech.audio.delta", audio: "AAA=" } }]);
  const last = convertStreamEvent(Object.assign({ state: chunk.state }, SPEECH_CTX), { data: JSON.stringify({ output: { finish_reason: "stop", audio: { data: "", url: "https://x" } }, usage: { characters: 6 } }) });
  assert.deepEqual(last.events, [{ data: { type: "speech.audio.done", usage: { input_tokens: 6, output_tokens: 0, total_tokens: 6 } } }]);
});

test("speech never follows the OSS URL of a whole JSON reply", () => {
  const ctx = Object.assign({ state: { kind: "speech", format: "mp3" } }, SPEECH_CTX);
  const reply = convertResponse(ctx, { status: 200, headers: {}, body: JSON.stringify({ output: { audio: { url: "https://oss/x.mp3" } } }) });
  assert.equal(reply.error.status, 502);
  assert.equal(reply.next, undefined);
  const denied = convertResponse(ctx, { status: 401, headers: {}, body: JSON.stringify({ code: "InvalidApiKey", message: "Invalid API-key provided." }) });
  assert.equal(denied.error.status, 401);
  assert.equal(denied.error.code, "InvalidApiKey");
});

// --- transcription ----------------------------------------------------------

const ASR_CTX = deepFreeze({ baseUrl: BASE, path: "/v1/audio/transcriptions", config: {} });

test("transcriptions send the upload as a data URL", () => {
  const form = { fields: { model: ["qwen-audio-3.0-asr-flash"], language: ["zh"] }, files: [{ field: "file", filename: "hello.MP3", contentType: "audio/mpeg", size: 100 }] };
  const out = convertRequest(ASR_CTX, deepFreeze({ model: "qwen-audio-3.0-asr-flash", stream: false, form: form }));
  assert.deepEqual(out.body, {
    model: "qwen-audio-3.0-asr-flash",
    input: { messages: [{ role: "user", content: [{ type: "input_audio", input_audio: { data: { "$file": "file", encoding: "dataUrl" } } }] }] },
    parameters: { format: "mp3", language_hints: ["zh"] },
  });
  const byType = convertRequest(ASR_CTX, { model: "m", form: { fields: {}, files: [{ field: "file", filename: "blob", contentType: "audio/x-wav", size: 1 }] } });
  assert.equal(byType.body.parameters.format, "wav");
  const bad = (form, re) => assert.throws(() => convertRequest(ASR_CTX, { model: "m", form: form }), re);
  bad({ fields: {}, files: [] }, /exactly one audio file/);
  bad({ fields: { response_format: ["srt"] }, files: [{ field: "file", filename: "a.wav" }] }, /json or verbose_json/);
  bad({ fields: { prompt: ["hint"] }, files: [{ field: "file", filename: "a.wav" }] }, /prompt is not supported/);
  bad({ fields: {}, files: [{ field: "file", filename: "a.bin", contentType: "application/octet-stream" }] }, /cannot tell the audio format/);
});

test("transcription replies carry billable seconds as usage", () => {
  const ctx = Object.assign({ state: { kind: "transcription", responseFormat: "json" } }, ASR_CTX);
  const body = JSON.stringify({ output: { choices: [{ message: { content: [{ text: "你好" }] } }] }, usage: { duration: 1.4 } });
  assert.deepEqual(convertResponse(ctx, { status: 200, headers: {}, body: body }).body, {
    text: "你好",
    usage: { type: "tokens", input_tokens: 2, output_tokens: 0, total_tokens: 2, prompt_tokens: 2, completion_tokens: 0, seconds: 2 },
  });
  const verbose = convertResponse(Object.assign({}, ctx, { state: { kind: "transcription", responseFormat: "verbose_json" } }), { status: 200, headers: {}, body: body });
  assert.equal(verbose.body.duration, 1.4);
  assert.equal(convertResponse(ctx, { status: 200, headers: {}, body: JSON.stringify({ code: "X", message: "bad audio" }) }).error.code, "X");
  assert.equal(convertResponse(ctx, { status: 400, headers: {}, body: "{}" }).error.status, 400);
});

test("other relay paths are not converted", () => {
  assert.throws(() => convertRequest({ path: "/v1/chat/completions", config: {} }, { model: "x", body: {} }), /does not convert/);
});

// --- channel key ------------------------------------------------------------

test("checkKey accepts any non-empty key on the Bailian API and refuses an empty one", () => {
  assert.equal(checkKey({ baseUrl: BASE, config: {} }, "sk-abc"), undefined);
  assert.equal(checkKey({ baseUrl: "https://dashscope-intl.aliyuncs.com", config: {} }, "sk-abc"), undefined);
  assert.equal(checkKey({ baseUrl: "https://ws1.cn-beijing.maas.aliyuncs.com", config: {} }, "sk-other-abc"), undefined);
  assert.equal(checkKey({ baseUrl: "", config: { upstreamType: "bailian" } }, "sk-abc"), undefined);
  assert.ok(checkKey({ baseUrl: BASE, config: {} }, " ").error);
});

test("model fetch keeps served and chat models and drops ones without a route", () => {
  const body = JSON.stringify({ object: "list", has_more: false, data: [
    "qwen3.8-max", "auto", "glm-5.3", "wan2.7-image", "wan3.0-video", "qwen-audio-3.0-tts-plus",
    "qwen-audio-3.0-realtime-plus", "decision-model-preview", "wan2.2-t2v-plus", "qwen3-vl-plus", "text-embedding-v3",
  ].map((id) => ({ id, object: "model" })) });
  const out = convertResponse({ path: "/v1/models", state: null }, { status: 200, body });
  assert.deepEqual(out.body.data.map((m) => m.id), ["qwen3.8-max", "auto", "glm-5.3", "wan2.7-image", "wan3.0-video", "qwen-audio-3.0-tts-plus", "qwen3-vl-plus", "text-embedding-v3"]);
  assert.equal(servedModel("qwen-plus"), true);
});

test("a pay-as-you-go model list keeps the image models this plugin serves", () => {
  // Image ids as the pay-as-you-go /compatible-mode/v1/models list returns them.
  const listed = ["qwen-image-2.0", "qwen-image-2.0-2026-03-03", "qwen-image-2.0-pro", "qwen-image-2.0-pro-2026-03-03", "qwen-image-2.0-pro-2026-04-22",
    "qwen-image-2.0-pro-2026-06-22", "qwen-image-2.1-pro", "qwen-image-3.0", "qwen-image-3.0-pro", "wan2.7-image", "wan2.7-image-pro", "z-image-turbo"];
  const body = JSON.stringify({ data: listed.concat(["qwen-image-2.1-turbo", "qwen-mt-image-2.0"]).map((id) => ({ id })), has_more: false });
  const out = convertResponse({ path: "/v1/models", state: null }, { status: 200, body });
  assert.deepEqual(out.body.data.map((m) => m.id), listed);
  for (const model of Object.keys(IMAGE_MODELS).concat(Object.keys(VIDEO_MODELS))) assert.ok(servedModel(model), model);
  // On a pay-as-you-go host the unlisted video and Wan 2.6 / 2.5 image models are added.
  const task = Object.keys(IMAGE_MODELS).concat(Object.keys(VIDEO_MODELS));
  const payg = convertResponse({ path: "/v1/models", state: null, baseUrl: PAYG }, { status: 200, body }).body.data.map((m) => m.id);
  assert.deepEqual(payg.slice(0, listed.length), listed);
  assert.deepEqual(payg.slice().sort(), Array.from(new Set(listed.concat(task))).sort());
  const other = convertResponse({ path: "/v1/models", state: null, baseUrl: "https://ws1.cn-beijing.maas.aliyuncs.com/" }, { status: 200, body }).body.data;
  assert.deepEqual(other.map((m) => m.id), listed, "other hosts list only what Bailian returns");
  const first = convertResponse({ path: "/v1/models", state: null, baseUrl: PAYG }, { status: 200, body: JSON.stringify({ data: [{ id: "qwen3.8-max" }], has_more: true, last_id: "a" }) });
  assert.equal(first.state.payg, true);
  assert.equal(first.next.path, "/compatible-mode/v1/models?after=a");
  const last = modelListReply({ status: 200, body: JSON.stringify({ data: [], has_more: false }) }, first.state);
  assert.equal(last.body.data.length, 1 + task.length, "the host decision survives paging");
});

test("model fetch follows pages and reports failures", () => {
  const page1 = JSON.stringify({ data: [{ id: "qwen3.8-max" }], has_more: true, last_id: "model-id-0" });
  const first = convertResponse({ path: "/v1/models", state: null }, { status: 200, body: page1 });
  assert.equal(first.next.path, "/compatible-mode/v1/models?after=model-id-0");
  const page2 = JSON.stringify({ data: [{ id: "glm-5.3" }, { id: "qwen3.8-max" }], has_more: false });
  const second = modelListReply({ status: 200, body: page2 }, first.state);
  assert.deepEqual(second.body.data.map((m) => m.id), ["qwen3.8-max", "glm-5.3"]);
  const failed = convertResponse({ path: "/v1/models", state: null }, { status: 401, body: "{}" });
  assert.equal(failed.error.status, 401);
});

// --- through another New API gateway (type-60 channel) -----------------------

const GW = "http://middle.example:3000";
const viaGW = (extra) => Object.assign({ baseUrl: GW, apiKey: "sk-gateway", authHeader: "Bearer sk-gateway", upstream: { kind: "new_api" } }, extra || {});

test("meta declares the New API upstream", () => {
  assert.deepEqual(meta.upstreams, ["vendor", "new_api"]);
});

test("new_api: submit URLs go to the middle gateway's native routes under the plugin key, Bearer only", () => {
  const prefix = GW + "/" + PLUGIN_KEY;
  const routes = new Set(meta.routes.map((r) => r.method + " " + r.path));
  const image = buildSubmitRequest(driver(imageDecode({ model: "wan2.7-image", prompt: "a cat" }).requestBody, viaGW()));
  assert.equal(image.url, prefix + "/api/v1/services/aigc/multimodal-generation/generation");
  assert.deepEqual(Object.keys(image.headers).sort(), ["Authorization", "Content-Type"]);
  assert.equal(image.headers.Authorization, "Bearer sk-gateway");
  const asyncImage = buildSubmitRequest(driver({ model: "wan2.5-t2i-preview", input: { messages: [{ role: "user", content: [{ text: "x" }] }] }, parameters: {} }, viaGW()));
  assert.equal(asyncImage.url, prefix + "/api/v1/services/aigc/text2image/image-synthesis");
  assert.ok(!Object.keys(asyncImage.headers).some((k) => /async/i.test(k)), "no vendor async switch on the gateway");
  const video = buildSubmitRequest(driver(videoDecode({ model: "wan3.0-video", prompt: "a fox", seconds: 4, resolution: "480P" }).requestBody, viaGW()));
  assert.equal(video.url, prefix + "/api/v1/services/aigc/video-generation/video-synthesis");
  assert.ok(!Object.keys(video.headers).some((k) => /async/i.test(k)));
  for (const req of [image, asyncImage, video]) {
    assert.ok(routes.has("POST " + req.url.slice(prefix.length)), "the middle plugin serves " + req.url);
  }
  // The same request on a vendor channel keeps the vendor address and headers.
  const vendor = buildSubmitRequest(driver(videoDecode({ model: "wan3.0-video", prompt: "a fox", seconds: 4, resolution: "480P" }).requestBody));
  assert.equal(vendor.url, BASE + "/api/v1/services/aigc/video-generation/video-synthesis");
  assert.ok(Object.keys(vendor.headers).some((k) => /async/i.test(k)));
});

test("new_api: the outer driver body passes the middle plugin's native decoders", () => {
  const cases = [
    ["createImage", imageDecode({ model: "wan2.7-image", prompt: "a cat", n: 2 }).requestBody],
    ["createLegacyImage", { model: "wan2.5-i2i-preview", input: { messages: [{ role: "user", content: [{ image: IMG }, { text: "x" }] }] }, parameters: { negative_prompt: "blur" } }],
    ["createVideo", videoDecode({ model: "happyhorse-1.1-t2v", prompt: "a fox", seconds: 3, resolution: "720P" }).requestBody],
  ];
  for (const [decoder, requestBody] of cases) {
    const outer = buildSubmitRequest(driver(requestBody, viaGW()));
    const intent = native[decoder](deepFreeze({ body: { kind: "json", value: JSON.parse(JSON.stringify(outer.body)) }, requestHeaders: {} }));
    const middle = buildSubmitRequest(driver(intent.requestBody));
    assert.deepEqual(middle.body, outer.body, decoder + " forwards the same vendor body");
    assert.deepEqual(extractUsage(driver(intent.requestBody)), extractUsage(driver(requestBody, viaGW())), decoder + " reserves the same facts on both layers");
  }
});

test("new_api: sync image reply rendered by the middle gateway completes immediately and settles the same", () => {
  const ctx = driver(imageDecode({ model: "wan2.7-image", prompt: "a cat" }).requestBody, viaGW({ publicTaskId: "task_outer" }));
  const rendered = native.imageCreated({}, deepFreeze({ task_id: "task_middle", data: IMAGE_REPLY }));
  const parsed = parseSubmitResponse(ctx, deepFreeze({ statusCode: 200, body: rendered }));
  assert.equal(parsed.taskId, "task_outer");
  assert.equal(parsed.immediate.status, "SUCCESS");
  const q = deepFreeze({ model: "wan2.7-image", upstreamModel: "wan2.7-image" });
  assert.deepEqual(extractUsageOnComplete(q, {}, rendered), extractUsageOnComplete(q, {}, IMAGE_REPLY));
});

test("new_api: video query, status and download through the middle gateway", () => {
  const ctx = driver(videoDecode({ model: "wan3.0-video", prompt: "a fox", seconds: 4, resolution: "480P" }).requestBody, viaGW());
  const created = native.videoCreated({}, deepFreeze({ task_id: "task_middle", data: SUBMIT_REPLY }));
  assert.equal(parseSubmitResponse(ctx, deepFreeze({ statusCode: 200, body: created })).taskId, "task_middle");
  const query = deepFreeze(viaGW({ taskId: "task_middle", model: "wan3.0-video", upstreamModel: "wan3.0-video" }));
  assert.deepEqual(buildQueryRequest(query), { url: GW + "/" + PLUGIN_KEY + "/api/v1/tasks/task_middle", method: "GET", headers: { Authorization: "Bearer sk-gateway" } });
  assert.ok(meta.routes.some((r) => r.type === "query" && r.path === "/api/v1/tasks/:task_id"));
  const signed = GW + "/v1/videos/task_middle/content?sig=abc";
  const status = native.taskStatus(deepFreeze({ artifacts: { video: { key: "video", type: "video", url: signed } } }), deepFreeze({ task_id: "task_middle", status: "SUCCESS", data: DONE_REPLY }));
  assert.deepEqual(parseTaskResult(query, status), { status: "SUCCESS", progress: "100%", url: signed });
  assert.deepEqual(extractUsageOnComplete(query, {}, status), extractUsageOnComplete(query, {}, DONE_REPLY), "the middle reply keeps Bailian's usage");
  const pending = native.taskStatus({}, deepFreeze({ task_id: "task_middle", status: "IN_PROGRESS", data: SUBMIT_REPLY }));
  assert.deepEqual(parseTaskResult(query, pending), { status: "QUEUED" });
  const failed = native.taskStatus({}, deepFreeze({ task_id: "task_middle", status: "FAILURE", fail_reason: "timeout", data: SUBMIT_REPLY }));
  assert.equal(parseTaskResult(query, failed).status, "FAILURE");
  const calls = [];
  globalThis.utils = { fetch(req) { calls.push(req); return { status: 200, headers: {}, body: status }; } };
  const content = buildContentRequest(deepFreeze(viaGW({ artifactKey: "video", upstreamTaskId: "task_middle", data: status, clientRequest: { method: "GET" } })));
  delete globalThis.utils;
  assert.deepEqual(content, { url: GW + "/v1/tasks/task_middle/artifacts/video/content", method: "GET", headers: { Authorization: "Bearer sk-gateway" } });
  assert.equal(calls.length, 0);
});

// --- upstream type: OpenAI-compatible relay ------------------------------------

const RELAY = "https://relay.example.com";
const relayCfg = { upstreamType: "openai" };
const relayDriver = (requestBody, extra) => driver(requestBody, Object.assign({ baseUrl: RELAY + "/", apiKey: "relay-key", config: relayCfg }, extra || {}));
const relayCtx = (path, extra) => deepFreeze(Object.assign({ baseUrl: RELAY, path: path, config: relayCfg }, extra || {}));

test("the upstream type setting defaults to the Bailian API", () => {
  const field = meta.channelConfig.properties.upstreamType;
  assert.deepEqual(field.enum, ["bailian", "openai"]);
  assert.equal(field.default, "bailian");
  assert.equal(field.enumTitles.length, 2);
  assert.ok(meta.channelConfig.properties.defaultVoice, "the voice setting stays");
  assert.equal(upstreamType({ config: {} }), "bailian");
  assert.equal(upstreamType({}), "bailian");
  assert.equal(upstreamType({ config: { upstreamType: "bailian" } }), "bailian");
  assert.equal(upstreamType({ config: relayCfg }), "openai");
  assert.equal(upstreamType({ config: { upstreamType: "xai" } }), "bailian");
});

test("prepareRequest leaves Bailian requests alone and sends relay text to its OpenAI paths", () => {
  for (const path of ["/v1/chat/completions", "/v1/responses", "/v1/messages", "/v1/embeddings", "/v1/audio/speech"]) {
    const request = deepFreeze({ path, upstreamPath: "/compatible-mode" + path, model: "qwen-plus", stream: false, body: { model: "qwen-plus" }, headers: {} });
    assert.equal(prepareRequest(deepFreeze({ baseUrl: BASE, path, config: {} }), request), null, path);
    assert.equal(prepareRequest(deepFreeze({ baseUrl: BASE, path, config: { upstreamType: "bailian" } }), request), null, path);
  }
  for (const path of ["/v1/chat/completions", "/v1/responses", "/v1/messages", "/v1/embeddings"]) {
    const request = deepFreeze({ path, upstreamPath: "/compatible-mode" + path, model: "qwen-plus", stream: true, body: { model: "qwen-plus", stream: true }, headers: {} });
    assert.deepEqual(prepareRequest(relayCtx(path), request), { path }, path);
  }
  // Speech and transcription choose their path in convertRequest.
  for (const path of ["/v1/audio/speech", "/v1/audio/transcriptions", "/v1/models"]) {
    assert.equal(prepareRequest(relayCtx(path), deepFreeze({ path, upstreamPath: "/x", model: "m", stream: false, body: {}, headers: {} })), null, path);
  }
});

test("relay images: OpenAI generations at the relay with the upstream model, priced as on Bailian", () => {
  const intent = imageDecode({ model: "wan2.7-image", prompt: "a cat", size: "1024*1024", n: 2, watermark: false, response_format: "b64_json" });
  const ctx = relayDriver(intent.requestBody);
  const req = buildSubmitRequest(ctx);
  assert.equal(req.url, RELAY + "/v1/images/generations");
  assert.equal(req.method, "POST");
  assert.equal(req.headers.Authorization, "Bearer relay-key");
  assert.equal(header(req.headers, "x-dashscope-async"), undefined);
  assert.deepEqual(req.body, { model: "wan2.7-image", prompt: "a cat", n: 2, size: "1024x1024", watermark: false });
  assert.deepEqual(extractUsage(ctx), { image_count: 2 });
  assert.deepEqual(extractUsage(Object.assign({}, ctx, { usagePurpose: "billing_ratios" })), { image_count: 2 });
  // A mapped alias sends the upstream model name, unchanged.
  const alias = relayDriver(Object.assign({}, intent.requestBody, { model: "my-image" }), { model: "my-image", upstreamModel: "wan2.7-image" });
  assert.equal(buildSubmitRequest(alias).body.model, "wan2.7-image");
  // Price-determining defaults go explicitly.
  const z = relayDriver(imageDecode({ model: "z-image-turbo", prompt: "x", size: "1024x1536" }).requestBody);
  assert.deepEqual(buildSubmitRequest(z).body, { model: "z-image-turbo", prompt: "x", size: "1024x1536", prompt_extend: false });
  assert.deepEqual(extractUsage(z), { image_count: 1, prompt_extend: false });
  const q3 = relayDriver(imageDecode({ model: "qwen-image-3.0-pro", prompt: "x", size: "2048*2048" }).requestBody);
  assert.deepEqual(extractUsage(q3), { image_count: 1, output_image_type: "qima_output_2k", input_image_count: 0 });
  const w25 = relayDriver(imageDecode({ model: "wan2.5-t2i-preview", prompt: "x", negative_prompt: "dogs", size: "1280*1280" }).requestBody);
  const w25req = buildSubmitRequest(w25);
  assert.equal(w25req.url, RELAY + "/v1/images/generations", "no async Bailian task on a relay");
  assert.deepEqual(w25req.body, { model: "wan2.5-t2i-preview", prompt: "x", size: "1280x1280", n: 1, negative_prompt: "dogs" });
});

test("relay images: validation still applies, and edits, native routes and video are refused", () => {
  assert.throws(() => buildSubmitRequest(relayDriver(imageDecode({ model: "wan2.7-image", prompt: "x", n: 9 }).requestBody)), /n must be/);
  const edit = imageDecode({ model: "wan2.7-image", prompt: "x", image: "https://x/a.png" }, "edit");
  assert.throws(() => buildSubmitRequest(relayDriver(edit.requestBody)), /input images are not supported/);
  assert.throws(() => extractUsage(relayDriver(edit.requestBody)), /input images are not supported/);
  const body = { model: "wan2.7-image", input: { messages: [{ role: "user", content: [{ text: "a cat" }] }] }, parameters: {} };
  const nativeIntent = native.createImage(deepFreeze({ body: { kind: "json", value: body }, requestHeaders: {} }));
  assert.throws(() => extractUsage(relayDriver(nativeIntent.requestBody)), /DashScope endpoints are not available/);
  assert.throws(() => buildSubmitRequest(relayDriver(nativeIntent.requestBody)), /DashScope endpoints are not available/);
  const legacy = native.createLegacyImage(deepFreeze({ body: { kind: "json", value: { model: "wan2.5-t2i-preview", input: { prompt: "x" } } }, requestHeaders: {} }));
  assert.throws(() => buildSubmitRequest(relayDriver(legacy.requestBody)), /DashScope endpoints are not available/);
  // The native marker changes nothing on the Bailian API.
  assert.equal(buildSubmitRequest(driver(nativeIntent.requestBody)).body.native, undefined);
  const video = videoDecode({ model: "wan3.0-video", prompt: "a fox", seconds: "2", size: "832x480" });
  assert.throws(() => extractUsage(relayDriver(video.requestBody)), /video models are not available/);
  assert.throws(() => buildSubmitRequest(relayDriver(video.requestBody)), /video models are not available/);
  const nativeVideo = native.createVideo(deepFreeze({ body: { kind: "json", value: { model: "happyhorse-1.1-t2v", input: { prompt: "x" }, parameters: {} } }, requestHeaders: {} }));
  assert.throws(() => buildSubmitRequest(relayDriver(nativeVideo.requestBody)), /video models are not available/);
});

test("relay images: the OpenAI reply completes immediately and settles on the delivered images", () => {
  const ctx = relayDriver(imageDecode({ model: "wan2.7-image", prompt: "x", n: 2 }).requestBody);
  const urls = deepFreeze({ created: 1, data: [{ url: "https://cdn.relay.example/a.png" }, { url: "https://cdn.relay.example/b.png" }], usage: { input_tokens: 5, output_tokens: 10 } });
  const parsed = parseSubmitResponse(ctx, { statusCode: 200, headers: {}, body: urls });
  assert.deepEqual(parsed.immediate, { status: "SUCCESS", progress: "100%", url: "https://cdn.relay.example/a.png" });
  assert.equal(parsed.taskId, "task_public");
  assert.deepEqual(extractUsageOnSubmit(ctx, urls), { image_count: 2 });
  assert.deepEqual(extractUsageOnComplete({ model: "wan2.7-image", upstreamModel: "wan2.7-image", config: relayCfg }, { status: "SUCCESS" }, urls), { image_count: 2 });
  assert.deepEqual(protocols.openai_image.render({}, { created_at: 7, data: urls }), { created: 7, data: [{ url: "https://cdn.relay.example/a.png" }, { url: "https://cdn.relay.example/b.png" }] });
  const b64 = deepFreeze({ created: 1, data: [{ b64_json: "iVBORw0KGgo=" }] });
  const parsedB64 = parseSubmitResponse(ctx, { statusCode: 200, headers: {}, body: b64 });
  assert.deepEqual(parsedB64.immediate, { status: "SUCCESS", progress: "100%" }, "no data URL as the task link");
  assert.deepEqual(protocols.openai_image.render({}, { created_at: 7, data: b64 }).data, [{ b64_json: "iVBORw0KGgo=" }]);
  assert.deepEqual(extractUsageOnComplete({ model: "wan2.7-image" }, { status: "SUCCESS" }, b64), { image_count: 1 });
  assert.throws(() => parseSubmitResponse(ctx, { statusCode: 200, body: { data: [] } }), /no images/);
  assert.throws(() => parseSubmitResponse(ctx, { statusCode: 200, body: { error: { message: "quota exceeded" } } }), /quota exceeded/);
});

test("a New API channel ignores the upstream type", () => {
  const intent = imageDecode({ model: "wan2.7-image", prompt: "x" });
  const req = buildSubmitRequest(driver(intent.requestBody, viaGW({ config: relayCfg })));
  assert.equal(req.url, GW + "/" + PLUGIN_KEY + "/api/v1/services/aigc/multimodal-generation/generation");
  const video = videoDecode({ model: "wan3.0-video", prompt: "a fox", seconds: "2", size: "832x480" });
  assert.equal(buildSubmitRequest(driver(video.requestBody, viaGW({ config: relayCfg }))).url, GW + "/" + PLUGIN_KEY + "/api/v1/services/aigc/video-generation/video-synthesis");
});

test("relay speech goes to the relay's OpenAI speech path and its reply to the gateway unchanged", () => {
  const body = { model: "my-tts", input: "你好", voice: "alloy", response_format: "wav", speed: 1.2 };
  const out = convertRequest(relayCtx("/v1/audio/speech"), deepFreeze({ model: "qwen-audio-3.0-tts-plus", stream: false, body }));
  assert.deepEqual(out, { path: "/v1/audio/speech", method: "POST", body: Object.assign({}, body, { model: "qwen-audio-3.0-tts-plus" }), stream: false, nativeResponse: true, state: { kind: "speech", relay: true } });
  const sse = convertRequest(relayCtx("/v1/audio/speech"), deepFreeze({ model: "qwen-audio-3.0-tts-plus", stream: true, body: Object.assign({ stream_format: "sse" }, body) }));
  assert.equal(sse.stream, true);
  assert.equal(sse.nativeResponse, true);
  const failed = convertResponse(relayCtx("/v1/audio/speech", { state: out.state }), { status: 429, headers: {}, body: JSON.stringify({ error: { message: "slow down", code: "rate_limit" } }) });
  assert.deepEqual(failed, { error: { status: 429, message: "slow down", type: "upstream_error", code: "rate_limit" } });
  assert.equal(convertResponse(relayCtx("/v1/audio/speech", { state: out.state }), { status: 502, headers: {}, body: "bad gateway" }).error.message, "bad gateway");
});

test("relay transcription passes the form on and bills the seconds the relay reports", () => {
  const form = { fields: { model: ["my-asr"], language: ["zh"], response_format: ["verbose_json"], prompt: ["names"] }, files: [{ field: "file", filename: "a.mp3", contentType: "audio/mpeg", size: 9 }] };
  const out = convertRequest(relayCtx("/v1/audio/transcriptions"), deepFreeze({ model: "qwen-audio-3.0-asr-flash", stream: false, form }));
  assert.deepEqual(out, {
    path: "/v1/audio/transcriptions",
    method: "POST",
    form: { fields: { model: "qwen-audio-3.0-asr-flash", language: ["zh"], response_format: ["verbose_json"], prompt: ["names"] }, files: [{ field: "file", from: "file" }] },
    stream: false,
    state: { kind: "transcription", relay: true, responseFormat: "verbose_json" },
  });
  const verbose = convertResponse(relayCtx("/v1/audio/transcriptions", { state: out.state }), { status: 200, headers: {}, body: JSON.stringify({ text: "你好", duration: 2.2, language: "zh" }) });
  assert.equal(verbose.body.text, "你好");
  assert.deepEqual(verbose.body.usage, { type: "tokens", input_tokens: 3, output_tokens: 0, total_tokens: 3, prompt_tokens: 3, completion_tokens: 0, seconds: 3 });
  const duration = relayTranscriptionReply({ text: "x", usage: { type: "duration", seconds: 4 } }, "", { headers: {} });
  assert.equal(duration.body.usage.prompt_tokens, 4);
  const tokens = JSON.stringify({ text: "x", usage: { type: "tokens", input_tokens: 10, output_tokens: 2, total_tokens: 12 } });
  assert.deepEqual(convertResponse(relayCtx("/v1/audio/transcriptions", { state: out.state }), { status: 200, headers: { "Content-Type": "application/json" }, body: tokens }), { body: tokens, contentType: "application/json" });
  assert.deepEqual(convertResponse(relayCtx("/v1/audio/transcriptions", { state: out.state }), { status: 200, headers: { "Content-Type": "text/plain" }, body: "hello" }), { body: "hello", contentType: "text/plain" });
  assert.equal(convertResponse(relayCtx("/v1/audio/transcriptions", { state: out.state }), { status: 400, headers: {}, body: JSON.stringify({ error: { message: "bad file" } }) }).error.status, 400);
  assert.throws(() => convertRequest(relayCtx("/v1/audio/transcriptions"), { model: "m", stream: false, body: {} }), /multipart form/);
  assert.throws(() => convertRequest(relayCtx("/v1/chat/completions"), { model: "m", stream: false, body: {} }), /does not convert/);
});

test("relay model fetch returns the relay's own /v1/models list", () => {
  // The route's first request goes to the Bailian list path; it is chained to /v1/models.
  const first = convertResponse(relayCtx("/v1/models", { state: null }), { status: 404, headers: {}, body: "" });
  assert.deepEqual(first, { next: { method: "GET", path: "/v1/models" }, state: { kind: "models", relay: true, ids: [], pages: 0 } });
  const list = JSON.stringify({ object: "list", data: [{ id: "gpt-5.5" }, { id: "qwen3.8-max" }, { id: "wan3.0-video" }, { id: "gpt-5.5" }, { id: "tts-2" }] });
  const out = convertResponse(relayCtx("/v1/models", { state: first.state }), { status: 200, headers: {}, body: list });
  assert.deepEqual(out.body.data.map((m) => m.id), ["gpt-5.5", "qwen3.8-max", "wan3.0-video", "tts-2"], "kept as the relay lists it, no Bailian additions");
  assert.equal(out.body.data[0].owned_by, "openai-compatible");
  const paged = convertResponse(relayCtx("/v1/models", { state: first.state }), { status: 200, headers: {}, body: JSON.stringify({ data: [{ id: "a" }], has_more: true, last_id: "a" }) });
  assert.equal(paged.next.path, "/v1/models?after=a");
  const last = convertResponse(relayCtx("/v1/models", { state: paged.state }), { status: 200, headers: {}, body: JSON.stringify({ data: [{ id: "b" }] }) });
  assert.deepEqual(last.body.data.map((m) => m.id), ["a", "b"]);
  assert.equal(convertResponse(relayCtx("/v1/models", { state: first.state }), { status: 401, headers: {}, body: "{}" }).error.status, 401);
  assert.match(convertResponse(relayCtx("/v1/models", { state: first.state }), { status: 200, headers: {}, body: "<html>" }).error.message, /unreadable/);
});

test("checkKey on a relay upstream asks for the relay's address", () => {
  const relay = (baseUrl) => checkKey({ baseUrl, config: relayCfg }, "relay-key");
  assert.equal(relay(RELAY), undefined);
  assert.equal(relay("http://host.docker.internal:39301"), undefined);
  assert.equal(relay("https://dashscope.aliyuncs.com/compatible-mode"), undefined, "Bailian's own OpenAI-compatible root works as a relay");
  assert.match(relay(BASE).error.en, /relay's address, not dashscope\.aliyuncs\.com/);
  assert.match(relay("https://dashscope-intl.aliyuncs.com/").error.zh, /中转地址/);
  assert.ok(relay("https://ws1.cn-beijing.maas.aliyuncs.com").error);
  assert.ok(relay("").error, "a blank Base URL means the Bailian host");
  assert.ok(checkKey({ baseUrl: RELAY, config: relayCfg }, "").error);
});

test("relay hooks leave their arguments untouched", () => {
  const ctx = relayDriver(imageDecode({ model: "qwen-image-2.0", prompt: "x", size: "1024*1024" }).requestBody);
  buildSubmitRequest(ctx);
  extractUsage(ctx);
  parseSubmitResponse(ctx, deepFreeze({ statusCode: 200, headers: {}, body: { data: [{ url: "https://cdn/x.png" }] } }));
  convertRequest(relayCtx("/v1/audio/speech"), deepFreeze({ model: "m", stream: false, body: { model: "c", input: "x" } }));
  convertResponse(relayCtx("/v1/models", { state: deepFreeze({ kind: "models", relay: true, ids: ["a"], pages: 1 }) }), deepFreeze({ status: 200, headers: {}, body: JSON.stringify({ data: [{ id: "b" }] }) }));
});
