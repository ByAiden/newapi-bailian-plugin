---
changelogVersion: 1
plugin: byaiden_bailian
version: 1.4.0
locale: "en"
translations:
  zh-CN: CHANGELOG.zh-CN.md
---

# Changelog

## [1.4.0]

### Added

- Channel setting Upstream type: Bailian API (default, unchanged behaviour) or OpenAI-compatible relay. With a relay, the Base URL is the relay's root and the key is the relay's key: chat completions, Responses, Claude Messages and embeddings go to the relay's `/v1/...` paths with the model name as sent and are billed from the usage the relay reports; image generation goes to the relay's `/v1/images/generations`; speech and transcription go to its `/v1/audio/speech` and `/v1/audio/transcriptions`; Fetch models returns the relay's `/v1/models` list.
- On a relay upstream, video models, image edits (input images) and the DashScope-native endpoints fail with an error that says why, before anything is sent or billed.

### Changed

- Selecting the plugin no longer pre-fills the embedding model `text-embedding-v4`: embeddings go to DashScope's OpenAI-compatible endpoint unchanged and bill exactly as on an ordinary OpenAI channel. Fetch models still returns it and `/v1/embeddings` still serves it and any other embedding model added to the channel; text, image, video, speech and transcription models stay pre-filled.
- Saving a channel no longer refuses keys by their prefix; a key that does not belong to the site gets Bailian's own authentication error. With the OpenAI-compatible relay upstream type, a blank Base URL or a bare Bailian address is refused with a hint to enter the relay's address.

### Fixed

- The README expressions for `z-image-turbo` and `wan2.6-i2v-flash` now use `u("prompt_extend") == true` and `u("audio") == true`, so the model page shows them as price tables; they bill exactly as before.
