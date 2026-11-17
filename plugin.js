// Alibaba Cloud Bailian (Model Studio) on ONE type-61 channel.
//
// Uses a Bailian API key (sk-...) on the DashScope host of the key's site.
// The channel Base URL picks the host; keys and hosts must not be mixed.
//
//   Text        relay, converter none   /v1/chat/completions, /v1/responses,
//                                       /v1/messages, /v1/embeddings
//   Speech      relay, converter plugin /v1/audio/speech (DashScope TTS as SSE,
//                                       decoded into audio bytes)
//   Transcribe  relay, converter plugin /v1/audio/transcriptions
//   Images      task part               /v1/images/generations, /v1/images/edits,
//                                       DashScope multimodal-generation (sync),
//                                       image-generation, text2image and
//                                       image2image image-synthesis (async)
//   Video       task part, async        /v1/videos, DashScope video-synthesis,
//                                       /api/v1/tasks/{id}
//
// Billing: text and audio are billed by new-api from the usage it reads (or
// the input characters for speech); images and video are billed by task usage
// facts (image_count, seconds, resolution and the few price switches such as
// Wan 2.6 i2v flash audio) with expressions from README.

export const meta = {
  "apiVersion": 1,
  "key": "byaiden_bailian",
  "name": { "en": "Alibaba Cloud Bailian", "zh": "阿里云百炼" },
  "version": "1.3.0",
  "author": { "name": "ByAiden", "url": "https://github.com/ByAiden" },
  "description": { "en": "Alibaba Cloud Bailian text, image, video and speech models on one channel", "zh": "一个渠道接入阿里云百炼文本、图片、视频与语音模型" },
  "icon": "Bailian.Color",
  "website": "https://help.aliyun.com/zh/model-studio/",
  "baseUrl": "https://dashscope.aliyuncs.com",
  "allowedHosts": ["dashscope-intl.aliyuncs.com"],
  "upstreams": ["vendor", "new_api"],
  "models": [
    "qwen4-max",
    "qwen4-max-preview",
    "qwen3.8-max",
    "qwen3.8-flash",
    "qwen3.7-max",
    "qwen3.7-plus",
    "qwen3.6-plus",
    "qwen3.6-flash",
    "deepseek-v4.1-flash",
    "deepseek-v4.1-flash-1017",
    "deepseek-v4-pro",
    "deepseek-v4-pro-0813",
    "deepseek-v4-flash-0731",
    "glm-5.3",
    "glm-5.2",
    "glm-5.1",
    "glm-5",
    "kimi-k2.7-code",
    "kimi-k2.6",
    "kimi-k2.5",
    "text-embedding-v4",
    "qwen-image-3.0-pro",
    "qwen-image-3.0",
    "qwen-image-2.1-pro",
    "qwen-image-2.0-pro",
    "qwen-image-2.0-pro-2026-06-22",
    "qwen-image-2.0-pro-2026-04-22",
    "qwen-image-2.0-pro-2026-03-03",
    "qwen-image-2.0",
    "qwen-image-2.0-2026-03-03",
    "z-image-turbo",
    "wan2.7-image-pro",
    "wan2.7-image",
    "wan2.6-image",
    "wan2.6-t2i",
    "wan2.5-t2i-preview",
    "wan2.5-i2i-preview",
    "wan3.0-video",
    "wan3.0-video-prime",
    "happyhorse-1.1-t2v",
    "happyhorse-1.1-i2v",
    "happyhorse-1.1-r2v",
    "wan2.7-t2v",
    "wan2.7-t2v-2026-06-12",
    "wan2.7-t2v-2026-04-25",
    "wan2.7-i2v",
    "wan2.7-i2v-2026-04-25",
    "wan2.6-t2v",
    "wan2.5-t2v-preview",
    "wan2.6-i2v",
    "wan2.6-i2v-flash",
    "wan2.5-i2v-preview",
    "qwen-audio-3.0-tts-plus",
    "qwen-audio-3.0-asr-flash"
  ],
  "fetchMode": "per_task",
  "usageProfiles": [
    {
      "models": [
        "qwen-image-2.1-pro",
        "qwen-image-2.0-pro",
        "qwen-image-2.0-pro-2026-06-22",
        "qwen-image-2.0-pro-2026-04-22",
        "qwen-image-2.0-pro-2026-03-03",
        "qwen-image-2.0",
        "qwen-image-2.0-2026-03-03",
        "wan2.7-image-pro",
        "wan2.7-image",
        "wan2.6-image",
        "wan2.6-t2i",
        "wan2.5-t2i-preview",
        "wan2.5-i2i-preview"
      ],
      "schema": {
        "image_count": {
          "type": "number",
          "unit": "count",
          "unitLabel": { "en": "image", "zh": "张" },
          "description": { "en": "Image generation unit price", "zh": "图片生成单价" }
        }
      },
      "examples": [
        { "label": "1 image", "facts": {"image_count": 1} },
        { "label": "4 images", "facts": {"image_count": 4} }
      ]
    },
    {
      "models": ["qwen-image-3.0-pro", "qwen-image-3.0"],
      "schema": {
        "image_count": {
          "type": "number",
          "unit": "count",
          "unitLabel": { "en": "image", "zh": "张" },
          "description": { "en": "Image generation unit price", "zh": "图片生成单价" }
        },
        "output_image_type": {
          "enum": ["qima_output_1k", "qima_output_2k"],
          "enumLabels": { "qima_output_1k": {"en": "1K output", "zh": "1K 输出"}, "qima_output_2k": {"en": "2K output", "zh": "2K 输出"} },
          "description": { "en": "Output image tier", "zh": "输出图片档位" }
        },
        "input_image_count": {
          "type": "number",
          "unit": "count",
          "unitLabel": { "en": "image", "zh": "张" },
          "description": { "en": "Input image unit price", "zh": "输入图片单价" }
        }
      },
      "examples": [
        {
          "label": "1K · text to image",
          "facts": { "image_count": 1, "output_image_type": "qima_output_1k", "input_image_count": 0 }
        },
        {
          "label": "2K · 1 input image",
          "facts": { "image_count": 1, "output_image_type": "qima_output_2k", "input_image_count": 1 }
        }
      ]
    },
    {
      "models": ["z-image-turbo"],
      "schema": {
        "image_count": {
          "type": "number",
          "unit": "count",
          "unitLabel": { "en": "image", "zh": "张" },
          "description": { "en": "Image generation unit price", "zh": "图片生成单价" }
        },
        "prompt_extend": {
          "type": "boolean",
          "description": { "en": "Whether prompt rewriting is enabled", "zh": "是否开启提示词改写" }
        }
      },
      "examples": [
        { "label": "1 image", "facts": {"image_count": 1, "prompt_extend": false} },
        { "label": "1 image · prompt rewriting", "facts": {"image_count": 1, "prompt_extend": true} }
      ]
    },
    {
      "models": [
        "wan3.0-video",
        "wan3.0-video-prime",
        "happyhorse-1.1-t2v",
        "happyhorse-1.1-i2v",
        "happyhorse-1.1-r2v",
        "wan2.5-t2v-preview",
        "wan2.5-i2v-preview"
      ],
      "schema": {
        "seconds": {
          "type": "number",
          "unit": "second",
          "description": { "en": "Video generation unit price", "zh": "视频生成单价" }
        },
        "resolution": {
          "enum": ["480P", "720P", "1080P"],
          "enumLabels": { "480P": {"en": "480P", "zh": "480P"}, "720P": {"en": "720P", "zh": "720P"}, "1080P": {"en": "1080P", "zh": "1080P"} },
          "description": { "en": "Output video resolution", "zh": "输出视频分辨率" }
        }
      },
      "examples": [
        { "label": "480P · 5s", "facts": {"seconds": 5, "resolution": "480P"} },
        { "label": "1080P · 5s", "facts": {"seconds": 5, "resolution": "1080P"} }
      ]
    },
    {
      "models": ["wan2.7-t2v", "wan2.7-t2v-2026-06-12", "wan2.7-t2v-2026-04-25", "wan2.7-i2v", "wan2.7-i2v-2026-04-25", "wan2.6-t2v", "wan2.6-i2v"],
      "schema": {
        "seconds": {
          "type": "number",
          "unit": "second",
          "description": { "en": "Video generation unit price", "zh": "视频生成单价" }
        },
        "resolution": {
          "enum": ["720P", "1080P"],
          "enumLabels": { "720P": {"en": "720P", "zh": "720P"}, "1080P": {"en": "1080P", "zh": "1080P"} },
          "description": { "en": "Output video resolution", "zh": "输出视频分辨率" }
        }
      },
      "examples": [
        { "label": "720P · 5s", "facts": {"seconds": 5, "resolution": "720P"} },
        { "label": "1080P · 5s", "facts": {"seconds": 5, "resolution": "1080P"} }
      ]
    },
    {
      "models": ["wan2.6-i2v-flash"],
      "schema": {
        "seconds": {
          "type": "number",
          "unit": "second",
          "description": { "en": "Video generation unit price", "zh": "视频生成单价" }
        },
        "resolution": {
          "enum": ["720P", "1080P"],
          "enumLabels": { "720P": {"en": "720P", "zh": "720P"}, "1080P": {"en": "1080P", "zh": "1080P"} },
          "description": { "en": "Output video resolution", "zh": "输出视频分辨率" }
        },
        "audio": {
          "type": "boolean",
          "description": { "en": "Whether the video has audio", "zh": "是否生成有声视频" }
        }
      },
      "examples": [
        { "label": "720P · 5s · silent", "facts": {"seconds": 5, "resolution": "720P", "audio": false} },
        { "label": "1080P · 5s · audio", "facts": {"seconds": 5, "resolution": "1080P", "audio": true} }
      ]
    }
  ],
  "routes": [
    {
      "method": "POST",
      "path": "/api/v1/services/aigc/multimodal-generation/generation",
      "type": "submit",
      "models": [
        "qwen-image-3.0-pro",
        "qwen-image-3.0",
        "qwen-image-2.1-pro",
        "qwen-image-2.0-pro",
        "qwen-image-2.0-pro-2026-06-22",
        "qwen-image-2.0-pro-2026-04-22",
        "qwen-image-2.0-pro-2026-03-03",
        "qwen-image-2.0",
        "qwen-image-2.0-2026-03-03",
        "z-image-turbo",
        "wan2.7-image-pro",
        "wan2.7-image",
        "wan2.6-image",
        "wan2.6-t2i"
      ],
      "decode": "createImage",
      "render": "imageCreated",
      "retainResult": false
    },
    {
      "method": "POST",
      "path": "/api/v1/services/aigc/image-generation/generation",
      "type": "submit",
      "models": ["wan2.6-image", "wan2.6-t2i"],
      "decode": "createImageTask",
      "render": "taskCreated"
    },
    {
      "method": "POST",
      "path": "/api/v1/services/aigc/text2image/image-synthesis",
      "type": "submit",
      "models": ["wan2.5-t2i-preview"],
      "decode": "createLegacyImage",
      "render": "taskCreated"
    },
    {
      "method": "POST",
      "path": "/api/v1/services/aigc/image2image/image-synthesis",
      "type": "submit",
      "models": ["wan2.5-i2i-preview"],
      "decode": "createLegacyImage",
      "render": "taskCreated"
    },
    {
      "method": "POST",
      "path": "/api/v1/services/aigc/video-generation/video-synthesis",
      "type": "submit",
      "models": [
        "wan3.0-video",
        "wan3.0-video-prime",
        "happyhorse-1.1-t2v",
        "happyhorse-1.1-i2v",
        "happyhorse-1.1-r2v",
        "wan2.7-t2v",
        "wan2.7-t2v-2026-06-12",
        "wan2.7-t2v-2026-04-25",
        "wan2.7-i2v",
        "wan2.7-i2v-2026-04-25",
        "wan2.6-t2v",
        "wan2.5-t2v-preview",
        "wan2.6-i2v",
        "wan2.6-i2v-flash",
        "wan2.5-i2v-preview"
      ],
      "decode": "createVideo",
      "render": "videoCreated"
    },
    { "method": "GET", "path": "/api/v1/tasks/:task_id", "type": "query", "render": "taskStatus" }
  ],
  "protocols": [
    {
      "name": "openai_image",
      "models": [
        "qwen-image-3.0-pro",
        "qwen-image-3.0",
        "qwen-image-2.1-pro",
        "qwen-image-2.0-pro",
        "qwen-image-2.0-pro-2026-06-22",
        "qwen-image-2.0-pro-2026-04-22",
        "qwen-image-2.0-pro-2026-03-03",
        "qwen-image-2.0",
        "qwen-image-2.0-2026-03-03",
        "z-image-turbo",
        "wan2.7-image-pro",
        "wan2.7-image",
        "wan2.6-image",
        "wan2.6-t2i",
        "wan2.5-t2i-preview",
        "wan2.5-i2i-preview"
      ]
    },
    {
      "name": "openai_video",
      "models": [
        "wan3.0-video",
        "wan3.0-video-prime",
        "happyhorse-1.1-t2v",
        "happyhorse-1.1-i2v",
        "happyhorse-1.1-r2v",
        "wan2.7-t2v",
        "wan2.7-t2v-2026-06-12",
        "wan2.7-t2v-2026-04-25",
        "wan2.7-i2v",
        "wan2.7-i2v-2026-04-25",
        "wan2.6-t2v",
        "wan2.5-t2v-preview",
        "wan2.6-i2v",
        "wan2.6-i2v-flash",
        "wan2.5-i2v-preview"
      ]
    }
  ],
  "relay": [
    { "incoming_path": "/v1/chat/completions", "upstream_path": "/compatible-mode/v1/chat/completions" },
    { "incoming_path": "/v1/responses", "upstream_path": "/compatible-mode/v1/responses" },
    { "incoming_path": "/v1/messages", "upstream_path": "/apps/anthropic/v1/messages" },
    { "incoming_path": "/v1/embeddings", "upstream_path": "/compatible-mode/v1/embeddings" },
    { "incoming_path": "/v1/audio/speech", "upstream_path": "/api/v1/services/audio/tts/SpeechSynthesizer", "converter": "plugin" },
    { "incoming_path": "/v1/audio/transcriptions", "upstream_path": "/api/v1/services/aigc/multimodal-generation/generation", "converter": "plugin" },
    { "incoming_path": "/v1/models", "upstream_path": "/compatible-mode/v1/models", "converter": "plugin" }
  ],
  "channelConfig": {
    "type": "object",
    "properties": {
      "defaultVoice": {
        "type": "string",
        "title": { "en": "Default voice", "zh": "默认音色" },
        "description": {
          "en": "Bailian voice used when a speech request names an OpenAI voice such as alloy, or none",
          "zh": "语音合成请求使用 alloy 等 OpenAI 音色名或未指定音色时使用的百炼音色"
        },
        "default": "longanhuan_v3.6",
        "minLength": 1,
        "maxLength": 128,
        "pattern": "^[A-Za-z0-9._-]+$"
      }
    }
  },
  "keyHint": {
    "en": "Bailian API key (sk-...) of the site the Base URL points to",
    "zh": "百炼 API Key（sk-），与 Base URL 所在站点对应"
  }
};

