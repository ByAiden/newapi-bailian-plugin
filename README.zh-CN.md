---
locale: zh-CN
---

# 阿里云百炼

[English](README.md) | **简体中文**

用一个 new-api 渠道和一个百炼 API Key 接入阿里云百炼的文本、图片、视频、语音合成和语音识别模型。

- 文本：OpenAI Chat Completions、OpenAI Responses、Claude Messages 和 Embeddings，原样透传，支持流式。
- 图片：OpenAI 图片接口（生成与编辑）和 DashScope 图片接口，支持千问图像 3.0、2.1、2.0，Z-Image Turbo，以及万相 2.7、2.6、2.5 图片模型。
- 视频：OpenAI 视频接口和 DashScope 视频接口，支持万相 3.0（含 Prime）、万相 2.7、2.6、2.5 和 HappyHorse 1.1。
- 语音合成：OpenAI 语音接口，Qwen-Audio TTS，直接返回音频文件。
- 语音识别：OpenAI 转写接口，Qwen-Audio ASR。

需要 new-api v1.0.0-rc.50 或更高版本（支持 provider 插件和用量档案）。插件 key 为 `byaiden_bailian`。

## 渠道设置

1. 安装插件后，新建**一个**「任务插件」类型的渠道并绑定本插件。选择插件时渠道模型列表会填入下面所有模型。填好 Key 后点「获取模型列表」，会换成该 Key 实际可用的模型：百炼列出的模型，再加上本插件的全部图片和视频模型（百炼的模型列表不列视频模型和万相 2.6 / 2.5 图片模型，但这个 Key 可以调用）。实时语音等本插件不支持的模型会被过滤掉。
2. Base URL 与 Key。请填 Key 所属站点的地址，把 Key 发到另一个站点会鉴权失败。

| 站点 | Base URL | Key |
| --- | --- | --- |
| 北京（默认） | `https://dashscope.aliyuncs.com` | 百炼 API Key，`sk-...` |
| 新加坡（国际站） | `https://dashscope-intl.aliyuncs.com` | 国际站的百炼 API Key |

   也可以使用业务空间专属地址，如 `https://WORKSPACE_ID.cn-beijing.maas.aliyuncs.com`；此时「获取模型列表」只返回百炼列出的模型，视频模型需要手动添加。
3. 模型：见下方表格。其他文本模型（如 `qwen3-max`、`qwen-plus`）直接把模型名加到渠道里即可，也可以对外发布自己的模型名，在渠道模型映射里映射过去（`{"my-model": "qwen-plus"}`）。文本接口会透传任意模型。图片和视频请求必须使用下表中的图片或视频模型，或映射到这些模型的名称。
4. 默认音色（渠道设置）：语音请求使用 OpenAI 音色名（`alloy`、`nova` 等）或未指定音色时使用的 Qwen-Audio 音色，默认 `longanhuan_v3.6`。各模型可用音色见百炼音色列表。
5. 设置价格（见「计费」）。渠道测试按钮会用测试模型发送对话请求，请选一个文本模型作测试模型。

内置的 `alibaba` 插件在内置「阿里百炼」类型渠道上也提供部分相同的图片、视频模型和原生路径。两者可以同时安装，请求选中哪个渠道就由哪个插件执行。

## 模型与接口

