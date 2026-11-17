---
changelogVersion: 1
plugin: byaiden_bailian
version: 1.3.0
locale: "zh-CN"
---

# Changelog

## [1.3.0]

### Added

- 用一个任务插件渠道和一个百炼 API Key 接入阿里云百炼，支持北京站和国际站 DashScope 地址。
- 文本透传 OpenAI Chat Completions、OpenAI Responses、Claude Messages 和 Embeddings，支持流式，覆盖千问、DeepSeek、GLM、Kimi；其他百炼文本模型按名称加到渠道即可使用。
- 图片：千问图像 3.0 与 3.0 Pro、2.1 Pro、2.0 与 2.0 Pro 及其日期版本，Z-Image Turbo，万相 2.7、2.6、2.5 图片模型，支持 OpenAI 图片接口和 DashScope 图片接口，按实际交付张数计费。
- 视频：万相 3.0 及 Prime、HappyHorse 1.1、万相 2.7（含日期版本）、万相 2.6（含 flash）和万相 2.5 预览版，支持 OpenAI 视频接口和 DashScope 视频、任务接口，按秒和分辨率计费，按百炼返回的秒数结算。
- 语音合成：Qwen-Audio 3.0 TTS Plus 走 OpenAI 语音接口，直接返回音频，可设渠道默认音色；语音识别：Qwen-Audio 3.0 ASR Flash 走 OpenAI 转写接口。
- 「获取模型列表」从百炼读取该 Key 可用的模型，只保留本插件能服务的模型，并补上百炼列表中缺失的视频和图片模型。
- 支持经由另一个 New API 网关：外层网关的 New API（60）渠道可绑定本插件，图片、视频任务用同样的表达式定价。
- README 附百炼标价的现成计费表达式。
