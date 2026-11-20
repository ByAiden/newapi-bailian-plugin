---
locale: en
translations:
  zh-CN: README.zh-CN.md
---

# Alibaba Cloud Bailian

**English** | [简体中文](README.zh-CN.md)

Serves Alibaba Cloud Bailian (Model Studio) text, image, video, speech and transcription models from ONE new-api channel with a Bailian API key.

- Text: OpenAI chat completions, OpenAI Responses, Claude Messages and embeddings, passed through unchanged, streaming included.
- Images: OpenAI images (generations and edits) and the DashScope image endpoints, for Qwen-Image 3.0, 2.1 and 2.0, Z-Image Turbo, and Wan 2.7, 2.6 and 2.5 image models.
- Video: OpenAI videos and the DashScope video endpoints, for Wan 3.0 (and Prime), Wan 2.7, 2.6 and 2.5, and HappyHorse 1.1.
- Speech: OpenAI speech for Qwen-Audio TTS, answered with the audio file.
- Transcription: OpenAI transcriptions for Qwen-Audio ASR.
- Upstream type: the Bailian API (default), or any OpenAI-compatible relay for text, embeddings, image generation, speech and transcription (see OpenAI-compatible relay).

Requires new-api v1.0.0-rc.50 or later (provider plugins with usage profiles). The plugin key is `byaiden_bailian`.

## Channel setup

