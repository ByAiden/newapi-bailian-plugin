---
changelogVersion: 1
plugin: byaiden_bailian
version: 1.4.0
locale: "zh-CN"
---

# Changelog

## [1.4.0]

### Added

- 渠道设置「上游类型」：百炼官方 API（默认，行为与之前一致）或 OpenAI 兼容中转。选中转时 Base URL 填中转根地址、Key 填中转的 Key：Chat Completions、Responses、Claude Messages 和 Embeddings 发往中转的 `/v1/...` 路径，模型名原样发送，按中转返回的 usage 计费；图片生成走中转的 `/v1/images/generations`；语音合成和语音识别走中转的 `/v1/audio/speech`、`/v1/audio/transcriptions`；「获取模型列表」返回中转 `/v1/models` 的列表。
- 中转模式下视频模型、图片编辑（输入图片）和 DashScope 原生接口会直接报错说明原因，不会发出请求，也不计费。

### Changed

- 保存渠道时不再按 Key 前缀拒绝 Key；Key 与站点不匹配时由百炼返回其鉴权错误。上游类型为 OpenAI 兼容中转时，Base URL 留空或填百炼地址根路径会被拒绝，并提示填写中转地址。

### Fixed

- README 中 `z-image-turbo` 和 `wan2.6-i2v-flash` 的计费表达式改为 `u("prompt_extend") == true`、`u("audio") == true` 的写法，模型广场详情页能展开为价格表；计费结果与原表达式完全相同。
