[English](README.md) | [简体中文](README.zh-CN.md)

# Photo Flipbook

把照片或海报制作成可交互的本地 HTML 相册，搭配木桌背景、布面封皮、纸页厚度、投影和真实翻页效果。

## Demo · 效果预览

https://github.com/user-attachments/assets/827a3277-13a8-44a3-be71-2fc60e4bf3d5

## 核心功能

- 自适应单页／双页阅读，支持点击、拖动、触屏和方向键翻页。
- 保留照片完整内容和原始比例。
- 在页内添加手写文字，支持移动、框宽、字号、颜色、旋转、删除和保存。
- 内置手写字体，无需安装系统字体或联网加载。
- 笔记保存在本地，保留上次备份，并防止多窗口覆盖。
- 内置翻页音效，默认开启，也可自行提供音效替换。

## 环境与安装

需要 **Python 3.10+** 和现代浏览器。生成相册和保存文字仅使用 Python 标准库，无需 Node.js 或 npm。可选的联系表工具需要 Pillow（`python3 -m pip install Pillow`）；只有运行 JavaScript 检查时需要 Node.js 18+。

Clone 或下载本仓库。作为 Agent Skill 使用时，把整个目录放入工具的 Skill 目录并命名为 `photo-flipbook`。Codex 示例位置为 `~/.codex/skills/photo-flipbook`。保留 SKILL.md 旁的 assets、references 和 scripts，也可不经过 AI 直接运行生成器。

向 AI 提出：

> 使用 $photo-flipbook，把这个文件夹的照片制作成相册，保留完整照片，并支持手写感想。

SkillHub 使用 [`distributions/skillhub`](distributions/skillhub/SKILL.md) 中的启动版。首次使用时，它从本仓库的 GitHub Release 下载完整 v1.0.0 模板，并校验固定 SHA-256，以保留 GitHub 导入流程会过滤的字体和媒体。首次下载需要联网；也可用安装脚本的 `--archive` 参数指定已下载的完整 ZIP，离线完成安装。

## 基本使用

准备按阅读顺序排列的 JPEG、PNG、WebP、GIF 或 AVIF 图片；HEIC／RAW 请先转换。可另备桌面背景和有权使用的音效。生成器复制原图，不修改原文件；发布生成的相册前请自行检查照片元数据。

在本仓库目录执行：

```sh
python3 scripts/create-book.py --output output/my-book --title "我的相册" --photos photo1.jpg photo2.png
python3 output/my-book/notes-server.py
```

Windows 将 `python3` 换成 `py -3`。输出目录必须尚不存在。可增加 `--background desk.jpg`、`--sound page-turn.mp3`、`--subtitle "旅行手记"`。服务会打开浏览器，编辑时请保持终端运行。

生成目录内附 macOS 的 `open-flipbook.command`、Windows 的 `open-flipbook.bat` 和 Linux 的 `open-flipbook.sh`。若系统限制下载的启动脚本，直接使用上述 Python 命令。直接打开 `index.html` 可以阅读，但保存文字需要本地服务。

点击铅笔后，再点击书页添加文字。选中文字框可调整字号、颜色和倾斜，拖动把手改变位置和框宽，最后点击保存。当前编辑器按钮为中文，书籍标题与内容可使用其他语言。

笔记保存在生成目录的 `notes.json`，前一次保存为 `notes.backup.json`。迁移相册时一起复制，分享前检查私人内容。无需云端账户。可选的语义照片检索工具需要另行配置检索引擎，普通相册生成不依赖它。

## 目录结构

```text
SKILL.md                 AI 执行说明
agents/                  Agent 界面元数据
scripts/                 生成器与可选照片工具
references/              设计、运行和笔记保存说明
assets/html/             完整网页模板、字体与翻页引擎
assets/media-origin.md   素材来源与授权文件位置
```

## 验证

```sh
python3 assets/html/test-notes-server.py
node --test assets/html/html-contract.test.mjs
```

## 致谢

Photo Flipbook 基于 [create-photo-flipbook-ui](https://github.com/HaichaoLihc/create-photo-flipbook-ui) 的模板与工作流程扩展，增加了书桌场景、书本材质、翻页音效和可编辑手写文字。

原项目作者为 **Haichao Li**，采用 MIT 许可证；模板中保留了其[原始版权及许可证声明](assets/html/vendor/create-photo-flipbook-ui-license.txt)。

## 许可证

本项目中作者原创并有权授权的代码和内容采用 [MIT License](LICENSE)。第三方资产已有的独立许可证或授权声明继续有效，MIT 不覆盖或扩大其授权范围。字体保留 OFL，PageFlip 保留 MIT 声明，详见[素材来源](assets/media-origin.md)。运行模板不包含私人旅行照片或已保存笔记；演示视频和 GIF 展示了维护者的旅行相册。音效授权信息见素材来源说明。
