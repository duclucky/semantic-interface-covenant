# GenLayer CDK, MCP và App Kit - kết quả nghiên cứu 2026-07-26

## Kết luận ngắn

Tại thời điểm kiểm tra, GenLayer không có sản phẩm chính thức mang đúng tên
**CDK** hoặc **AppKit** trong tài liệu developer và danh sách repository công
khai. Cách ánh xạ đúng cho môi trường này là:

| Từ khóa ban đầu | Thành phần GenLayer thực tế |
| --- | --- |
| CDK | GenLayer CLI + project boilerplate + GenLayer SDK + test/linter |
| MCP | `genlayer-mcp` cục bộ + GenLayer Docs MCP hosted |
| App Kit | `genlayer-transaction-kit` (core, React, Vue) |

Không cài package có tên gần giống từ hệ sinh thái khác.

## 1. "CDK" thực tế là development stack

Luồng chính thức hiện tại:

1. Python 3.12+ cho contract, linter và test.
2. Node.js 18+ cho CLI, deployment scripts và frontend.
3. `genlayer` CLI để tạo project, chạy localnet, deploy, call/write và đọc
   receipt/trace.
4. `genlayer-project-boilerplate` làm cấu trúc chuẩn: `contracts`, direct tests,
   integration tests, `frontend`, `deploy`, `gltest.config.yaml`.
5. `genvm-linter`, `genlayer-test`, `genlayer-py`, `genlayer-js`.
6. Docker 26+ chỉ cần khi chạy local Studio/localnet; direct tests và GLSim
   không cần Docker.

Nguồn:

- [Development Setup](https://docs.genlayer.com/developers/intelligent-contracts/tooling-setup)
- [GenLayer CLI reference](https://docs.genlayer.com/api-references/genlayer-cli)
- [Official project boilerplate](https://github.com/genlayerlabs/genlayer-project-boilerplate)
- [API references](https://docs.genlayer.com/api-references)

Phiên bản đã xác minh trên máy:

- GenLayer CLI: `0.39.2`
- Node.js: `22.22.3`
- Python trong `.venv`: `3.12.13`
- `genlayer-test`: `0.29.2`
- `genvm-linter`: `0.10.0`

Python transitive dependencies được khóa theo commit/version trong
`requirements.lock`; `requirements.txt` vẫn giữ các pin upstream dễ đọc.

## 2. MCP

### Local GenLayer MCP

Tài liệu GenLayer hướng dẫn chạy MCP bằng npm. Workspace cấu hình server
`genlayer` trong `.codex/config.toml`:

```toml
[mcp_servers.genlayer]
command = "npx.cmd"
args = ["-y", "genlayer-mcp@2.2.0"]
```

Package hiện cung cấp các tool tạo contract, equivalence principle, web access,
prediction market, deployment script, GenLayerJS integration, testing
framework và giải thích khái niệm.

Lưu ý: README của chính package ghi rõ đây là proof-of-concept thử nghiệm và có
thể chứa lỗi. Vì vậy output MCP không được xem là bằng chứng đúng; luôn chạy:

```powershell
npm run lint:contracts
npm run test:direct
```

Nguồn:

- [GenLayer agent-assisted development](https://docs.genlayer.com/developers/intelligent-contracts/tooling-setup#agent-assisted-development)
- [genlayer-mcp package source](https://github.com/albert-mr/genlayer-mcp-server)

### Hosted Docs MCP

Endpoint được tài liệu công bố:

```text
https://docs-mcp.genlayer.com/sse
```

Endpoint trả HTTP 502 trong lần kiểm tra ngày 2026-07-26. Cấu hình
`genlayer_docs` đã được ghi sẵn qua `mcp-remote`, nhưng để `enabled = false`.
Chỉ bật lại sau khi endpoint hoạt động.

## 3. Transaction Kit - thành phần gần nhất với "AppKit"

Repository chính thức `genlayer-transaction-kit` cung cấp:

- `@genlayer/transaction-kit`: core không phụ thuộc framework;
- `@genlayer/transaction-kit-react`: panel và hook cho React;
- `@genlayer/transaction-kit-vue`: adapter Vue;
- luồng estimate fee -> review -> sign -> track consensus;
- hỗ trợ ví EIP-1193, không bắt buộc MetaMask;
- developer fee profile đo offline từ test.

Đây vẫn là Stage 1/pre-release. Ghi chú này chỉ lưu kết quả khảo sát tooling;
project `Semantic Interface Covenant` không cài Transaction Kit và không chứa
mock transaction route. Frontend dự án dùng `genlayer-js` trực tiếp để estimate,
gửi giao dịch, chờ `ACCEPTED`/`FINALIZED` và đọc lại canonical state.

Nguồn:

- [Official Transaction Kit repository](https://github.com/genlayerlabs/genlayer-transaction-kit)
- [GenLayerJS contract methods](https://docs.genlayer.com/api-references/genlayer-js/contracts)

## 4. GenLayer Skills

GenLayer hiện đề xuất plugin `genlayerlabs/skills` cho Claude Code. Đó không
phải plugin Codex cài trực tiếp. Workspace đã chuyển phần tương đương sang:

- `AGENTS.md` cho quy ước bền vững;
- `.codex/config.toml` cho MCP;
- `scripts/setup.ps1` và `scripts/check.ps1` cho workflow có thể lặp lại.

Nguồn:

- [Getting Started with GenLayer](https://docs.genlayer.com/developers)
- [Official GenLayer skills repository](https://github.com/genlayerlabs/skills)

## 5. Bằng chứng runtime hosted

Hosted Studionet không cần Docker và đã được dùng để kiểm chứng full lifecycle
thật ngày 2026-07-26 cho `SemanticInterfaceCovenant` và `ToolRouterGuard`.
Validators đọc public evidence, phán `BREAKING`, quarantine consumer, quyết
toán GEN, sau đó phán cure và restore route. Toàn bộ transaction/finality/state
evidence nằm tại
`docs/ideas/IDEA-001-SEMANTIC-INTERFACE-COVENANT/evidence/studionet/deployment.json`.

## 6. Gate còn cần quyền Administrator

`genlayer init --headless` đã được chạy và thất bại chính xác vì Docker pipe
`//./pipe/docker_engine` chưa tồn tại. Docker Desktop 4.83.0 được tải qua
winget và installer hash hợp lệ, nhưng quá trình silent không thể vượt UAC
(`4294967291`). Cần chạy lệnh sau trong PowerShell và chấp nhận UAC:

```powershell
winget install --exact --id Docker.DockerDesktop `
  --accept-package-agreements --accept-source-agreements
```

Máy hiện cũng báo WSL chưa được cài. Nếu Docker yêu cầu WSL 2, chạy
`wsl --install --no-distribution` trong PowerShell Administrator và reboot.

Sau reboot nếu được yêu cầu, chỉ đánh dấu Docker/localnet sẵn sàng khi:

```powershell
docker version
genlayer init --headless
genlayer up --headless
```

Project hiện không giữ integration runner của boilerplate. Mọi localnet
lifecycle mới phải được viết riêng cho `SemanticInterfaceCovenant` và lưu
evidence tách biệt với Studionet.