// ---------------------------------------------------------------------------
// Runtime constants. A test checks they match the manifest above, which stays
// a plain JSON literal that the marketplace and the install page read statically.

export const PLUGIN_KEY = "byaiden_bailian";

export const TEXT_MODELS = [
  "qwen4-max", "qwen4-max-preview", "qwen3.8-max", "qwen3.8-flash", "qwen3.7-max", "qwen3.7-plus",
  "qwen3.6-plus", "qwen3.6-flash", "deepseek-v4.1-flash", "deepseek-v4.1-flash-1017", "deepseek-v4-pro",
  "deepseek-v4-pro-0813", "deepseek-v4-flash-0731", "glm-5.3", "glm-5.2", "glm-5.1", "glm-5",
  "kimi-k2.7-code", "kimi-k2.6", "kimi-k2.5",
];
export const EMBEDDING_MODELS = ["text-embedding-v4"];

// Image families and the Bailian service each one calls:
//   qwen3   Qwen-Image 3.0 (tiered output, billed input images)  multimodal-generation, synchronous
//   qwen21  Qwen-Image 2.1                                        multimodal-generation, synchronous
//   qwen    Qwen-Image 2.0 and its snapshots                      multimodal-generation, synchronous
//   zimage  Z-Image (one image, priced by prompt_extend)          multimodal-generation, synchronous
//   wan27   Wan 2.7 image                                         multimodal-generation, synchronous
//   wan26i  Wan 2.6 image editing (1 to 4 reference images)       synchronous, or image-generation async
//   wan26t  Wan 2.6 text to image                                 synchronous, or image-generation async
//   wan25t  Wan 2.5 text to image preview                         text2image/image-synthesis, async
//   wan25e  Wan 2.5 image editing preview                         image2image/image-synthesis, async
export const IMAGE_MODELS = {
  "qwen-image-3.0-pro": { family: "qwen3", maxN: 6, maxInput: 3 },
  "qwen-image-3.0": { family: "qwen3", maxN: 6, maxInput: 3 },
  "qwen-image-2.1-pro": { family: "qwen21", maxN: 6, maxInput: 10 },
  "qwen-image-2.0-pro": { family: "qwen", maxN: 6, maxInput: 3 },
  "qwen-image-2.0-pro-2026-06-22": { family: "qwen", maxN: 6, maxInput: 3 },
  "qwen-image-2.0-pro-2026-04-22": { family: "qwen", maxN: 6, maxInput: 3 },
  "qwen-image-2.0-pro-2026-03-03": { family: "qwen", maxN: 6, maxInput: 3 },
  "qwen-image-2.0": { family: "qwen", maxN: 6, maxInput: 3 },
  "qwen-image-2.0-2026-03-03": { family: "qwen", maxN: 6, maxInput: 3 },
  "z-image-turbo": { family: "zimage", maxN: 1, maxInput: 0 },
  "wan2.7-image-pro": { family: "wan27", maxN: 4, maxInput: 9, allow4K: true },
  "wan2.7-image": { family: "wan27", maxN: 4, maxInput: 9 },
  "wan2.6-image": { family: "wan26i", maxN: 4, minInput: 1, maxInput: 4 },
  "wan2.6-t2i": { family: "wan26t", maxN: 4, maxInput: 0 },
  "wan2.5-t2i-preview": { family: "wan25t", maxN: 4, maxInput: 0 },
  "wan2.5-i2i-preview": { family: "wan25e", maxN: 4, minInput: 1, maxInput: 3 },
};

const RATIOS_5 = ["16:9", "9:16", "1:1", "4:3", "3:4"];
const RATIOS_WAN3 = ["16:9", "9:16", "1:1", "4:3", "3:4", "21:9", "adaptive"];
const RATIOS_HORSE = ["16:9", "9:16", "1:1", "4:3", "3:4", "4:5", "5:4", "9:21", "21:9"];
export const VIDEO_RESOLUTIONS = ["480P", "720P", "1080P"];
const HD_RESOLUTIONS = ["720P", "1080P"];

// kind: wan3 (Wan 3.0 all-round), t2v / i2v / r2v (HappyHorse 1.1), t27 (Wan 2.7 text to
// video), i27 (Wan 2.7 image to video: first and last frame, driving audio, first clip),
// size (Wan 2.6 / 2.5 text to video with a pixel size), img (Wan 2.6 / 2.5 first frame).
export const VIDEO_MODELS = {
  "wan3.0-video": { kind: "wan3", minDuration: 2, maxDuration: 30, ratios: RATIOS_WAN3, defaultRatio: "adaptive" },
  "wan3.0-video-prime": { kind: "wan3", minDuration: 2, maxDuration: 30, ratios: RATIOS_WAN3, defaultRatio: "adaptive" },
  "happyhorse-1.1-t2v": { kind: "t2v", minDuration: 3, maxDuration: 15, ratios: RATIOS_HORSE, defaultRatio: "16:9" },
  "happyhorse-1.1-i2v": { kind: "i2v", minDuration: 3, maxDuration: 15, ratios: null },
  "happyhorse-1.1-r2v": { kind: "r2v", minDuration: 3, maxDuration: 15, ratios: RATIOS_HORSE, defaultRatio: "16:9" },
  "wan2.7-t2v": { kind: "t27", resolutions: HD_RESOLUTIONS, minDuration: 2, maxDuration: 15, ratios: RATIOS_5, defaultRatio: "16:9" },
  "wan2.7-t2v-2026-06-12": { kind: "t27", resolutions: HD_RESOLUTIONS, minDuration: 2, maxDuration: 15, ratios: RATIOS_5, defaultRatio: "16:9" },
  "wan2.7-t2v-2026-04-25": { kind: "t27", resolutions: HD_RESOLUTIONS, minDuration: 2, maxDuration: 15, ratios: RATIOS_5, defaultRatio: "16:9" },
  "wan2.7-i2v": { kind: "i27", resolutions: HD_RESOLUTIONS, minDuration: 2, maxDuration: 15, ratios: null },
  "wan2.7-i2v-2026-04-25": { kind: "i27", resolutions: HD_RESOLUTIONS, minDuration: 2, maxDuration: 15, ratios: null },
  "wan2.6-t2v": { kind: "size", resolutions: HD_RESOLUTIONS, minDuration: 2, maxDuration: 15, ratios: RATIOS_5, defaultRatio: "16:9", shotType: true },
  "wan2.5-t2v-preview": { kind: "size", resolutions: VIDEO_RESOLUTIONS, durations: [5, 10], ratios: RATIOS_5, defaultRatio: "16:9" },
  "wan2.6-i2v": { kind: "img", resolutions: HD_RESOLUTIONS, minDuration: 2, maxDuration: 15, ratios: null, shotType: true },
  "wan2.6-i2v-flash": { kind: "img", resolutions: HD_RESOLUTIONS, minDuration: 2, maxDuration: 15, ratios: null, shotType: true, audio: true },
  "wan2.5-i2v-preview": { kind: "img", resolutions: VIDEO_RESOLUTIONS, durations: [5, 10], ratios: null },
};
export const TTS_MODELS = ["qwen-audio-3.0-tts-plus"];
export const ASR_MODELS = ["qwen-audio-3.0-asr-flash"];

