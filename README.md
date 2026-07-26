# GenLayer Development Workspace

Môi trường Windows-first để nghiên cứu, viết, test, deploy Intelligent Contract
và xây dApp GenLayer. Workspace dựa trên boilerplate chính thức, có thêm Codex
MCP, Transaction Kit, tài liệu nghiên cứu và các workaround đã kiểm chứng trên
Windows.

## Trạng thái hiện tại

- Node.js 22 và GenLayer CLI 0.39.2.
- Python 3.12 trong `.venv`.
- Contract lint + semantic validation.
- 43 direct-mode tests, gồm mock web/LLM.
- Next.js frontend và production build.
- GenLayer MCP project config + script handshake kiểm tra tool list.
- Transaction Kit core/React pin từ package branches chính thức.
- Hosted Docs MCP đã ghi cấu hình nhưng tắt vì endpoint đang trả HTTP 502.
- Localnet Docker chưa khả dụng trên máy hiện tại: Docker Desktop installer đã
  tải và xác minh nhưng cần Administrator/UAC để hoàn tất.

## Bắt đầu nhanh

Mở PowerShell tại repository:

```powershell
npm run setup
```

Lệnh này cài/đồng bộ Python 3.12, `.venv`, Python dependencies, Node
dependencies, tạo `frontend/.env` từ file mẫu nếu chưa có, rồi chạy toàn bộ
verification.

Các lệnh dùng hàng ngày:

```powershell
npm run lint:contracts
npm run test:direct
npm run lint
npm run build
npm run check
npm run mcp:verify
npm run dev
```

Frontend:

- app mẫu: `http://localhost:3000`
- Transaction Kit lab: `http://localhost:3000/transaction-kit`

## Localnet và network

Direct tests không cần Docker. Local Studio/localnet cần Docker Desktop:

```powershell
winget install --exact --id Docker.DockerDesktop `
  --accept-package-agreements --accept-source-agreements

# Sau khi chấp nhận UAC và reboot nếu Windows yêu cầu:
npm run localnet:init
npm run localnet:up
npm run localnet:stop
```

Lần chạy tự động hiện tại dừng ở UAC với installer exit code `4294967291`;
không coi Docker/localnet là đã cài cho đến khi `docker version` và
`genlayer init --headless` cùng chạy thành công.

RPC mặc định:

- localnet: `http://127.0.0.1:4000/api`
- hosted Studionet: `https://studio.genlayer.com/api`

Không trộn contract address, balance, ví hoặc evidence giữa các network.

## Deploy

Sau khi localnet/Studionet hoạt động:

```powershell
genlayer network
genlayer deploy
```

Integration tests:

```powershell
.\.venv\Scripts\gltest.exe tests\integration -v -s --network studionet
```

Testnet cần account riêng trong `.env`; không commit private key. Không ghi nhận
contract address hoặc transaction hash nếu chưa có output/explorer evidence
thật.

## MCP trong Codex

Trust repository rồi restart task để Codex nạp `.codex/config.toml`. Kiểm tra
server cục bộ độc lập:

```powershell
npm run mcp:verify
```

`genlayer-mcp` là experimental; mọi code sinh ra phải qua `npm run check`.

## Dependency audit

`npm audit --omit=dev` hiện còn 3 high advisories trong dependency nội bộ
`postcss`/`sharp` của Next.js 16.2.12. Đây là bản Next stable mới nhất tại lúc
kiểm tra; đề xuất tự động duy nhất của npm là `--force` hạ xuống Next 9.3.3,
một thay đổi breaking nên không được áp dụng. Không còn advisory critical.

## Tài liệu

- [Nghiên cứu CDK, MCP, Transaction Kit](docs/05-CDK-MCP-TRANSACTION-KIT.md)
- [Tổng quan GenLayer](docs/00-TONG-QUAN-GENLAYER.md)
- [Quy trình build và nộp](docs/01-QUY-TRINH-BUILD-VA-NOP.md)
- [Checklist](docs/03-CHECKLIST-TRUOC-KHI-NOP.md)

Một số tài liệu cũ trong repository ghi quy tắc header/version từ các bản Studio
trước. Khi có xung đột, ưu tiên source boilerplate hiện tại, linter hiện tại và
tài liệu chính thức mới nhất.