| 类型 | 模型 |
| --- | --- |
| 文本 | `qwen4-max`、`qwen4-max-preview`、`qwen3.8-max`、`qwen3.8-flash`、`qwen3.7-max`、`qwen3.7-plus`、`qwen3.6-plus`、`qwen3.6-flash`、`deepseek-v4.1-flash`、`deepseek-v4.1-flash-1017`、`deepseek-v4-pro`、`deepseek-v4-pro-0813`、`deepseek-v4-flash-0731`、`glm-5.3`、`glm-5.2`、`glm-5.1`、`glm-5`、`kimi-k2.7-code`、`kimi-k2.6`、`kimi-k2.5`，以及按名称加到渠道的其他文本模型 |
| 向量 | `text-embedding-v4`，或按名称加到渠道的其他向量模型 |
| 图片 | `qwen-image-3.0-pro`、`qwen-image-3.0`、`qwen-image-2.1-pro`、`qwen-image-2.0-pro`、`qwen-image-2.0-pro-2026-06-22`、`qwen-image-2.0-pro-2026-04-22`、`qwen-image-2.0-pro-2026-03-03`、`qwen-image-2.0`、`qwen-image-2.0-2026-03-03`、`z-image-turbo`、`wan2.7-image-pro`、`wan2.7-image`、`wan2.6-image`、`wan2.6-t2i`、`wan2.5-t2i-preview`、`wan2.5-i2i-preview` |
| 视频 | `wan3.0-video`、`wan3.0-video-prime`、`happyhorse-1.1-t2v`、`happyhorse-1.1-i2v`、`happyhorse-1.1-r2v`、`wan2.7-t2v`、`wan2.7-t2v-2026-06-12`、`wan2.7-t2v-2026-04-25`、`wan2.7-i2v`、`wan2.7-i2v-2026-04-25`、`wan2.6-t2v`、`wan2.6-i2v`、`wan2.6-i2v-flash`、`wan2.5-t2v-preview`、`wan2.5-i2v-preview` |
| 语音合成 | `qwen-audio-3.0-tts-plus` |
| 语音识别 | `qwen-audio-3.0-asr-flash` |

| 接口 | 模型 |
| --- | --- |
| `POST /v1/chat/completions`、`POST /v1/responses`、`POST /v1/messages` | 文本 |
| `POST /v1/embeddings` | 向量 |
| `POST /v1/images/generations`、`POST /v1/images/edits` | 全部图片模型 |
| `POST /api/v1/services/aigc/multimodal-generation/generation`（同步） | 除万相 2.5 预览版外的全部图片模型 |
| `POST /api/v1/services/aigc/image-generation/generation`（任务） | `wan2.6-image`、`wan2.6-t2i` |
| `POST /api/v1/services/aigc/text2image/image-synthesis`（任务） | `wan2.5-t2i-preview` |
| `POST /api/v1/services/aigc/image2image/image-synthesis`（任务） | `wan2.5-i2i-preview` |
| `POST /v1/videos`、`GET /v1/videos/{id}`、`GET /v1/videos/{id}/content` | 全部视频模型 |
| `POST /api/v1/services/aigc/video-generation/video-synthesis` | 全部视频模型 |
| `GET /api/v1/tasks/{id}` | 视频和图片任务 |
| `POST /v1/audio/speech` | 语音合成 |
| `POST /v1/audio/transcriptions` | 语音识别 |

DashScope 原生路径也可通过 `/byaiden_bailian/...` 访问，只接受 `Authorization: Bearer` 形式的网关令牌。

文本请求原样发往渠道地址的 `/compatible-mode/v1/chat/completions`、`/compatible-mode/v1/responses`、`/apps/anthropic/v1/messages` 和 `/compatible-mode/v1/embeddings`：`enable_thinking`、Claude `thinking` 等厂商参数照原样传给百炼，new-api 按百炼返回的用量计费。

### 图片

OpenAI 字段：`prompt`、`n`、`size`（`1024x1024` 或 `1024*1024`，或表中列出的档位）、`image` / `images`（URL 或 data URL；编辑接口支持 multipart 上传）、`response_format`，以及下表中各模型的扩展字段。也可以用 `parameters` 以 DashScope 对象形式传这些参数。