export const MODEL_IDS = [].concat(TEXT_MODELS, EMBEDDING_MODELS, Object.keys(IMAGE_MODELS), Object.keys(VIDEO_MODELS), TTS_MODELS, ASR_MODELS);

const SPEECH_PATH = "/v1/audio/speech";
const MODELS_PATH = "/v1/models";
const MODEL_LIST_PATH = "/compatible-mode/v1/models";
const MODEL_LIST_MAX_PAGES = 30;

// Upstream ids the channel's model fetch keeps: everything this plugin serves,
// plus other text and vision chat models (the text routes pass any model through).
// Image, video, speech, rerank and realtime models outside MODEL_IDS have no
// route here, so listing them would only add models that fail.
const UNSERVED_MODEL = /(realtime|tts|asr|image|video|wan\d|wanx|happyhorse|rerank|paraformer|sensevoice|cosyvoice|livetranslate|decision|-[sti]2v|kf2v|-s2s|omni-turbo-realtime)/i;

export function servedModel(id) {
  return MODEL_IDS.indexOf(id) >= 0 || !UNSERVED_MODEL.test(id);
}

// The DashScope hosts serve Bailian's full pay-as-you-go catalog.
export function payAsYouGoHost(baseUrl) {
  const host = String(baseUrl || "").replace(/^https?:\/\//i, "").split(/[/:?#]/)[0].toLowerCase();
  return /^dashscope(-intl)?\.aliyuncs\.com$/.test(host);
}

// Bailian's pay-as-you-go model list leaves out video models and the Wan 2.6 / 2.5
// image models, which the same key can call; a pay-as-you-go channel gets them added.
export function modelListReply(response, state, baseUrl) {
  const parsed = typeof response.body === "string" ? parseJSON(response.body) : null;
  if (!isObject(parsed) || !Array.isArray(parsed.data)) return convertError(502, "Bailian returned an unreadable model list");
  const ids = isObject(state) && Array.isArray(state.ids) ? state.ids.slice() : [];
  const pages = (isObject(state) && Number.isInteger(state.pages) ? state.pages : 0) + 1;
  const payg = isObject(state) && typeof state.payg === "boolean" ? state.payg : payAsYouGoHost(baseUrl);
  for (const item of parsed.data) {
    const id = isObject(item) && typeof item.id === "string" ? item.id.trim() : "";
    if (id && servedModel(id) && ids.indexOf(id) < 0) ids.push(id);
  }
  const last = typeof parsed.last_id === "string" ? parsed.last_id : "";
  if (parsed.has_more === true && last && pages < MODEL_LIST_MAX_PAGES) {
    return { next: { method: "GET", path: MODEL_LIST_PATH + "?after=" + encodeURIComponent(last) }, state: { kind: "models", ids: ids, pages: pages, payg: payg } };
  }
  if (payg) for (const id of Object.keys(IMAGE_MODELS).concat(Object.keys(VIDEO_MODELS))) if (ids.indexOf(id) < 0) ids.push(id);
  return { body: { object: "list", data: ids.map(function (id) { return { id: id, object: "model", owned_by: "bailian" }; }) }, contentType: "application/json" };
}
const TRANSCRIPTION_PATH = "/v1/audio/transcriptions";
const DEFAULT_VOICE = "longanhuan_v3.6";
const MAX_IMAGE_OUTPUTS = 12;
const MAX_INPUT_IMAGE_BYTES = 20971520;
// Qwen-Image 3.0 switches to the 2K output tier above this pixel area.
const QWEN3_1K_MAX_PIXELS = 2250000;
// Longest billable wan3.0 output (smart duration -1 or reference-video input).
const WAN3_MAX_SECONDS = 30;

const SERVICE = {
  multimodal: "/api/v1/services/aigc/multimodal-generation/generation",
  imageGeneration: "/api/v1/services/aigc/image-generation/generation",
  text2image: "/api/v1/services/aigc/text2image/image-synthesis",
  image2image: "/api/v1/services/aigc/image2image/image-synthesis",
  video: "/api/v1/services/aigc/video-generation/video-synthesis",
};

// ---------------------------------------------------------------------------
// Small helpers

function fail(message) {
  throw new Error(message);
}

function isObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function own(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function trimmed(value) {
  return typeof value === "string" ? value.trim() : "";
}

function objectValue(value, name) {
  if (value === undefined || value === null) return {};
  if (!isObject(value)) fail(name + " must be an object");
  return value;
}

function clone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function isFileRef(value) {
  return isObject(value) && typeof value.__fileRef === "string";
}

// HTTP(S) URLs, data URLs and Bailian oss:// temporary uploads.
function isMediaInput(value, kind) {
  if (isFileRef(value)) return true;
  if (typeof value !== "string") return false;
  const re = kind === "image" ? /^(https?:\/\/|data:image\/|oss:\/\/)/i : /^(https?:\/\/|data:[a-z]+\/|oss:\/\/)/i;
  return re.test(value.trim());
}

function modelOf(ctx) {
  return trimmed(ctx && ctx.upstreamModel) || trimmed(ctx && ctx.model) || trimmed(((ctx && ctx.requestBody) || {}).model);
}

// The profile of the upstream model, else of the declared model (a channel
// mapping may point a declared model at a vendor snapshot id).
function lookup(table, ctx) {
  const names = [trimmed(ctx && ctx.upstreamModel), trimmed(ctx && ctx.model), trimmed(((ctx && ctx.requestBody) || {}).model)];
  for (const name of names) if (name && own(table, name)) return table[name];
  return null;
}

export function imageProfile(ctx) {
  return lookup(IMAGE_MODELS, ctx);
}

export function videoProfile(ctx) {
  return lookup(VIDEO_MODELS, ctx);
}

function headerValue(headers, name) {
  const want = name.toLowerCase();
  for (const key of Object.keys(headers || {})) if (key.toLowerCase() === want) return headers[key];
  return "";
}

function dashScopeHeaders(ctx, asynchronous) {
  const headers = { "Content-Type": "application/json", Authorization: "Bearer " + ctx.apiKey };
  if (asynchronous && !viaGateway(ctx)) headers["X-DashScope-Async"] = "enable";
  if (trimmed(headerValue(ctx.requestHeaders, "X-DashScope-OssResourceResolve")) === "enable") headers["X-DashScope-OssResourceResolve"] = "enable";
  return headers;
}

// A type-60 New API channel: the same plugin answers on another gateway,
// which serves the Bailian paths under the plugin's key with its own token
// (Authorization: Bearer). Hosts that never set ctx.upstream mean the vendor.
function viaGateway(ctx) {
  return !!(ctx && ctx.upstream && ctx.upstream.kind === "new_api");
}

function apiUrl(ctx, path) {
  return String(ctx.baseUrl || "").replace(/\/+$/, "") + (viaGateway(ctx) ? "/" + PLUGIN_KEY : "") + path;
}

function vendorError(body) {
  if (!isObject(body)) return "";
  if (body.code) return String(body.code) + ": " + String(body.message || "");
  const output = isObject(body.output) ? body.output : {};
  if (output.code) return String(output.code) + ": " + String(output.message || "");
  return "";
}

// ---------------------------------------------------------------------------
// Images

const IMAGE_PARAMS = {
  qwen3: ["n", "size", "negative_prompt", "prompt_extend", "prompt_extend_mode", "enable_thinking", "watermark", "seed"],
  qwen21: ["n", "size", "prompt_extend", "prompt_extend_mode", "enable_thinking", "watermark", "seed"],
  qwen: ["n", "size", "negative_prompt", "prompt_extend", "watermark", "seed"],
  zimage: ["n", "size", "prompt_extend", "seed"],
  wan27: ["n", "size", "negative_prompt", "prompt_extend", "watermark", "seed", "enable_sequential", "thinking_mode", "bbox_list", "color_palette"],
  wan26i: ["n", "size", "negative_prompt", "prompt_extend", "watermark", "seed"],
  wan26t: ["n", "size", "negative_prompt", "prompt_extend", "watermark", "seed"],
  wan25t: ["n", "size", "negative_prompt", "prompt_extend", "watermark", "seed"],
  wan25e: ["n", "size", "negative_prompt", "prompt_extend", "watermark", "seed"],
};
const BOOLEAN_PARAMS = ["prompt_extend", "watermark", "enable_sequential", "thinking_mode", "enable_thinking"];

// Pixel-area bounds (as square sides), the widest aspect ratio, and the size presets per family.
// Wan 2.6 / 2.5 text to image document 1280*1280 to 1440*1440 but list presets such as
// 1696*960 (1.63 MP), so their lower bound is the smallest documented preset.
const IMAGE_SIZES = {
  qwen3: { min: 512, max: 2048, ratio: 8, presets: [] },
  qwen21: { min: 512, max: 2048, ratio: 8, presets: [] },
  qwen: { min: 512, max: 2048, ratio: 8, presets: [] },
  zimage: { min: 512, max: 2048, ratio: 8, presets: [] },
  wan27: { min: 0, max: 2048, ratio: 8, presets: ["1K", "2K", "4K"] },
  wan26i: { min: 768, max: 2048, ratio: 4, presets: ["1K", "2K"] },
  wan26t: { min: 1280, max: 1440, minPixels: 1625088, ratio: 4, presets: [] },
  wan25t: { min: 1280, max: 1440, minPixels: 1625088, ratio: 4, presets: [] },
  wan25e: { min: 768, max: 1280, ratio: 4, presets: [] },
};

function parseSize(size) {
  const match = /^(\d+)\*(\d+)$/.exec(size);
  if (!match) return null;
  const width = Number(match[1]);
  const height = Number(match[2]);
  if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height) || width <= 0 || height <= 0) return null;
  return { width: width, height: height, pixels: width * height };
}

function imageService(profile, req) {
  if (profile.family === "wan25t") return { path: SERVICE.text2image, asynchronous: true };
  if (profile.family === "wan25e") return { path: SERVICE.image2image, asynchronous: true };
  if ((profile.family === "wan26i" || profile.family === "wan26t") && req.mode === "async") return { path: SERVICE.imageGeneration, asynchronous: true };
  return { path: SERVICE.multimodal, asynchronous: false };
}