1. Install the plugin, then add ONE channel of type Task Plugin and bind it to this plugin. Selecting the plugin fills the channel model list with the text, image, video, speech and transcription models below; embedding models (`text-embedding-v4`) are not pre-filled, because an ordinary OpenAI channel serves them the same way: add them with Fetch models or by name. After saving the key, Fetch models replaces it with the models your key can use: the models Bailian lists plus every image and video model of this plugin (Bailian's list leaves out video and the Wan 2.6 / 2.5 image models although the key can call them). Models without a route here, such as realtime speech, are left out.
2. Base URL and key. Use the address of the site your key belongs to; a key sent to the other site fails with an authentication error.

| Site | Base URL | Key |
| --- | --- | --- |
| Beijing (default) | `https://dashscope.aliyuncs.com` | Bailian API key, `sk-...` |
| Singapore (international) | `https://dashscope-intl.aliyuncs.com` | Bailian API key of the international site |

   A workspace address such as `https://WORKSPACE_ID.cn-beijing.maas.aliyuncs.com` also works; Fetch models then lists only what Bailian returns, so add video models by hand.
3. Models: see the tables below. For other text models (for example `qwen3-max` or `qwen-plus`), add the model name to the channel as it is, or publish your own name and map it in the channel model mapping (`{"my-model": "qwen-plus"}`). The text endpoints pass any model through. Image and video requests must use one of the image or video models below, or a name mapped to one.
4. Default voice (channel setting): the Qwen-Audio voice used when a speech request names an OpenAI voice (`alloy`, `nova` and the others) or none. Default `longanhuan_v3.6`. See the Bailian voice list for the voices of each model.
5. Upstream type (channel setting): `Bailian API` (default) for the DashScope hosts above, or `OpenAI-compatible relay` for a relay in front of Bailian (see OpenAI-compatible relay).
6. Set prices (see Billing). The channel test button sends a chat request with the test model; pick a text model for it.

The built-in `alibaba` plugin serves some of the same image and video models and native paths on channels of the built-in Alibaba Bailian type. Both can be installed; the channel chosen for a request decides which plugin runs it.

## OpenAI-compatible relay

Set Upstream type to `OpenAI-compatible relay` when the channel should call a service that speaks OpenAI's API (another gateway, a proxy) instead of Bailian. Base URL is the relay's root, without `/v1` (for example `https://relay.example.com`); the key is the relay's key, sent as `Authorization: Bearer`. Saving refuses a blank Base URL and a bare Bailian address in this mode.

| Client request | Sent to the relay | Billing |
| --- | --- | --- |
| `POST /v1/chat/completions`, `/v1/responses`, `/v1/messages`, `/v1/embeddings`, streaming included | the same path under the Base URL, body and model name as on any channel | the usage the relay reports, as on an OpenAI channel |
| `POST /v1/images/generations` with an image model of this plugin | `POST /v1/images/generations` with `prompt`, `n`, `size` (`1024x1024` form) and the model's extra fields | the task expressions of Billing, settled on the images delivered |
| `POST /v1/audio/speech` | `POST /v1/audio/speech`, as sent | characters of `input`, as on Bailian |
| `POST /v1/audio/transcriptions` | `POST /v1/audio/transcriptions`, the same form | the audio seconds the relay reports (`json` with duration usage, or `verbose_json`) as tokens, as on Bailian; other replies pass through as sent |
| Fetch models | `GET /v1/models` | free; the list is the relay's own, unfiltered |

Not available on a relay, with an error before anything is sent or billed: video models (`/v1/videos` and the DashScope video routes), image edits and requests with input images, and the DashScope-native endpoints (`/api/v1/...`). The Default voice setting applies to the Bailian API only: on a relay the `voice` goes as sent. The upstream model name is never rewritten; use the channel model mapping when the relay names a model differently. A New API (type 60) channel ignores this setting.

## Models and endpoints

| Kind | Models |
| --- | --- |
| Text | `qwen4-max`, `qwen4-max-preview`, `qwen3.8-max`, `qwen3.8-flash`, `qwen3.7-max`, `qwen3.7-plus`, `qwen3.6-plus`, `qwen3.6-flash`, `deepseek-v4.1-flash`, `deepseek-v4.1-flash-1017`, `deepseek-v4-pro`, `deepseek-v4-pro-0813`, `deepseek-v4-flash-0731`, `glm-5.3`, `glm-5.2`, `glm-5.1`, `glm-5`, `kimi-k2.7-code`, `kimi-k2.6`, `kimi-k2.5`, and any other text model added to the channel by name |
| Embeddings | `text-embedding-v4` (not pre-filled; Fetch models lists it), or any other embedding model added by name |
| Images | `qwen-image-3.0-pro`, `qwen-image-3.0`, `qwen-image-2.1-pro`, `qwen-image-2.0-pro`, `qwen-image-2.0-pro-2026-06-22`, `qwen-image-2.0-pro-2026-04-22`, `qwen-image-2.0-pro-2026-03-03`, `qwen-image-2.0`, `qwen-image-2.0-2026-03-03`, `z-image-turbo`, `wan2.7-image-pro`, `wan2.7-image`, `wan2.6-image`, `wan2.6-t2i`, `wan2.5-t2i-preview`, `wan2.5-i2i-preview` |
| Video | `wan3.0-video`, `wan3.0-video-prime`, `happyhorse-1.1-t2v`, `happyhorse-1.1-i2v`, `happyhorse-1.1-r2v`, `wan2.7-t2v`, `wan2.7-t2v-2026-06-12`, `wan2.7-t2v-2026-04-25`, `wan2.7-i2v`, `wan2.7-i2v-2026-04-25`, `wan2.6-t2v`, `wan2.6-i2v`, `wan2.6-i2v-flash`, `wan2.5-t2v-preview`, `wan2.5-i2v-preview` |
| Speech | `qwen-audio-3.0-tts-plus` |
| Transcription | `qwen-audio-3.0-asr-flash` |

| Endpoint | Models |
| --- | --- |
| `POST /v1/chat/completions`, `POST /v1/responses`, `POST /v1/messages` | text |
| `POST /v1/embeddings` | embeddings |
| `POST /v1/images/generations`, `POST /v1/images/edits` | every image model |
| `POST /api/v1/services/aigc/multimodal-generation/generation` (synchronous) | every image model except the Wan 2.5 previews |
| `POST /api/v1/services/aigc/image-generation/generation` (task) | `wan2.6-image`, `wan2.6-t2i` |
| `POST /api/v1/services/aigc/text2image/image-synthesis` (task) | `wan2.5-t2i-preview` |
| `POST /api/v1/services/aigc/image2image/image-synthesis` (task) | `wan2.5-i2i-preview` |
| `POST /v1/videos`, `GET /v1/videos/{id}`, `GET /v1/videos/{id}/content` | every video model |
| `POST /api/v1/services/aigc/video-generation/video-synthesis` | every video model |
| `GET /api/v1/tasks/{id}` | video and image tasks |
| `POST /v1/audio/speech` | speech |
| `POST /v1/audio/transcriptions` | transcription |

The native DashScope paths are also served under `/byaiden_bailian/...` and accept the gateway token as `Authorization: Bearer` only.

Text requests go to `/compatible-mode/v1/chat/completions`, `/compatible-mode/v1/responses`, `/apps/anthropic/v1/messages` and `/compatible-mode/v1/embeddings` on the channel host, unchanged: vendor options such as `enable_thinking` or Claude `thinking` reach Bailian as sent, and new-api bills the usage Bailian reports.

### Images

OpenAI fields: `prompt`, `n`, `size` (`1024x1024` or `1024*1024`, or a preset where listed), `image` / `images` (URLs or data URLs; multipart uploads on edits), `response_format`, and the model's extra fields below. `parameters` takes any of them as a DashScope object.

| Models | Input images | `n` | `size` | Extra fields |
| --- | --- | --- | --- | --- |
| `qwen-image-3.0-pro`, `qwen-image-3.0` | 0 to 3 | 1 to 6 | 512*512 to 2048*2048 pixels, up to 8:1 | `negative_prompt`, `prompt_extend`, `prompt_extend_mode` (`direct`, or `agent` for text to image), `enable_thinking`, `watermark`, `seed` |
| `qwen-image-2.1-pro` | 0 to 10 | 1 to 6 | as above | `prompt_extend`, `prompt_extend_mode`, `enable_thinking`, `watermark`, `seed` |
| `qwen-image-2.0-pro`, `qwen-image-2.0` and their dated versions | 0 to 3 | 1 to 6 | as above | `negative_prompt`, `prompt_extend`, `watermark`, `seed` |
| `z-image-turbo` | none | 1 | 512*512 to 2048*2048 pixels (Bailian default 1024*1536) | `prompt_extend` (default false; it changes the price), `seed` |
| `wan2.7-image-pro`, `wan2.7-image` | 0 to 9 | 1 to 4 (12 with `enable_sequential`) | `1K`, `2K` (`4K` on `wan2.7-image-pro` text to image) or up to 2048*2048 | `negative_prompt`, `prompt_extend`, `watermark`, `seed`, `enable_sequential`, `thinking_mode`, `bbox_list`, `color_palette` |
| `wan2.6-image` (image editing) | 1 to 4, required | 1 to 4 | `1K`, `2K`, or 768*768 to 2048*2048 pixels, up to 4:1 | `negative_prompt`, `prompt_extend`, `watermark`, `seed` |
| `wan2.6-t2i`, `wan2.5-t2i-preview` | none | 1 to 4 | about 1280*1280 to 1440*1440 pixels (for example 1280*1280, 1696*960), up to 4:1 | `negative_prompt`, `prompt_extend`, `watermark`, `seed` |
| `wan2.5-i2i-preview` | 1 to 3, required | 1 to 4 | 768*768 to 1280*1280 pixels, up to 4:1 | `negative_prompt`, `prompt_extend`, `watermark`, `seed` |

- `n` defaults to 1 and is always sent (Bailian's own default is 4 for the Wan 2.6 and 2.5 models). Masks, streaming and Wan 2.6 interleaved text-and-image output (`enable_interleave`) are rejected.
- Most models answer synchronously. The Wan 2.5 previews run as Bailian tasks (so do `wan2.6-image` and `wan2.6-t2i` on the image-generation path); the OpenAI endpoints wait for the task and answer with the images.
- The gateway returns the Bailian image links (valid for 24 hours), or base64 with `response_format: b64_json`.

### Video

OpenAI fields: `prompt`, `seconds`, `size` (`832x480`, `1280x720`, `1920x1080` and their portrait, square, 4:3 and 3:4 forms) or `resolution` (`480P`, `720P`, `1080P`) with `ratio`, `input_reference` / `image` / `images` (URLs, data URLs or multipart uploads), `audio_url`, `negative_prompt`, `watermark`, `seed`, `prompt_extend`, `audio`, `shot_type`, `media`. `metadata.input` and `metadata.parameters` take the DashScope objects. Fields a model does not take are rejected.

| Models | Input | Resolutions | Seconds | Aspect ratio | Extra fields |
| --- | --- | --- | --- | --- | --- |
| `wan3.0-video`, `wan3.0-video-prime` | prompt; images become first and last frame; `media` for references | 480P, 720P, 1080P | 2 to 30, or -1 (the model picks) | `16:9`, `9:16`, `1:1`, `4:3`, `3:4`, `21:9`, `adaptive` (default) | `prompt_extend`, `audio`, `shot_type`, `negative_prompt` |
| `happyhorse-1.1-t2v`, `happyhorse-1.1-r2v` | prompt; r2v: 1 to 9 reference images | 480P, 720P, 1080P | 3 to 15 | nine ratios, `16:9` default | none |
| `happyhorse-1.1-i2v` | one first-frame image | 480P, 720P, 1080P | 3 to 15 | from the image | none |
| `wan2.7-t2v` and its dated versions | prompt (required), `audio_url` | 720P, 1080P | 2 to 15 | `16:9` (default), `9:16`, `1:1`, `4:3`, `3:4` | `negative_prompt`, `prompt_extend` |
| `wan2.7-i2v` and its dated version | first frame (first image), last frame (second image), driving audio (`audio_url`); or `media` with `first_clip` | 720P, 1080P | 2 to 15 | from the input | `negative_prompt`, `prompt_extend` |
| `wan2.6-t2v` | prompt (required), `audio_url` | 720P, 1080P | 2 to 15 | `16:9`, `9:16`, `1:1`, `4:3`, `3:4`, sent as Bailian's pixel `size` | `negative_prompt`, `prompt_extend`, `shot_type` |
| `wan2.5-t2v-preview` | prompt (required), `audio_url` | 480P (`16:9`, `9:16`, `1:1`), 720P, 1080P | 5 or 10 | as above | `negative_prompt`, `prompt_extend` |
| `wan2.6-i2v`, `wan2.6-i2v-flash` | one first-frame image (`img_url`), prompt, `audio_url` | 720P, 1080P | 2 to 15 | from the image | `negative_prompt`, `prompt_extend`, `shot_type`; flash also `audio` (default true; it changes the price) |
| `wan2.5-i2v-preview` | one first-frame image, prompt, `audio_url` | 480P, 720P, 1080P | 5 or 10 | from the image | `negative_prompt`, `prompt_extend` |

- Defaults that change the price are sent explicitly: 1080P, 5 seconds, and `audio: true` on `wan2.6-i2v-flash`. The aspect ratio of an OpenAI `size` is used only by models that take a ratio.
- Downloads go through `GET /v1/videos/{id}/content`; the plugin asks Bailian for a fresh signed link each time.

### Speech and transcription

Speech: `input`, `voice`, `response_format` (`mp3` default, `wav`, `pcm`, `opus`), `speed` (0.5 to 2.0), `instructions`, and in `metadata` the Qwen-Audio options `sample_rate` (24000 by default), `volume`, `pitch`, `bit_rate`, `seed`, `language_hints`, `enable_ssml`, `hot_fix`, `enable_aigc_tag`, `aigc_propagator`, `aigc_propagate_id`. The plugin asks Bailian for its audio stream and returns the audio bytes; `stream_format: "sse"` returns OpenAI `speech.audio.delta` events instead.

Transcription: multipart `file` (mp3, wav, m4a, ogg, opus, flac, aac, amr, webm; the format comes from the file name or type), optional `language`, `response_format` `json` (default) or `verbose_json`. Audio up to 5 minutes.

## Billing

The expressions below use the Bailian pay-as-you-go list prices for mainland China as plain CNY numbers, for sites that sell 1 USD of quota for 1 CNY. If your site bills in real USD, divide each expression by your rate (for example `/ 7`). Multiply by your margin as needed.

Text and embeddings: price the models as on any OpenAI-compatible channel (model ratio and completion ratio, or an expression on `p` and `c`). new-api bills the tokens Bailian reports, including streams.

Images and video are billed as tasks from these usage facts: `image_count` (images delivered); for Qwen-Image 3.0 also `output_image_type` (`qima_output_1k` or `qima_output_2k`) and `input_image_count`; for Z-Image `prompt_extend`; for video `seconds` and `resolution`, and `audio` for `wan2.6-i2v-flash`. The submission reserves the requested amount and settles on the usage Bailian reports (Wan 3.0 bills input video seconds plus output seconds). Use the expression billing mode:

| Model | Expression (CNY list price numbers) |
| --- | --- |
| `wan2.7-image`, `qwen-image-2.0`, `qwen-image-2.0-2026-03-03`, `wan2.6-image`, `wan2.6-t2i`, `wan2.5-t2i-preview`, `wan2.5-i2i-preview` | `tier("base", u("image_count") * 0.2)` |
| `qwen-image-2.1-pro` | `tier("base", u("image_count") * 0.25)` |
| `wan2.7-image-pro`, `qwen-image-2.0-pro` and its dated versions | `tier("base", u("image_count") * 0.5)` |
| `qwen-image-3.0-pro` | `tier("base", (u("image_count") * (u("output_image_type") == "qima_output_2k" ? 0.5 : 0.25) + u("input_image_count") * 0.02))` |
| `qwen-image-3.0` | `tier("base", (u("image_count") * 0.18 + u("input_image_count") * 0.02))` |
| `z-image-turbo` | `tier("base", u("image_count") * (u("prompt_extend") == true ? 0.2 : 0.1))` |
| `wan3.0-video` | `tier("base", u("seconds") * (u("resolution") == "1080P" ? 1.2 : u("resolution") == "720P" ? 0.6 : 0.3))` |
| `wan3.0-video-prime` | `tier("base", u("seconds") * (u("resolution") == "1080P" ? 1.8 : u("resolution") == "720P" ? 0.9 : 0.45))` |
| `happyhorse-1.1-t2v`, `happyhorse-1.1-i2v`, `happyhorse-1.1-r2v` | `tier("base", u("seconds") * (u("resolution") == "1080P" ? 1.2 : u("resolution") == "720P" ? 0.9 : 0.45))` |
| `wan2.7-t2v`, `wan2.7-i2v` and their dated versions, `wan2.6-t2v`, `wan2.6-i2v` | `tier("base", u("seconds") * (u("resolution") == "1080P" ? 1 : 0.6))` |
| `wan2.6-i2v-flash` | `tier("base", u("seconds") * (u("audio") == true ? (u("resolution") == "1080P" ? 0.5 : 0.3) : (u("resolution") == "1080P" ? 0.25 : 0.15)))` |
| `wan2.5-t2v-preview`, `wan2.5-i2v-preview` | `tier("base", u("seconds") * (u("resolution") == "1080P" ? 1 : u("resolution") == "720P" ? 0.6 : 0.3))` |

`wan3.0-video` is listed at its regular price; Bailian may run time-limited discounts. Each expression above shows as a price table on the model page (per resolution, per output tier, or per `prompt_extend` / `audio` value).

Speech and transcription are billed by new-api as ordinary requests, so their expressions give the price per million units of `p`, again as CNY numbers:

| Model | Expression | Unit of `p` |
| --- | --- | --- |
| `qwen-audio-3.0-tts-plus` | `tier("base", p * 280)` | characters of `input` |
| `qwen-audio-3.0-asr-flash` | `tier("base", p * 220)` | seconds of audio, rounded up |

Bailian lists speech at CNY 1.4 per 10,000 characters and counts a Chinese character as two; new-api counts every character once, so `p * 280` covers Chinese text and `p * 140` matches text without Chinese characters. Transcription is CNY 0.00022 per second; the plugin reports the billed seconds as the request's tokens.

Two gateways in a row: when another new-api forwards to this gateway through an ordinary OpenAI channel, only this gateway sees resolution and audio. The outer gateway handles `/v1/videos` with its Sora protocol and can price video only per second: use `tier("base", u("seconds") * X)` there, with X at the model's dearest resolution (and with audio for `wan2.6-i2v-flash`), and price images per image (`tier("base", fixed(X)) * image_count`). Per-resolution prices belong on this gateway.

## Example

```bash
curl https://your-gateway.example/v1/images/generations \
  -H "Authorization: Bearer ***" \
  -H "Content-Type: application/json" \
  -d '{"model": "z-image-turbo", "prompt": "An orange cat on a windowsill, line drawing", "size": "1024x1024"}'
```

```bash
curl https://your-gateway.example/v1/videos \
  -H "Authorization: Bearer ***" \
  -H "Content-Type: application/json" \
  -d '{"model": "wan2.6-i2v-flash", "prompt": "The cat blinks", "image": "https://example.com/cat.png", "seconds": "2", "size": "1280x720", "audio": false}'
```

Poll `GET /v1/videos/TASK_ID` until `status` is `completed`, then download `GET /v1/videos/TASK_ID/content`.

```bash
curl https://your-gateway.example/v1/audio/speech \
  -H "Authorization: Bearer ***" \
  -H "Content-Type: application/json" \
  -d '{"model": "qwen-audio-3.0-tts-plus", "input": "你好，欢迎使用百炼。", "voice": "longanhuan_v3.6"}' \
  -o speech.mp3
```

## Through another New API gateway

When one gateway (outer) forwards to another one (middle) that holds the Bailian channel, install this plugin on both:

- Middle gateway: the Task Plugin channel from Channel setup, with its own task prices.
- Outer gateway: a **New API** channel (type 60) with the middle gateway's address as Base URL, one of its tokens as key, and this plugin picked under upstream task plugins. Add the image and video models to the channel.

The outer plugin then sends image and video tasks to the middle gateway's Bailian routes under `/byaiden_bailian/...` with `Authorization: Bearer` and the token (no Bailian key), and polls `/byaiden_bailian/api/v1/tasks/{id}` there. The middle gateway's replies keep Bailian's `usage`, so the outer gateway reserves and settles on the same facts (`image_count`, `output_image_type`, `input_image_count`, `prompt_extend`, `seconds`, `resolution`, `audio`): price the outer gateway with the expressions from Billing at your own margin, per resolution included. Text, embeddings, speech and transcription go through the New API channel as ordinary requests, unchanged.

Limits: video downloads use the middle gateway's signed link, so its server address (System Settings) must be reachable from the outer gateway; image links are Bailian's own. Both gateways need a new-api release that lists task plugins on New API channels.

## Limits

- Not served: realtime voice (`qwen-audio-3.0-realtime-plus`, a WebSocket protocol of its own) and the decision model (`decision-model-preview`, a `/systemone` endpoint with no OpenAI equivalent). Use Bailian directly for them.
- Not included: Qwen-Image 1.x (`qwen-image`, `qwen-image-plus`, `qwen-image-max`, `qwen-image-edit`, `qwen-image-edit-plus`, `qwen-image-edit-max` and their dated versions), which Bailian took offline on 2026-10-10 (they answer "Model not exist"; Bailian recommends `qwen-image-3.0`); the `-us` model variants, which the current Bailian documentation no longer lists (US Virginia workspaces use the plain model names); Wan 2.2 and older.
- Image generation is not idempotent: a client retry generates and bills again. The gateway waits up to `TASK_PLUGIN_PROTOCOL_TIMEOUT_SECONDS` (600 seconds by default) for an image.
- Bailian result links expire after 24 hours and task ids after 24 hours; download results promptly.
- Requests that Bailian rejects, and image or video tasks that fail, are not billed. Video tasks are billed when submitted and settled when they finish.
- `callback_url`, masks and fields that Bailian does not document for the model are rejected with an error instead of being dropped.

New API artifact downloads use the middle gateway’s `/v1/tasks/{id}/artifacts/{key}/content` endpoint with Bearer authentication; vendor CDN requests remain credentialless.
