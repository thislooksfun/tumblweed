# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


<!-- Template

## [Unreleased]
### Added
- New stuff

### Changed
- Fixed/tweaked stuff

### Removed
- Removed stuff

-->


## [Unreleased]
N/A


## [1.2.0]
### Added
- Now writes an `<id>.meta.json` file alongside the `<id>.json` file.
- Smartly uses that new `.meta.json` file to skip previously downloaded posts if they finished with no errors.

### Changed
- Fix visual glitch when adding a blog by URL.
- Set page size to 20, not 1.
- Don't try to download external videos.
- Fix error when post is an abstract (has a "read more" link).
- Fix error if a link post doesn't have a preview image.
- Fix occasional ENOTFOUND issue.
- Process avatars and header images seperately from posts.


## [1.1.0]
### Added
- Support for audio, chat, link, and quote posts.
- Fix 'add blog' popup title text.


## [1.0.1] - 2018-12-14
### Added
- Signed the mac app.


## 1.0.0 - 2018-12-14
### Added
- Support for downloading answer, photo, text, and video posts.
- Support for downloading embedded \<img>, \<figure>, \<source>, and \<video> tags.
- Basic settings window.
- In-app updates.


[Unreleased]: https://github.com/thislooksfun/tumblweed/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/thislooksfun/tumblweed/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/thislooksfun/tumblweed/compare/v1.0.0...v1.0.1
<!-- First release: v1.0.0 -->