// Validates an image request ({input: {messages}, parameters}) for the model and
// returns the Bailian body to send plus the counts that drive billing.
export function buildImageBody(ctx) {
  const profile = imageProfile(ctx);
  if (!profile) fail("unsupported image model: " + modelOf(ctx));
  const family = profile.family;
  const model = modelOf(ctx);
  const req = ctx.requestBody || {};
  const input = clone(objectValue(req.input, "input"));
  const rawParameters = objectValue(req.parameters, "parameters");
  const allowed = IMAGE_PARAMS[family];
  const parameters = {};
  for (const key of Object.keys(rawParameters)) {
    if (!allowed.includes(key)) fail("parameters." + key + " is not supported by " + model);
    parameters[key] = clone(rawParameters[key]);
  }
  for (const key of Object.keys(input)) {
    if (key !== "messages") fail("input." + key + " is not supported; send input.messages");
  }
  for (const key of BOOLEAN_PARAMS) {
    if (parameters[key] !== undefined && typeof parameters[key] !== "boolean") fail(key + " must be a boolean");
  }
  const messages = input.messages;
  if (!Array.isArray(messages) || messages.length !== 1 || !isObject(messages[0]) || messages[0].role !== "user" || !Array.isArray(messages[0].content))
    fail("input.messages must contain one user message with a content array");
  let prompt = "";
  let texts = 0;
  const images = [];
  for (const part of messages[0].content) {
    if (!isObject(part)) fail("invalid image message content");
    for (const key of Object.keys(part)) if (key !== "text" && key !== "image") fail("unsupported message content field: " + key);
    if (part.text !== undefined) {
      if (typeof part.text !== "string" || !part.text.trim()) fail("prompt must be a non-empty string");
      prompt = part.text;
      texts++;
    }
    if (part.image !== undefined) {
      if (!isMediaInput(part.image, "image")) fail("image must be an HTTP(S) URL or a Base64 data URL");
      images.push(part.image);
    }
  }
  if (texts !== 1) fail("exactly one text prompt is required");
  if (profile.maxInput === 0 && images.length) fail(model + " only supports text to image");
  if (images.length > profile.maxInput) fail(model + " accepts at most " + profile.maxInput + " input images");
  if (profile.minInput && images.length < profile.minInput)
    fail(family === "wan26i" ? "wan2.6-image edits images: send 1 to 4 input images, or use wan2.6-t2i for text to image" : model + " requires 1 to " + profile.maxInput + " input images");

  const sequential = parameters.enable_sequential === true;
  const maxN = sequential ? MAX_IMAGE_OUTPUTS : profile.maxN;
  if (parameters.n === undefined) parameters.n = 1;
  if (!Number.isInteger(parameters.n) || parameters.n < 1 || parameters.n > maxN) fail(maxN === 1 ? "n must be 1 for " + model : "n must be an integer between 1 and " + maxN);
  if (parameters.seed !== undefined && (!Number.isInteger(parameters.seed) || parameters.seed < 0 || parameters.seed > 2147483647))
    fail("seed must be an integer between 0 and 2147483647");
  if (parameters.negative_prompt !== undefined && typeof parameters.negative_prompt !== "string") fail("negative_prompt must be a string");
  if (parameters.prompt_extend_mode !== undefined) {
    if (parameters.prompt_extend_mode !== "direct" && parameters.prompt_extend_mode !== "agent") fail("prompt_extend_mode must be direct or agent");
    if (parameters.prompt_extend_mode === "agent" && images.length) fail("prompt_extend_mode agent only supports text to image");
  }
  // Z-Image takes no n and is priced by prompt rewriting, so its default is sent.
  if (family === "zimage") {
    delete parameters.n;
    if (parameters.prompt_extend === undefined) parameters.prompt_extend = false;
  }

  let dims = null;
  if (parameters.size !== undefined) {
    const rule = IMAGE_SIZES[family];
    if (typeof parameters.size !== "string") fail("size must be a string such as 1024*1024");
    parameters.size = parameters.size.trim().replace(/x/i, "*");
    if (["1K", "2K", "4K"].includes(parameters.size.toUpperCase())) {
      parameters.size = parameters.size.toUpperCase();
      if (!rule.presets.includes(parameters.size)) fail(model + " requires a width*height size" + (rule.presets.length ? " or one of " + rule.presets.join(", ") : ""));
      if (parameters.size === "4K" && !(profile.allow4K && images.length === 0 && !sequential))
        fail("4K is only supported by wan2.7-image-pro text-to-image without sequential output");
    } else {
      dims = parseSize(parameters.size);
      if (!dims) fail("size must be width*height, for example 1024*1024");
      const minPixels = rule.minPixels || rule.min * rule.min;
      if (dims.pixels > rule.max * rule.max || dims.pixels < minPixels || dims.width / dims.height > rule.ratio || dims.height / dims.width > rule.ratio)
        fail("size is outside the model's pixel and aspect-ratio limits" + (rule.min ? " (" + rule.min + "*" + rule.min + " to " + rule.max + "*" + rule.max + ", up to " + rule.ratio + ":1)" : ""));
    }
  }

  const service = imageService(profile, req);
  let body;
  if (family === "wan25t" || family === "wan25e") {
    // The legacy image-synthesis services take a prompt and an images list.
    const legacyInput = { prompt: prompt };
    if (parameters.negative_prompt !== undefined) {
      legacyInput.negative_prompt = parameters.negative_prompt;
      delete parameters.negative_prompt;
    }
    if (family === "wan25e") legacyInput.images = images.map(clone);
    body = { model: model, input: legacyInput, parameters: parameters };
  } else body = { model: model, input: input, parameters: parameters };
  return {
    body: body,
    inputImages: images.length,
    dims: dims,
    action: images.length ? "image_to_image" : "text_to_image",
    path: service.path,
    asynchronous: service.asynchronous,
  };
}

function imageEstimate(ctx, built) {
  const family = imageProfile(ctx).family;
  const facts = { image_count: family === "zimage" ? 1 : built.body.parameters.n };
  if (family === "qwen3") {
    facts.output_image_type = built.dims && built.dims.pixels <= QWEN3_1K_MAX_PIXELS ? "qima_output_1k" : "qima_output_2k";
    facts.input_image_count = built.inputImages;
  }
  if (family === "zimage") facts.prompt_extend = built.body.parameters.prompt_extend === true;
  return facts;
}

export function imageOutputs(body) {
  const output = (isObject(body) && isObject(body.output)) ? body.output : {};
  const images = [];
  for (const choice of Array.isArray(output.choices) ? output.choices : []) {
    const content = choice && choice.message && Array.isArray(choice.message.content) ? choice.message.content : [];
    for (const part of content) if (part && typeof part.image === "string" && part.image) images.push(part.image);
  }
  for (const result of Array.isArray(output.results) ? output.results : []) {
    if (result && typeof result.url === "string" && result.url) images.push(result.url);
  }
  return images;
}

// Completion facts: usage.image_count (Wan, Qwen 2.x, Z-Image) or the Qwen-Image 3.0
// output/input counts, else the delivered images. Invalid counts keep the
// reservation instead of guessing. Z-Image's prompt_extend fact stays as reserved.
function imageUsage(ctx, body) {
  const usage = (isObject(body) && isObject(body.usage)) ? body.usage : {};
  const images = imageOutputs(body);
  if (images.length > MAX_IMAGE_OUTPUTS) fail("too many output images");
  const reported = usage.image_count !== undefined ? usage.image_count : usage.output_image_count;
  let count;
  if (reported !== undefined) {
    if (!Number.isInteger(reported) || reported < 0 || reported > MAX_IMAGE_OUTPUTS || (images.length && reported === 0)) fail("invalid upstream image count");
    count = reported;
  } else if (images.length) count = images.length;
  else return {};
  const facts = { image_count: count };
  if ((imageProfile(ctx) || {}).family === "qwen3") {
    if (usage.output_image_type === "qima_output_1k" || usage.output_image_type === "qima_output_2k") facts.output_image_type = usage.output_image_type;
    if (Number.isInteger(usage.input_image_count) && usage.input_image_count >= 0 && usage.input_image_count <= 3) facts.input_image_count = usage.input_image_count;
  }
  return facts;
}