| 模型 | 输入图片 | `n` | `size` | 扩展字段 |
| --- | --- | --- | --- | --- |
| `qwen-image-3.0-pro`、`qwen-image-3.0` | 0 至 3 张 | 1 至 6 | 总像素 512*512 至 2048*2048，宽高比不超过 8:1 | `negative_prompt`、`prompt_extend`、`prompt_extend_mode`（`direct`，文生图可用 `agent`）、`enable_thinking`、`watermark`、`seed` |
| `qwen-image-2.1-pro` | 0 至 10 张 | 1 至 6 | 同上 | `prompt_extend`、`prompt_extend_mode`、`enable_thinking`、`watermark`、`seed` |
| `qwen-image-2.0-pro`、`qwen-image-2.0` 及其日期版本 | 0 至 3 张 | 1 至 6 | 同上 | `negative_prompt`、`prompt_extend`、`watermark`、`seed` |
| `z-image-turbo` | 不支持 | 1 | 总像素 512*512 至 2048*2048（百炼默认 1024*1536） | `prompt_extend`（默认 false，会影响价格）、`seed` |
| `wan2.7-image-pro`、`wan2.7-image` | 0 至 9 张 | 1 至 4（开启 `enable_sequential` 时 12） | `1K`、`2K`（`wan2.7-image-pro` 文生图可用 `4K`），或不超过 2048*2048 | `negative_prompt`、`prompt_extend`、`watermark`、`seed`、`enable_sequential`、`thinking_mode`、`bbox_list`、`color_palette` |
| `wan2.6-image`（图像编辑） | 1 至 4 张，必填 | 1 至 4 | `1K`、`2K`，或总像素 768*768 至 2048*2048，宽高比不超过 4:1 | `negative_prompt`、`prompt_extend`、`watermark`、`seed` |
| `wan2.6-t2i`、`wan2.5-t2i-preview` | 不支持 | 1 至 4 | 总像素约 1280*1280 至 1440*1440（如 1280*1280、1696*960），宽高比不超过 4:1 | `negative_prompt`、`prompt_extend`、`watermark`、`seed` |
| `wan2.5-i2i-preview` | 1 至 3 张，必填 | 1 至 4 | 总像素 768*768 至 1280*1280，宽高比不超过 4:1 | `negative_prompt`、`prompt_extend`、`watermark`、`seed` |

- `n` 默认 1 并总是显式发送（百炼对万相 2.6、2.5 模型的默认值是 4）。不支持蒙版、流式和万相 2.6 图文混排输出（`enable_interleave`），传入会报错。
- 大多数模型同步返回。万相 2.5 预览版以百炼任务方式运行（`wan2.6-image`、`wan2.6-t2i` 走 image-generation 路径时也是）；OpenAI 接口会等待任务完成后返回图片。
- 网关返回百炼的图片链接（24 小时有效），`response_format: b64_json` 时返回 base64。

### 视频

OpenAI 字段：`prompt`、`seconds`、`size`（`832x480`、`1280x720`、`1920x1080` 及竖屏、方形、4:3、3:4 尺寸）或 `resolution`（`480P`、`720P`、`1080P`）加 `ratio`、`input_reference` / `image` / `images`（URL、data URL 或 multipart 上传）、`audio_url`、`negative_prompt`、`watermark`、`seed`、`prompt_extend`、`audio`、`shot_type`、`media`。`metadata.input` 和 `metadata.parameters` 可直接传 DashScope 对象。模型不支持的字段会直接报错。

