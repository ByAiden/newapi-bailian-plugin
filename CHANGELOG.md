---
changelogVersion: 1
plugin: byaiden_bailian
version: 1.3.0
locale: "en"
translations:
  zh-CN: CHANGELOG.zh-CN.md
---

# Changelog

## [1.3.0]

### Added

- One Task Plugin channel for Alibaba Cloud Bailian with a Bailian API key, on the Beijing or the international DashScope host.
- Text passthrough for OpenAI chat completions, OpenAI Responses, Claude Messages and embeddings, streaming included, for Qwen, DeepSeek, GLM and Kimi; any other Bailian text model works when added to the channel by name.
- Images for Qwen-Image 3.0 and 3.0 Pro, 2.1 Pro, 2.0 and 2.0 Pro with their dated versions, Z-Image Turbo, and Wan 2.7, 2.6 and 2.5 image models, on the OpenAI images endpoints and the DashScope image endpoints, billed per delivered image.
- Video for Wan 3.0 and Prime, HappyHorse 1.1, Wan 2.7 (with dated versions), Wan 2.6 including the flash model, and the Wan 2.5 previews, on the OpenAI videos endpoints and the DashScope video and task endpoints, billed per second and resolution and settled on the seconds Bailian reports.
- Speech for Qwen-Audio 3.0 TTS Plus on the OpenAI speech endpoint, returning audio bytes, with a channel default voice; transcription for Qwen-Audio 3.0 ASR Flash on the OpenAI transcriptions endpoint.
- Fetch models reads the models the key can use from Bailian, keeping the ones this plugin can serve and adding the video and image models Bailian's list leaves out.
- Works through another New API gateway: a New API (type 60) channel on an outer gateway can bind the plugin and price image and video tasks with the same expressions.
- Ready-made billing expressions at the Bailian list prices in the README.