function imageDatum(image) {
  if (/^https?:\/\//i.test(image)) return { url: image };
  const match = /^data:[^;,]*;base64,(.*)$/s.exec(image);
  return { b64_json: match ? match[1] : image };
}

// An image task Bailian runs asynchronously (submit returns a task id).
function asyncImage(ctx) {
  const profile = imageProfile(ctx);
  return !!profile && imageService(profile, (ctx && ctx.requestBody) || {}).asynchronous;
}

// ---------------------------------------------------------------------------
// Video (asynchronous video-synthesis)

const VIDEO_PARAMS = {
  wan3: ["resolution", "ratio", "duration", "prompt_extend", "watermark", "audio", "seed", "shot_type"],
  t2v: ["resolution", "ratio", "duration", "watermark", "seed"],
  i2v: ["resolution", "duration", "watermark", "seed"],
  r2v: ["resolution", "ratio", "duration", "watermark", "seed"],
  t27: ["resolution", "ratio", "duration", "prompt_extend", "watermark", "seed"],
  i27: ["resolution", "duration", "prompt_extend", "watermark", "seed"],
  size: ["size", "resolution", "ratio", "duration", "prompt_extend", "shot_type", "watermark", "seed"],
  img: ["resolution", "duration", "prompt_extend", "shot_type", "audio", "watermark", "seed"],
};
const VIDEO_INPUT = {
  wan3: ["prompt", "negative_prompt", "media"],
  t2v: ["prompt"],
  i2v: ["prompt", "media"],
  r2v: ["prompt", "media"],
  t27: ["prompt", "negative_prompt", "audio_url"],
  i27: ["prompt", "negative_prompt", "media"],
  size: ["prompt", "negative_prompt", "audio_url"],
  img: ["prompt", "negative_prompt", "img_url", "audio_url"],
};
const MEDIA_LIMITS = {
  wan3: { first_frame: 1, last_frame: 1, reference_image: 10, reference_video: 5, reference_audio: 5, file: 1, link: 1 },
  t2v: {},
  i2v: { first_frame: 1 },
  r2v: { reference_image: 9 },
  i27: { first_frame: 1, last_frame: 1, driving_audio: 1, first_clip: 1 },
};
const TEXT_ONLY_VIDEO = { t2v: "happyhorse-1.1-i2v or happyhorse-1.1-r2v", t27: "wan2.7-i2v", size: "wan2.6-i2v" };

export function normalizeResolution(value) {
  let resolution = String(value === undefined || value === null ? "" : value).trim().toUpperCase();
  if (!resolution) return "";
  if (!resolution.endsWith("P")) resolution += "P";
  return resolution;
}

const SIZE_TABLE = {
  "480P": { "16:9": "832*480", "9:16": "480*832", "1:1": "624*624", "4:3": "720*544", "3:4": "544*720" },
  "720P": { "16:9": "1280*720", "9:16": "720*1280", "1:1": "960*960", "4:3": "1104*832", "3:4": "832*1104" },
  "1080P": { "16:9": "1920*1080", "9:16": "1080*1920", "1:1": "1440*1440", "4:3": "1648*1248", "3:4": "1248*1648" },
};
// Pixel sizes of the Wan 2.6 / 2.5 text-to-video size parameter.
const LEGACY_SIZES = {
  "480P": { "16:9": "832*480", "9:16": "480*832", "1:1": "624*624" },
  "720P": { "16:9": "1280*720", "9:16": "720*1280", "1:1": "960*960", "4:3": "1088*832", "3:4": "832*1088" },
  "1080P": { "16:9": "1920*1080", "9:16": "1080*1920", "1:1": "1440*1440", "4:3": "1632*1248", "3:4": "1248*1632" },
};

function tableSize(table, size) {
  for (const resolution of Object.keys(table)) {
    for (const ratio of Object.keys(table[resolution])) if (table[resolution][ratio] === size) return { resolution: resolution, ratio: ratio };
  }
  return null;
}

// OpenAI "1280x720" sizes and "720p" tiers to {resolution, ratio}.
export function videoSize(value) {
  const size = String(value).trim().replace(/x/i, "*");
  if (!size.includes("*")) return { resolution: normalizeResolution(size) };
  const known = tableSize(SIZE_TABLE, size) || tableSize(LEGACY_SIZES, size);
  if (known) return known;
  const dims = parseSize(size);
  if (dims) {
    const short = Math.min(dims.width, dims.height);
    const resolution = short <= 540 ? "480P" : short <= 800 ? "720P" : "1080P";
    const named = [["16:9", 16 / 9], ["9:16", 9 / 16], ["1:1", 1], ["4:3", 4 / 3], ["3:4", 3 / 4], ["21:9", 21 / 9], ["9:21", 9 / 21], ["4:5", 4 / 5], ["5:4", 5 / 4]];
    const actual = dims.width / dims.height;
    for (const pair of named) if (Math.abs(pair[1] - actual) / pair[1] < 0.02) return { resolution: resolution, ratio: pair[0] };
  }
  fail("unsupported size: " + value);
}

// The resolution tier of a reported "1920×1080" or "832*480" size.
function sizeTier(value) {
  const match = /^(\d+)\s*[x*×]\s*(\d+)$/i.exec(String(value || "").trim());
  if (!match) return "";
  const short = Math.min(Number(match[1]), Number(match[2]));
  return short <= 540 ? "480P" : short <= 800 ? "720P" : "1080P";
}

// Validates a Bailian video body for the model; price-determining defaults
// (resolution, duration, audio) are always sent so the reservation matches the render.
export function buildVideoBody(ctx) {
  const profile = videoProfile(ctx);
  if (!profile) fail("unsupported video model: " + modelOf(ctx));
  const kind = profile.kind;
  const model = modelOf(ctx);
  const req = ctx.requestBody || {};
  const rawInput = Object.assign({}, objectValue(req.input, "input"));
  const rawParameters = objectValue(req.parameters, "parameters");
  // Wan 2.7 image to video takes its audio as a driving_audio media entry.
  const drivingAudio = kind === "i27" ? rawInput.audio_url : undefined;
  if (kind === "i27") delete rawInput.audio_url;
  const input = {};
  for (const key of Object.keys(rawInput)) {
    if (!VIDEO_INPUT[kind].includes(key)) fail("input." + key + " is not supported by " + model);
    input[key] = clone(rawInput[key]);
  }
  const parameters = {};
  for (const key of Object.keys(rawParameters)) {
    if (!VIDEO_PARAMS[kind].includes(key)) fail("parameters." + key + " is not supported by " + model);
    if (key === "shot_type" && (kind === "size" || kind === "img") && !profile.shotType) fail("parameters.shot_type is not supported by " + model);
    if (key === "audio" && kind === "img" && !profile.audio) fail("parameters.audio is not supported by " + model);
    parameters[key] = clone(rawParameters[key]);
  }
  for (const key of ["prompt_extend", "watermark", "audio"]) {
    if (parameters[key] !== undefined && typeof parameters[key] !== "boolean") fail(key + " must be a boolean");
  }
  for (const key of ["prompt", "negative_prompt"]) if (input[key] !== undefined && typeof input[key] !== "string") fail(key + " must be a string");
  for (const key of ["audio_url", "img_url"]) if (input[key] !== undefined && !isMediaInput(input[key], key === "img_url" ? "image" : "any")) fail("input." + key + " must be an HTTP(S) URL or a Base64 data URL");

  // Generic image references from the OpenAI protocol become media entries or img_url.
  const refs = Array.isArray(req.images) ? req.images : [];
  if (refs.length) {
    if (own(TEXT_ONLY_VIDEO, kind)) fail(model + " is text-to-video only; use " + TEXT_ONLY_VIDEO[kind] + " with images");
    if (kind === "img") {
      if (input.img_url !== undefined) fail("send either images or input.img_url, not both");
      if (refs.length > 1) fail(model + " takes exactly one first-frame image");
      if (!isMediaInput(refs[0], "image")) fail("image references must be HTTP(S) URLs or Base64 data URLs");
      input.img_url = clone(refs[0]);
    } else {
      if (input.media !== undefined) fail("send either images or input.media, not both");
      input.media = refs.map(function (url, index) {
        const type = kind === "r2v" ? "reference_image" : index === 0 ? "first_frame" : "last_frame";
        return { type: type, url: clone(url) };
      });
    }
  }
  if (drivingAudio !== undefined) {
    if (input.media !== undefined && !Array.isArray(input.media)) fail("input.media must be an array");
    input.media = (input.media || []).concat([{ type: "driving_audio", url: clone(drivingAudio) }]);
  }
  const counts = {};
  if (input.media !== undefined) {
    if (!Array.isArray(input.media)) fail("input.media must be an array");
    const limits = MEDIA_LIMITS[kind];
    for (const media of input.media) {
      if (!isObject(media) || !own(limits, media.type)) fail("unsupported input.media type for " + model + ": " + String(media && media.type));
      for (const key of Object.keys(media)) if (key !== "type" && key !== "url") fail("unsupported input.media field: " + key);
      if (!isMediaInput(media.url, media.type.indexOf("image") >= 0 || media.type.indexOf("frame") >= 0 ? "image" : "any"))
        fail("input.media url must be an HTTP(S) URL or a Base64 data URL");
      counts[media.type] = (counts[media.type] || 0) + 1;
      if (counts[media.type] > limits[media.type]) fail("too many input.media entries of type " + media.type);
    }
    if (!input.media.length) delete input.media;
  }
  const hasPrompt = !!trimmed(input.prompt);
  if ((kind === "t2v" || kind === "t27" || kind === "size") && !hasPrompt) fail("prompt is required");
  if (kind === "i2v" && counts.first_frame !== 1) fail(model + " requires exactly one first-frame image");
  if (kind === "img" && input.img_url === undefined) fail(model + " requires a first-frame image (image or input.img_url)");
  if (kind === "r2v") {
    if (!hasPrompt) fail("prompt is required");
    if (!counts.reference_image) fail(model + " requires 1 to 9 reference images");
  }
  if (kind === "i27") {
    if (counts.first_clip ? counts.first_frame || counts.driving_audio : !counts.first_frame)
      fail(model + " takes first_frame (with optional last_frame and driving_audio) or first_clip (with optional last_frame)");
  }
  if (kind === "wan3") {
    const frames = counts.first_frame || counts.last_frame;
    const references = counts.reference_image || counts.reference_video || counts.reference_audio || counts.file || counts.link;
    if ((frames && references) || (counts.file && counts.link) || (counts.last_frame && !counts.first_frame)) fail("unsupported wan3.0 input.media combination");
    if (!hasPrompt && !input.media) fail(model + " requires a prompt or input.media");
  }

  // Resolution: the size parameter (Wan 2.6 / 2.5 text to video) or a resolution tier.
  const resolutions = profile.resolutions || VIDEO_RESOLUTIONS;
  let ratio = parameters.ratio;
  if (ratio === undefined && profile.ratios && typeof req.ratioFromSize === "string" && req.ratioFromSize) ratio = req.ratioFromSize;
  let resolution;
  if (kind === "size" && parameters.size !== undefined) {
    if (parameters.resolution !== undefined || parameters.ratio !== undefined) fail("send either size or resolution and ratio, not both");
    const found = typeof parameters.size === "string" ? tableSize(LEGACY_SIZES, parameters.size.trim().replace(/x/i, "*")) : null;
    if (!found || !resolutions.includes(found.resolution)) fail(model + " size must be one of " + resolutions.map(function (r) { return Object.values(LEGACY_SIZES[r]).join(", "); }).join(", "));
    resolution = found.resolution;
    parameters.size = LEGACY_SIZES[found.resolution][found.ratio];
  } else {
    resolution = normalizeResolution(parameters.resolution === undefined ? "1080P" : parameters.resolution);
    if (!resolutions.includes(resolution)) fail(model + " resolution must be one of " + resolutions.join(", "));
    if (profile.ratios) {
      if (ratio === undefined) ratio = profile.defaultRatio;
      if (!profile.ratios.includes(ratio)) fail(model + " ratio must be one of " + profile.ratios.join(", "));
    }
    if (kind === "size") {
      const pixels = LEGACY_SIZES[resolution][ratio];
      if (!pixels) fail(model + " has no " + ratio + " size at " + resolution);
      parameters.size = pixels;
      delete parameters.resolution;
      delete parameters.ratio;
    } else {
      parameters.resolution = resolution;
      if (profile.ratios) parameters.ratio = ratio;
    }
  }

  if (parameters.duration === undefined) parameters.duration = 5;
  if (typeof parameters.duration === "string" && parameters.duration.trim() !== "") parameters.duration = Number(parameters.duration);
  const duration = parameters.duration;
  const smart = kind === "wan3" && duration === -1;
  if (profile.durations) {
    if (!profile.durations.includes(duration)) fail(model + " duration must be one of " + profile.durations.join(", "));
  } else if (!smart && (!Number.isInteger(duration) || duration < profile.minDuration || duration > profile.maxDuration))
    fail(model + " duration must be " + (kind === "wan3" ? "-1 or " : "") + "an integer between " + profile.minDuration + " and " + profile.maxDuration);
  const minSeed = kind === "wan3" ? -1 : 0;
  if (parameters.seed !== undefined && (!Number.isInteger(parameters.seed) || parameters.seed < minSeed || parameters.seed > 2147483647))
    fail("seed must be an integer between " + minSeed + " and 2147483647");
  if (parameters.shot_type !== undefined) {
    if (typeof parameters.shot_type !== "string") fail("shot_type must be a string");
    if ((kind === "size" || kind === "img") && parameters.shot_type !== "single" && parameters.shot_type !== "multi") fail("shot_type must be single or multi");
  }
  if (profile.audio && parameters.audio === undefined) parameters.audio = true;

  let seconds = duration;
  if (kind === "wan3" && (smart || counts.reference_video)) seconds = WAN3_MAX_SECONDS;
  const action = input.media || input.img_url ? "image_to_video" : "text_to_video";
  const result = { body: { model: model, input: input, parameters: parameters }, seconds: seconds, resolution: resolution, action: action };
  if (profile.audio) result.audio = parameters.audio;
  return result;
}

export function videoUrl(body) {
  const output = (isObject(body) && isObject(body.output)) ? body.output : {};
  return trimmed(output.video_url) || trimmed(isObject(output.results) ? output.results.video_url : "");
}

// ---------------------------------------------------------------------------
// Driver hooks (task part)

export function buildSubmitRequest(ctx) {
  if (imageProfile(ctx)) {
    const built = buildImageBody(ctx);
    return {
      url: apiUrl(ctx, built.path),
      method: "POST",
      headers: dashScopeHeaders(ctx, built.asynchronous),
      body: built.body,
      action: built.action,
    };
  }
  const built = buildVideoBody(ctx);
  return {
    url: apiUrl(ctx, SERVICE.video),
    method: "POST",
    headers: dashScopeHeaders(ctx, true),
    body: built.body,
    action: built.action,
  };
}

export function parseSubmitResponse(ctx, resp) {
  const body = (resp && resp.body) || {};
  const error = vendorError(body);
  if (error) fail(error);
  const output = isObject(body.output) ? body.output : {};
  if (imageProfile(ctx) && !asyncImage(ctx)) {
    const images = imageOutputs(body);
    if (!images.length) fail("the image response has no images");
    const taskId = ctx.publicTaskId || body.request_id;
    if (!taskId) fail("missing image request id");
    return { taskId: taskId, taskData: body, immediate: { status: "SUCCESS", progress: "100%", url: images[0] } };
  }
  if (!trimmed(output.task_id)) fail("task_id is empty");
  return { taskId: output.task_id, taskData: body };
}

export function extractUsage(ctx) {
  if (imageProfile(ctx)) {
    const facts = imageEstimate(ctx, buildImageBody(ctx));
    if (ctx.usagePurpose === "billing_ratios") return { image_count: facts.image_count };
    return facts;
  }
  const built = buildVideoBody(ctx);
  if (ctx.usagePurpose === "billing_ratios") return null;
  const facts = { seconds: built.seconds, resolution: built.resolution };
  if (built.audio !== undefined) facts.audio = built.audio;
  return facts;
}

// Legacy per-call pricing: the delivered image count.
export function extractUsageOnSubmit(ctx, body) {
  if (!imageProfile(ctx) || asyncImage(ctx)) return {};
  const facts = imageUsage(ctx, body || {});
  return facts.image_count === undefined ? {} : { image_count: facts.image_count };
}

export function extractUsageOnComplete(task, result, body) {
  if (!body) return null;
  if (imageProfile(task)) {
    const facts = imageUsage(task, body);
    return Object.keys(facts).length ? facts : null;
  }
  const usage = isObject(body.usage) ? body.usage : {};
  const output = isObject(body.output) ? body.output : {};
  const facts = {};
  const profile = videoProfile(task) || {};
  if (profile.kind === "wan3") {
    // Wan 3.0 bills input + output seconds; partial statistics keep the reservation.
    const outputSeconds = usage.output_video_duration !== undefined ? usage.output_video_duration : usage.duration;
    const inputSeconds = usage.input_video_duration;
    if (inputSeconds !== undefined && outputSeconds !== undefined) {
      if (typeof inputSeconds === "number" && typeof outputSeconds === "number") facts.seconds = inputSeconds + outputSeconds;
      else facts.seconds = typeof inputSeconds === "number" ? outputSeconds : inputSeconds;
    }
  } else if (["t27", "i27", "size", "img"].includes(profile.kind)) {
    // Wan 2.7 / 2.6 bill usage.duration; Wan 2.5 reports usage.video_duration.
    const seconds = usage.duration !== undefined ? usage.duration : usage.output_video_duration !== undefined ? usage.output_video_duration : usage.video_duration;
    if (seconds !== undefined) facts.seconds = seconds;
  } else {
    const outputSeconds = usage.output_video_duration !== undefined ? usage.output_video_duration : usage.duration;
    if (outputSeconds !== undefined) facts.seconds = outputSeconds;
  }
  const resolution = usage.SR !== undefined ? usage.SR : output.resolution !== undefined ? output.resolution : sizeTier(usage.size || usage.video_ratio);
  if (resolution !== undefined && resolution !== null && resolution !== "") facts.resolution = normalizeResolution(resolution);
  if (profile.audio && typeof usage.audio === "boolean") facts.audio = usage.audio;
  return Object.keys(facts).length ? facts : null;
}

export function buildQueryRequest(ctx) {
  return { url: apiUrl(ctx, "/api/v1/tasks/" + encodeURIComponent(ctx.taskId)), method: "GET", headers: { Authorization: "Bearer " + ctx.apiKey } };
}

export function parseTaskResult(ctx, body) {
  const output = (isObject(body) && isObject(body.output)) ? body.output : {};
  const status = output.task_status;
  if (status === "PENDING") return { status: "QUEUED" };
  if (status === "RUNNING") return { status: "IN_PROGRESS" };
  if (status === "SUCCEEDED") {
    if (imageProfile(ctx) || Array.isArray(output.results) || Array.isArray(output.choices)) {
      const images = imageOutputs(body);
      if (!images.length) return { status: "FAILURE", reason: vendorFailure(output) || "the task succeeded without an image" };
      return { status: "SUCCESS", progress: "100%", url: images[0] };
    }
    const url = videoUrl(body);
    if (!url) return { status: "FAILURE", reason: "the task succeeded without a video" };
    return { status: "SUCCESS", progress: "100%", url: url };
  }
  if (status === "FAILED" || status === "CANCELED" || status === "UNKNOWN") {
    const reason = vendorError(body) || (output.message ? String(output.message) : "") || "task " + String(status).toLowerCase();
    return { status: "FAILURE", reason: reason };
  }
  return { status: "UNKNOWN", reason: "unrecognized task status: " + String(status || "") };
}

// The first per-image error of a Wan 2.5 image task (results[].code).
function vendorFailure(output) {
  for (const result of Array.isArray(output.results) ? output.results : []) {
    if (result && result.code) return String(result.code) + ": " + String(result.message || "");
  }
  return "";
}

export function listArtifacts(task) {
  if (!task || task.status !== "SUCCESS") return [];
  return videoUrl(task.data) ? [{ key: "video", type: "video", mimeType: "video/mp4" }] : [];
}

// Video URLs are signed and expire after 24 hours: ask Bailian for a fresh
// one, fall back to the stored snapshot, and download without credentials.
// Through another New API gateway the fresh reply carries that gateway's own
// signed download link.
export function buildContentRequest(ctx) {
  if (viaGateway(ctx)) {
    if (!ctx.upstreamTaskId) throw new Error("artifact_not_found");
    return {
      url: String(ctx.baseUrl || "").replace(/\/+$/, "") + "/v1/tasks/" + encodeURIComponent(ctx.upstreamTaskId) + "/artifacts/" + encodeURIComponent(ctx.artifactKey) + "/content",
      method: (ctx.clientRequest && ctx.clientRequest.method) || "GET",
      headers: { Authorization: "Bearer " + ctx.apiKey },
    };
  }
  if (ctx.artifactKey !== "video") fail("artifact_not_found");
  let url = "";
  if (ctx.upstreamTaskId && typeof utils !== "undefined" && utils && typeof utils.fetch === "function") {
    try {
      const fresh = utils.fetch({
        url: apiUrl(ctx, "/api/v1/tasks/" + encodeURIComponent(ctx.upstreamTaskId)),
        method: "GET",
        headers: { Authorization: "Bearer " + ctx.apiKey },
      });
      if (fresh && fresh.status >= 200 && fresh.status < 300) url = videoUrl(fresh.body);
    } catch (e) {
      url = "";
    }
  }
  if (!url) url = videoUrl(ctx.data);
  if (!url) fail("artifact_not_found");
  return { url: url, method: (ctx.clientRequest && ctx.clientRequest.method) || "GET", credentialless: true };
}

// ---------------------------------------------------------------------------
// Native Bailian routes

function jsonBody(ctx) {
  if (!ctx.body || ctx.body.kind !== "json" || !isObject(ctx.body.value)) fail("JSON object body required");
  return ctx.body.value;
}

function nativeImage(ctx, mode) {
  const req = jsonBody(ctx);
  for (const key of Object.keys(req)) if (!["model", "input", "parameters"].includes(key)) fail("unsupported field: " + key);
  const requestBody = { model: req.model, input: clone(objectValue(req.input, "input")), parameters: clone(objectValue(req.parameters, "parameters")) };
  if (mode) requestBody.mode = mode;
  const content = isObject(requestBody.input) && Array.isArray(requestBody.input.messages) && requestBody.input.messages[0] && requestBody.input.messages[0].content;
  const hasImage = Array.isArray(content) && content.some(function (part) { return isObject(part) && part.image !== undefined; });
  return { kind: "submit", model: req.model, action: hasImage ? "image_to_image" : "text_to_image", requestBody: requestBody };
}

function taskCreated(ctx, task) {
  const data = task.data || {};
  const output = isObject(data.output) ? data.output : {};
  return { request_id: data.request_id || "", output: { task_id: task.task_id, task_status: output.task_status || "PENDING" } };
}

export const native = {
  // multimodal-generation: synchronous, answered with the images.
  createImage: function (ctx) {
    if (trimmed(headerValue(ctx.requestHeaders, "X-DashScope-Sse")) === "enable") fail("streaming image output is not supported");
    return nativeImage(ctx, "");
  },
  // image-generation: the same body as a Bailian async task.
  createImageTask: function (ctx) {
    return nativeImage(ctx, "async");
  },
  // text2image / image2image image-synthesis: {input: {prompt, negative_prompt, images}}.
  createLegacyImage: function (ctx) {
    const req = jsonBody(ctx);
    for (const key of Object.keys(req)) if (!["model", "input", "parameters"].includes(key)) fail("unsupported field: " + key);
    const input = objectValue(req.input, "input");
    for (const key of Object.keys(input)) if (!["prompt", "negative_prompt", "images"].includes(key)) fail("input." + key + " is not supported");
    if (input.images !== undefined && !Array.isArray(input.images)) fail("input.images must be an array");
    const parameters = clone(objectValue(req.parameters, "parameters"));
    if (input.negative_prompt !== undefined) {
      if (parameters.negative_prompt !== undefined) fail("send negative_prompt once");
      parameters.negative_prompt = clone(input.negative_prompt);
    }
    const content = (input.images || []).map(function (image) { return { image: clone(image) }; });
    content.push({ text: typeof input.prompt === "string" ? input.prompt : "" });
    return {
      kind: "submit",
      model: req.model,
      action: content.length > 1 ? "image_to_image" : "text_to_image",
      requestBody: { model: req.model, input: { messages: [{ role: "user", content: content }] }, parameters: parameters },
    };
  },
  // The synchronous reply, with the gateway id as request_id.
  imageCreated: function (ctx, task) {
    const data = clone(task.data || {});
    data.request_id = task.task_id;
    return data;
  },
  taskCreated: taskCreated,
  createVideo: function (ctx) {
    const req = jsonBody(ctx);
    for (const key of Object.keys(req)) if (!["model", "input", "parameters"].includes(key)) fail("unsupported field: " + key);
    const requestBody = { model: req.model, input: clone(objectValue(req.input, "input")), parameters: clone(objectValue(req.parameters, "parameters")) };
    const media = requestBody.input.media;
    const withImage = (Array.isArray(media) && media.length) || requestBody.input.img_url !== undefined;
    return { kind: "submit", model: req.model, action: withImage ? "image_to_video" : "text_to_video", requestBody: requestBody };
  },
  videoCreated: taskCreated,
  // Bailian's task reply; the video URL is the gateway's own download link
  // when available, and the gateway can fail a task Bailian still runs.
  taskStatus: function (ctx, task) {
    const data = clone(task.data || {});
    const output = Object.assign({}, isObject(data.output) ? data.output : {}, { task_id: task.task_id });
    if (task.status === "FAILURE" && ["PENDING", "RUNNING", undefined].includes(output.task_status)) {
      output.task_status = "FAILED";
      output.code = "InternalError";
      output.message = task.fail_reason || "task failed";
    }
    const artifact = ctx && ctx.artifacts && ctx.artifacts.video;
    if (artifact && artifact.url && output.video_url) output.video_url = artifact.url;
    data.output = output;
    return data;
  },
  error: function (ctx, error) {
    if (error.httpStatus === 404 && ctx.params && ctx.params.task_id)
      return { __status: 200, __body: { request_id: error.requestId || "", output: { task_id: ctx.params.task_id, task_status: "UNKNOWN" } } };
    const codes = { 400: "InvalidParameter", 401: "InvalidApiKey", 403: "AccessDenied", 404: "NotFound", 429: "Throttling", 503: "ServiceUnavailable" };
    return { code: codes[error.httpStatus] || "InternalError", message: error.message, request_id: error.requestId || "" };
  },
};

// ---------------------------------------------------------------------------
// Host protocols (OpenAI Images and Videos)

function multipartFields(body, numeric, booleans) {
  const req = {};
  const fields = body.fields || {};
  for (const name of Object.keys(fields)) {
    if (name === "image[]" || name === "images" || name === "images[]") {
      req.images = (req.images || []).concat(fields[name]);
      continue;
    }
    if (fields[name].length > 1) fail(name + " must be provided once");
    req[name] = fields[name][0];
  }
  for (const key of numeric) if (req[key] !== undefined && req[key] !== "") req[key] = Number(req[key]);
  for (const key of booleans) {
    if (req[key] === undefined) continue;
    if (req[key] !== "true" && req[key] !== "false") fail(key + " must be true or false");
    req[key] = req[key] === "true";
  }
  for (const key of ["metadata", "parameters", "input"]) {
    if (typeof req[key] !== "string") continue;
    try {
      req[key] = JSON.parse(req[key]);
    } catch (e) {
      fail(key + " must be a JSON object string");
    }
  }
  return req;
}

const OPENAI_IMAGE_PASSTHROUGH = ["n", "size", "negative_prompt", "prompt_extend", "prompt_extend_mode", "enable_thinking", "watermark", "seed", "enable_sequential", "thinking_mode", "bbox_list", "color_palette"];
const OPENAI_IMAGE_FIELDS = ["model", "prompt", "response_format", "image", "images", "mask", "stream", "user", "parameters"].concat(OPENAI_IMAGE_PASSTHROUGH);

const OPENAI_VIDEO_FIELDS = ["model", "prompt", "seconds", "duration", "size", "resolution", "ratio", "input_reference", "image", "images", "metadata", "watermark", "seed", "prompt_extend", "audio", "audio_url", "shot_type", "negative_prompt", "media", "user"];

export const protocols = {
  openai_image: {
    decodeRequest: function (ctx) {
      const model = trimmed(ctx.model);
      if (!model) fail("model is required");
      let req;
      const uploads = [];
      if (ctx.body && ctx.body.kind === "json") {
        if (!isObject(ctx.body.value)) fail("request body must be an object");
        req = ctx.body.value;
      } else if (ctx.body && ctx.body.kind === "multipart") {
        req = multipartFields(ctx.body, ["n", "seed"], ["prompt_extend", "watermark", "enable_sequential", "thinking_mode", "enable_thinking", "stream"]);
        for (const file of ctx.body.files || []) {
          if (file.field === "mask") fail("mask images are not supported");
          if (!/^image(\[\d*\])?$/.test(file.field)) fail("unsupported file field: " + file.field);
          uploads.push({ __fileRef: file.ref, encoding: "dataUrl", mimeType: trimmed(file.mimeType).toLowerCase() || "image/png", maxBytes: MAX_INPUT_IMAGE_BYTES });
        }
      } else fail("JSON or multipart body required");
      for (const key of Object.keys(req)) if (!OPENAI_IMAGE_FIELDS.includes(key)) fail("unsupported field: " + key);
      if (req.stream !== undefined && req.stream !== false) fail("stream is not supported");
      if (req.response_format !== undefined && req.response_format !== "url" && req.response_format !== "b64_json") fail("response_format must be url or b64_json");
      if (req.mask !== undefined) fail("mask images are not supported");
      const prompt = typeof req.prompt === "string" ? req.prompt : "";
      if (!prompt.trim()) fail("prompt is required");
      const images = [];
      for (const image of [].concat(req.image === undefined ? [] : req.image, req.images === undefined ? [] : req.images)) {
        if (!isMediaInput(image, "image")) fail("image must be an HTTP(S) URL or a Base64 data URL");
        images.push(typeof image === "string" ? image.trim() : image);
      }
      for (const upload of uploads) images.push(upload);
      if (ctx.operation === "edit" && !images.length) fail("image is required");
      const parameters = Object.assign({}, objectValue(req.parameters, "parameters"));
      for (const key of OPENAI_IMAGE_PASSTHROUGH) if (req[key] !== undefined) parameters[key] = req[key];
      const content = images.map(function (image) { return { image: image }; });
      content.push({ text: prompt });
      return {
        kind: "submit",
        model: model,
        action: images.length ? "image_to_image" : "text_to_image",
        requestBody: { model: model, input: { messages: [{ role: "user", content: content }] }, parameters: parameters },
      };
    },
    render: function (ctx, task) {
      return { created: task.created_at, data: imageOutputs(task.data).map(imageDatum) };
    },
  },
  openai_video: {
    decodeRequest: function (ctx) {
      let req;
      const uploads = [];
      if (ctx.body && ctx.body.kind === "json") {
        if (!isObject(ctx.body.value)) fail("request body must be an object");
        req = ctx.body.value;
      } else if (ctx.body && ctx.body.kind === "multipart") {
        req = multipartFields(ctx.body, ["seconds", "duration", "seed"], ["watermark", "prompt_extend", "audio"]);
        for (const file of ctx.body.files || []) {
          if (!/^(input_reference|image|images)(\[\d*\])?$/.test(file.field)) fail("unsupported file field: " + file.field);
          uploads.push({ __fileRef: file.ref, encoding: "dataUrl", mimeType: trimmed(file.mimeType).toLowerCase() || "image/png", maxBytes: MAX_INPUT_IMAGE_BYTES });
        }
      } else fail("JSON or multipart body required");
      for (const key of Object.keys(req)) if (!OPENAI_VIDEO_FIELDS.includes(key)) fail("unsupported field: " + key);
      const metadata = objectValue(req.metadata, "metadata");
      for (const key of Object.keys(metadata)) if (key !== "input" && key !== "parameters") fail("metadata." + key + " is not supported; use metadata.input or metadata.parameters");
      const input = Object.assign({}, objectValue(metadata.input, "metadata.input"));
      const parameters = Object.assign({}, objectValue(metadata.parameters, "metadata.parameters"));
      if (req.prompt !== undefined) input.prompt = req.prompt;
      if (req.negative_prompt !== undefined) input.negative_prompt = req.negative_prompt;
      if (req.media !== undefined) input.media = req.media;
      if (req.audio_url !== undefined) input.audio_url = req.audio_url;
      const seconds = req.seconds !== undefined ? req.seconds : req.duration;
      if (seconds !== undefined && seconds !== "") parameters.duration = typeof seconds === "string" ? Number(seconds) : seconds;
      // A size's aspect ratio applies only to models that take a ratio.
      let ratioFromSize = "";
      if (req.size !== undefined && req.size !== "") {
        const size = videoSize(req.size);
        parameters.resolution = size.resolution;
        if (size.ratio) ratioFromSize = size.ratio;
      }
      if (req.resolution !== undefined) parameters.resolution = normalizeResolution(req.resolution);
      for (const key of ["ratio", "watermark", "seed", "prompt_extend", "audio", "shot_type"]) if (req[key] !== undefined) parameters[key] = req[key];
      if (parameters.resolution !== undefined) parameters.resolution = normalizeResolution(parameters.resolution);
      const images = [];
      for (const value of [].concat(req.input_reference === undefined ? [] : req.input_reference, req.image === undefined ? [] : req.image, req.images === undefined ? [] : req.images)) {
        if (value === "") continue;
        if (!isMediaInput(value, "image")) fail("image references must be HTTP(S) URLs or Base64 data URLs");
        images.push(typeof value === "string" ? value.trim() : value);
      }
      for (const upload of uploads) images.push(upload);
      const requestBody = { model: ctx.model, input: input, parameters: parameters };
      if (ratioFromSize) requestBody.ratioFromSize = ratioFromSize;
      if (images.length) requestBody.images = images;
      const action = images.length || (Array.isArray(input.media) && input.media.length) || input.img_url !== undefined ? "image_to_video" : "text_to_video";
      return { kind: "submit", model: ctx.model, action: action, requestBody: requestBody };
    },
    render: function (ctx, task) {
      const data = task.data || {};
      const output = isObject(data.output) ? data.output : {};
      const statuses = { PENDING: "queued", RUNNING: "in_progress", SUCCEEDED: "completed", FAILED: "failed", CANCELED: "failed", UNKNOWN: "failed" };
      const reply = { status: statuses[output.task_status] || "queued" };
      const parameters = isObject(output.parameters) ? output.parameters : null;
      if (parameters && parameters.duration !== undefined) reply.seconds = String(parameters.duration);
      if (data.code) reply.error = { code: String(data.code), message: String(data.message || "") };
      else if (output.code) reply.error = { code: String(output.code), message: String(output.message || "") };
      return reply;
    },
  },
};

// ---------------------------------------------------------------------------
// Provider part: speech and transcription converters. Text routes use the
// host's `none` converter and never reach these hooks.

const OPENAI_VOICES = ["alloy", "ash", "ballad", "coral", "echo", "fable", "onyx", "nova", "sage", "shimmer", "verse", "marin", "cedar"];
const SPEECH_FORMATS = { mp3: "audio/mpeg", wav: "audio/wav", pcm: "audio/pcm", opus: "audio/ogg" };
const SPEECH_FIELDS = ["model", "input", "voice", "response_format", "speed", "instructions", "stream_format", "metadata"];
const SPEECH_METADATA = ["sample_rate", "volume", "pitch", "bit_rate", "seed", "language_hints", "enable_ssml", "hot_fix", "enable_aigc_tag", "aigc_propagator", "aigc_propagate_id"];
const SAMPLE_RATES = [8000, 12000, 16000, 22050, 24000, 44100, 48000];
const OPUS_SAMPLE_RATES = [8000, 12000, 16000, 24000, 48000];
const ASR_FORMATS = { aac: "aac", amr: "amr", flac: "flac", m4a: "m4a", mp3: "mp3", mpeg: "mp3", mpga: "mp3", mp4: "mp4", ogg: "ogg", opus: "opus", wav: "wav", webm: "webm" };

function convertError(status, message, code) {
  const error = { status: status, message: message, type: "upstream_error" };
  if (code) error.code = code;
  return { error: error };
}

function parseJSON(text) {
  try {
    return JSON.parse(text);
  } catch (e) {
    return null;
  }
}

export function buildSpeechRequest(body, model, config) {
  if (!isObject(body)) fail("A JSON body is required.");
  for (const key of Object.keys(body)) if (!SPEECH_FIELDS.includes(key)) fail("unsupported field: " + key);
  const text = typeof body.input === "string" ? body.input : "";
  if (!text.trim()) fail("input is required");
  let voice = trimmed(body.voice);
  if (!voice || OPENAI_VOICES.includes(voice.toLowerCase())) voice = trimmed(config && config.defaultVoice) || DEFAULT_VOICE;
  const format = body.response_format === undefined || body.response_format === "" ? "mp3" : String(body.response_format).toLowerCase();
  if (!own(SPEECH_FORMATS, format)) fail("response_format must be one of " + Object.keys(SPEECH_FORMATS).join(", "));
  const metadata = objectValue(body.metadata, "metadata");
  for (const key of Object.keys(metadata)) if (!SPEECH_METADATA.includes(key)) fail("metadata." + key + " is not supported");
  const input = { text: text, voice: voice, format: format, sample_rate: 24000 };
  for (const key of SPEECH_METADATA) if (metadata[key] !== undefined) input[key] = clone(metadata[key]);
  if (typeof input.sample_rate === "string" && input.sample_rate.trim() !== "") input.sample_rate = Number(input.sample_rate);
  const rates = format === "opus" ? OPUS_SAMPLE_RATES : SAMPLE_RATES;
  if (!rates.includes(input.sample_rate)) fail("metadata.sample_rate must be one of " + rates.join(", "));
  if (body.speed !== undefined && body.speed !== null) {
    if (typeof body.speed !== "number" || body.speed < 0.5 || body.speed > 2) fail("speed must be between 0.5 and 2.0");
    input.rate = body.speed;
  }
  if (body.instructions !== undefined && body.instructions !== "") {
    if (typeof body.instructions !== "string") fail("instructions must be a string");
    input.instruction = body.instructions;
  }
  for (const key of ["enable_ssml", "enable_aigc_tag"]) if (input[key] !== undefined && typeof input[key] !== "boolean") fail("metadata." + key + " must be a boolean");
  return { body: { model: model, input: input }, format: format };
}

function fileFormat(file) {
  const name = String(file.filename || "").toLowerCase();
  const ext = name.lastIndexOf(".") >= 0 ? name.slice(name.lastIndexOf(".") + 1) : "";
  if (own(ASR_FORMATS, ext)) return ASR_FORMATS[ext];
  const type = String(file.contentType || "").toLowerCase().split(";")[0];
  const sub = type.indexOf("/") >= 0 ? type.slice(type.indexOf("/") + 1).replace(/^x-/, "") : "";
  if (own(ASR_FORMATS, sub)) return ASR_FORMATS[sub];
  if (sub === "wave" || sub === "vnd.wave") return "wav";
  fail("cannot tell the audio format of " + (file.filename || "the uploaded file") + "; use a file name ending in .mp3, .wav, .m4a, .ogg, .opus, .flac, .aac, .amr or .webm");
}

export function buildTranscriptionRequest(form, model) {
  if (!form || !isObject(form.fields) || !Array.isArray(form.files)) fail("A multipart form with a file is required.");
  const fields = form.fields;
  const value = function (name) {
    const raw = fields[name];
    if (raw === undefined) return undefined;
    const list = Array.isArray(raw) ? raw : [raw];
    if (list.length > 1) fail(name + " must be provided once");
    return list[0];
  };
  for (const name of Object.keys(fields)) {
    if (!["model", "language", "response_format", "temperature", "prompt"].includes(name)) fail("unsupported field: " + name);
  }
  if (trimmed(value("prompt"))) fail("prompt is not supported");
  const format = trimmed(value("response_format")) || "json";
  if (format !== "json" && format !== "verbose_json") fail("response_format must be json or verbose_json");
  const files = form.files.filter(function (file) { return file.field === "file"; });
  if (files.length !== 1 || form.files.length !== 1) fail("exactly one audio file is required in the file field");
  const audioFormat = fileFormat(files[0]);
  const parameters = { format: audioFormat };
  const language = trimmed(value("language"));
  if (language) parameters.language_hints = [language];
  return {
    body: {
      model: model,
      input: { messages: [{ role: "user", content: [{ type: "input_audio", input_audio: { data: { "$file": "file", encoding: "dataUrl" } } }] }] },
      parameters: parameters,
    },
    responseFormat: format,
  };
}

export function convertRequest(ctx, request) {
  const model = trimmed(request && request.model) || trimmed(request && request.body && request.body.model);
  if (!model) fail("model is required");
  if (ctx.path === SPEECH_PATH) {
    const built = buildSpeechRequest(request.body, model, ctx.config);
    return {
      method: "POST",
      body: built.body,
      headers: { "X-DashScope-SSE": "enable" },
      stream: true,
      state: { kind: "speech", model: model, format: built.format, clientStream: request.stream === true, chunks: 0, characters: 0 },
    };
  }
  if (ctx.path === TRANSCRIPTION_PATH) {
    const built = buildTranscriptionRequest(request.form, model);
    return { method: "POST", body: built.body, stream: false, state: { kind: "transcription", model: model, responseFormat: built.responseFormat } };
  }
  fail("This plugin does not convert " + ctx.path);
}

export function transcriptionReply(parsed, state) {
  const output = isObject(parsed.output) ? parsed.output : {};
  let text = typeof output.text === "string" ? output.text : "";
  if (!text) {
    for (const choice of Array.isArray(output.choices) ? output.choices : []) {
      const content = choice && choice.message && choice.message.content;
      if (typeof content === "string") text += content;
      else if (Array.isArray(content)) for (const part of content) if (part && typeof part.text === "string") text += part.text;
    }
  }
  if (!text && isObject(output.sentence) && typeof output.sentence.text === "string") text = output.sentence.text;
  const usage = isObject(parsed.usage) ? parsed.usage : {};
  const raw = usage.seconds !== undefined ? usage.seconds : usage.duration !== undefined ? usage.duration : isObject(usage.input_tokens_details) ? usage.input_tokens_details.audio_seconds : undefined;
  const seconds = typeof raw === "number" && Number.isFinite(raw) && raw > 0 ? Math.ceil(raw) : 0;
  // Billed seconds travel as prompt tokens: price them per second in README.
  const reply = {
    text: text,
    usage: { type: "tokens", input_tokens: seconds, output_tokens: 0, total_tokens: seconds, prompt_tokens: seconds, completion_tokens: 0, seconds: seconds },
  };
  if (state && state.responseFormat === "verbose_json") {
    return { task: "transcribe", language: "", duration: typeof raw === "number" ? raw : 0, text: text, usage: reply.usage };
  }
  return reply;
}

export function convertResponse(ctx, response) {
  const state = ctx.state || {};
  const status = response.status;
  if (state.kind === "models" || (ctx.path === MODELS_PATH && !state.kind)) {
    if (status < 200 || status >= 300) return convertError(status >= 400 && status <= 599 ? status : 502, "Bailian model list request failed with status " + status);
    return modelListReply(response, state, ctx.baseUrl);
  }
  const text = response.body !== undefined ? response.body : "";
  const parsed = typeof text === "string" ? parseJSON(text) : null;
  if (status < 200 || status >= 300) {
    const message = parsed && (parsed.message || (parsed.error && parsed.error.message)) ? String(parsed.message || parsed.error.message) : String(text).slice(0, 512) || "upstream error";
    return convertError(status >= 400 && status <= 599 ? status : 502, "Bailian: " + message, parsed && parsed.code ? String(parsed.code) : undefined);
  }
  if (state.kind === "transcription") {
    if (!isObject(parsed)) return convertError(502, "Bailian returned an unreadable transcription reply");
    if (parsed.code) return convertError(502, "Bailian: " + String(parsed.message || parsed.code), String(parsed.code));
    return { body: transcriptionReply(parsed, state) };
  }
  // Speech is requested as a stream; a whole JSON reply means DashScope
  // ignored it, and following its OSS URL would send the key there.
  if (parsed && parsed.code) return convertError(502, "Bailian: " + String(parsed.message || parsed.code), String(parsed.code));
  return convertError(502, "Bailian answered speech without an audio stream");
}

export function convertStreamEvent(ctx, input) {
  const state = Object.assign({ chunks: 0, characters: 0 }, ctx.state || {});
  const streaming = state.clientStream === true;
  if (input && input.done) {
    if (!state.chunks) return convertError(502, "Bailian returned no audio");
    return { state: state };
  }
  const data = input && typeof input.data === "string" ? parseJSON(input.data) : null;
  if (!isObject(data)) return convertError(502, "Bailian sent an unreadable speech event");
  if (data.code || (input.event && input.event.toLowerCase() === "error")) return convertError(502, "Bailian: " + String(data.message || data.code || "speech failed"), data.code ? String(data.code) : undefined);
  const output = isObject(data.output) ? data.output : {};
  const audio = isObject(output.audio) ? output.audio : {};
  const usage = isObject(data.usage) ? data.usage : {};
  if (Number.isInteger(usage.characters) && usage.characters > state.characters) state.characters = usage.characters;
  const chunk = typeof audio.data === "string" ? audio.data : "";
  const result = { state: state };
  if (chunk) {
    state.chunks += 1;
    if (streaming) result.events = [{ data: { type: "speech.audio.delta", audio: chunk } }];
    else {
      result.chunks = [{ bodyBase64: chunk }];
      result.contentType = SPEECH_FORMATS[state.format] || "application/octet-stream";
    }
  }
  if (streaming && output.finish_reason === "stop") {
    const events = result.events || [];
    events.push({ data: { type: "speech.audio.done", usage: { input_tokens: state.characters, output_tokens: 0, total_tokens: state.characters } } });
    result.events = events;
  }
  return result;
}

// Keys starting with sk-sp- are not Bailian API keys and fail on the DashScope hosts.
export function checkKey(ctx, key) {
  const value = String(key || "").trim();
  if (!value) return { error: { en: "The key is empty.", zh: "Key 为空。" } };
  const host = String((ctx && ctx.baseUrl) || "").replace(/^https?:\/\//i, "").split(/[/:]/)[0].toLowerCase();
  if (/^sk-sp-/.test(value) && /^dashscope(-intl)?\.aliyuncs\.com$/.test(host))
    return { error: { en: "This is not a Bailian API key, so it does not work on " + host + ". Use a Bailian API key (sk-...).", zh: "这不是百炼 API Key，不能用于 " + host + "，请填写百炼 API Key（sk-）。" } };
  return undefined;
}