| 模型 | 输入 | 分辨率 | 时长（秒） | 宽高比 | 扩展字段 |
| --- | --- | --- | --- | --- | --- |
| `wan3.0-video`、`wan3.0-video-prime` | 提示词；图片作为首帧、尾帧；参考素材用 `media` | 480P、720P、1080P | 2 至 30，或 -1（模型自动决定） | `16:9`、`9:16`、`1:1`、`4:3`、`3:4`、`21:9`、`adaptive`（默认） | `prompt_extend`、`audio`、`shot_type`、`negative_prompt` |
| `happyhorse-1.1-t2v`、`happyhorse-1.1-r2v` | 提示词；r2v 需 1 至 9 张参考图 | 480P、720P、1080P | 3 至 15 | 九种比例，默认 `16:9` | 无 |
| `happyhorse-1.1-i2v` | 一张首帧图 | 480P、720P、1080P | 3 至 15 | 跟随图片 | 无 |
| `wan2.7-t2v` 及其日期版本 | 提示词（必填）、`audio_url` | 720P、1080P | 2 至 15 | `16:9`（默认）、`9:16`、`1:1`、`4:3`、`3:4` | `negative_prompt`、`prompt_extend` |
| `wan2.7-i2v` 及其日期版本 | 首帧（第一张图）、尾帧（第二张图）、驱动音频（`audio_url`）；或 `media` 中的 `first_clip` 续写 | 720P、1080P | 2 至 15 | 跟随输入 | `negative_prompt`、`prompt_extend` |
| `wan2.6-t2v` | 提示词（必填）、`audio_url` | 720P、1080P | 2 至 15 | `16:9`、`9:16`、`1:1`、`4:3`、`3:4`，按百炼的像素 `size` 发送 | `negative_prompt`、`prompt_extend`、`shot_type` |
| `wan2.5-t2v-preview` | 提示词（必填）、`audio_url` | 480P（`16:9`、`9:16`、`1:1`）、720P、1080P | 5 或 10 | 同上 | `negative_prompt`、`prompt_extend` |
| `wan2.6-i2v`、`wan2.6-i2v-flash` | 一张首帧图（`img_url`）、提示词、`audio_url` | 720P、1080P | 2 至 15 | 跟随图片 | `negative_prompt`、`prompt_extend`、`shot_type`；flash 另有 `audio`（默认 true，会影响价格） |
| `wan2.5-i2v-preview` | 一张首帧图、提示词、`audio_url` | 480P、720P、1080P | 5 或 10 | 跟随图片 | `negative_prompt`、`prompt_extend` |

- 影响价格的默认值会显式发送：1080P、5 秒，`wan2.6-i2v-flash` 的 `audio: true`。OpenAI `size` 中的宽高比只用于支持比例参数的模型。
- 通过 `GET /v1/videos/{id}/content` 下载；插件每次都会向百炼获取新的签名链接。

### 语音合成与识别

语音合成：`input`、`voice`、`response_format`（默认 `mp3`，可选 `wav`、`pcm`、`opus`）、`speed`（0.5 至 2.0）、`instructions`，`metadata` 中可传 Qwen-Audio 参数 `sample_rate`（默认 24000）、`volume`、`pitch`、`bit_rate`、`seed`、`language_hints`、`enable_ssml`、`hot_fix`、`enable_aigc_tag`、`aigc_propagator`、`aigc_propagate_id`。插件向百炼请求音频流并返回音频字节；`stream_format: "sse"` 时改为返回 OpenAI `speech.audio.delta` 事件。

语音识别：multipart 字段 `file`（mp3、wav、m4a、ogg、opus、flac、aac、amr、webm，格式由文件名或类型判断），可选 `language`，`response_format` 为 `json`（默认）或 `verbose_json`。音频不超过 5 分钟。

## 计费

下面的表达式直接使用百炼中国内地按量付费标价的人民币数字，适用于「1 元 = 1 美元额度」的站点；站点按美元结算时，在每条表达式末尾再除以你的汇率（例如 `/ 7`）。按需再乘以利润系数。

文本和向量：与普通 OpenAI 兼容渠道一样定价（模型倍率加补全倍率，或用 `p`、`c` 写表达式）。new-api 按百炼返回的 token 计费，流式同样适用。

图片和视频按任务用量计费，用量字段：`image_count`（实际交付的图片数）；千问图像 3.0 另有 `output_image_type`（`qima_output_1k` 或 `qima_output_2k`）和 `input_image_count`；Z-Image 另有 `prompt_extend`；视频为 `seconds` 和 `resolution`，`wan2.6-i2v-flash` 另有 `audio`。提交时按请求量预扣，完成后按百炼返回的用量结算（万相 3.0 按输入视频秒数加输出秒数计费）。使用表达式计费模式：

| 模型 | 表达式（人民币标价数字） |
| --- | --- |
| `wan2.7-image`、`qwen-image-2.0`、`qwen-image-2.0-2026-03-03`、`wan2.6-image`、`wan2.6-t2i`、`wan2.5-t2i-preview`、`wan2.5-i2i-preview` | `tier("base", u("image_count") * 0.2)` |
| `qwen-image-2.1-pro` | `tier("base", u("image_count") * 0.25)` |
| `wan2.7-image-pro`、`qwen-image-2.0-pro` 及其日期版本 | `tier("base", u("image_count") * 0.5)` |
| `qwen-image-3.0-pro` | `tier("base", (u("image_count") * (u("output_image_type") == "qima_output_2k" ? 0.5 : 0.25) + u("input_image_count") * 0.02))` |
| `qwen-image-3.0` | `tier("base", (u("image_count") * 0.18 + u("input_image_count") * 0.02))` |
| `z-image-turbo` | `tier("base", u("image_count") * (u("prompt_extend") ? 0.2 : 0.1))` |
| `wan3.0-video` | `tier("base", u("seconds") * (u("resolution") == "1080P" ? 1.2 : u("resolution") == "720P" ? 0.6 : 0.3))` |
| `wan3.0-video-prime` | `tier("base", u("seconds") * (u("resolution") == "1080P" ? 1.8 : u("resolution") == "720P" ? 0.9 : 0.45))` |
| `happyhorse-1.1-t2v`、`happyhorse-1.1-i2v`、`happyhorse-1.1-r2v` | `tier("base", u("seconds") * (u("resolution") == "1080P" ? 1.2 : u("resolution") == "720P" ? 0.9 : 0.45))` |
| `wan2.7-t2v`、`wan2.7-i2v` 及其日期版本，`wan2.6-t2v`、`wan2.6-i2v` | `tier("base", u("seconds") * (u("resolution") == "1080P" ? 1 : 0.6))` |
| `wan2.6-i2v-flash` | `tier("base", u("seconds") * (u("audio") ? (u("resolution") == "1080P" ? 0.5 : 0.3) : (u("resolution") == "1080P" ? 0.25 : 0.15)))` |
| `wan2.5-t2v-preview`、`wan2.5-i2v-preview` | `tier("base", u("seconds") * (u("resolution") == "1080P" ? 1 : u("resolution") == "720P" ? 0.6 : 0.3))` |

`wan3.0-video` 按原价编写；百炼可能有限时折扣。

语音合成和语音识别由 new-api 按普通请求计费，表达式表示每百万个 `p` 单位的价格（同样直接用人民币数字）：

| 模型 | 表达式 | `p` 的单位 |
| --- | --- | --- |
| `qwen-audio-3.0-tts-plus` | `tier("base", p * 280)` | `input` 的字符数 |
| `qwen-audio-3.0-asr-flash` | `tier("base", p * 220)` | 音频秒数，向上取整 |

百炼语音合成标价 1.4 元/万字符，一个汉字按 2 个字符计；new-api 每个字符只计 1 次，所以 `p * 280` 可覆盖中文，不含汉字的文本可用 `p * 140`。语音识别 0.00022 元/秒，插件把计费秒数作为请求的 token 数上报。

两层网关：另一个 new-api 通过普通 OpenAI 渠道转发到本网关时，只有本网关能看到分辨率和是否有声。外层网关用 Sora 协议处理 `/v1/videos`，视频只能按秒定价：外层用 `tier("base", u("seconds") * X)`，X 取该模型最贵分辨率的单价（`wan2.6-i2v-flash` 取有声价格）；图片按张定价（`tier("base", fixed(X)) * image_count`）。按分辨率区分的价格请设在本网关。

## 示例

```bash
curl https://your-gateway.example/v1/images/generations \
  -H "Authorization: Bearer ***" \
  -H "Content-Type: application/json" \
  -d '{"model": "z-image-turbo", "prompt": "一只橘猫坐在窗台上，简笔画", "size": "1024x1024"}'
```

```bash
curl https://your-gateway.example/v1/videos \
  -H "Authorization: Bearer ***" \
  -H "Content-Type: application/json" \
  -d '{"model": "wan2.6-i2v-flash", "prompt": "橘猫轻轻眨眼", "image": "https://example.com/cat.png", "seconds": "2", "size": "1280x720", "audio": false}'
```

轮询 `GET /v1/videos/TASK_ID` 直到 `status` 为 `completed`，再通过 `GET /v1/videos/TASK_ID/content` 下载。

```bash
curl https://your-gateway.example/v1/audio/speech \
  -H "Authorization: Bearer ***" \
  -H "Content-Type: application/json" \
  -d '{"model": "qwen-audio-3.0-tts-plus", "input": "你好，欢迎使用百炼。", "voice": "longanhuan_v3.6"}' \
  -o speech.mp3
```

## 经由另一个 New API 网关

外层网关转发到持有百炼渠道的中间网关时，两边都安装本插件：

- 中间网关：按「渠道设置」建任务插件渠道，并设置自己的任务价格。
- 外层网关：新建 **New API** 渠道（类型 60），Base URL 填中间网关地址，密钥填中间网关的令牌，在「上游任务插件」里选择本插件，并把图片和视频模型加到渠道里。

外层插件会把图片和视频任务发到中间网关 `/byaiden_bailian/...` 下的百炼路由，用 `Authorization: Bearer` 加令牌鉴权（不用百炼 Key），并在中间网关的 `/byaiden_bailian/api/v1/tasks/{id}` 查询。中间网关的回复保留百炼的 `usage`，所以外层按同样的用量（`image_count`、`output_image_type`、`input_image_count`、`prompt_extend`、`seconds`、`resolution`、`audio`）预扣和结算：外层直接用「计费」里的表达式乘上自己的倍率即可，也能按分辨率定价。文本、向量、语音合成和识别经 New API 渠道按普通请求转发，不受影响。

限制：视频下载走中间网关签名的链接，中间网关的服务器地址（系统设置）必须能被外层网关访问；图片链接是百炼自己的。两边的 new-api 版本都需要支持在 New API 渠道上选择任务插件。

## 限制

- 不支持：实时语音对话（`qwen-audio-3.0-realtime-plus`，自有 WebSocket 协议）和决策模型（`decision-model-preview`，`/systemone` 接口，没有对应的 OpenAI 接口）。这两类请直接调用百炼。
- 未收录：千问图像 1.x（`qwen-image`、`qwen-image-plus`、`qwen-image-max`、`qwen-image-edit`、`qwen-image-edit-plus`、`qwen-image-edit-max` 及其日期版本），百炼已于 2026-10-10 下线（调用返回「Model not exist」，百炼推荐改用 `qwen-image-3.0`）；`-us` 后缀模型，当前百炼文档已不再列出（美国弗吉尼亚业务空间使用不带后缀的模型名）；万相 2.2 及更早版本。
- 图片生成不幂等：客户端重试会重新生成并再次计费。网关最多等待 `TASK_PLUGIN_PROTOCOL_TIMEOUT_SECONDS`（默认 600 秒）。
- 百炼结果链接 24 小时后失效，任务 id 也只保留 24 小时，请及时下载。
- 百炼拒绝的请求以及失败的图片、视频任务不计费。视频任务提交时预扣，完成后结算。
- `callback_url`、蒙版以及百炼未为该模型提供的字段会直接报错，不会被静默丢弃。

经 New API 上游下载文件时，调用中间网关 `/v1/tasks/{id}/artifacts/{key}/content`，携带 Bearer 令牌；直接访问厂商 CDN 时仍不携带密钥。
