# IDEA-001 — Deployment and Real-Evidence Runbook

Tài liệu này vừa ghi trạng thái deployment đã kiểm chứng, vừa là quy trình có
thể chạy lại. Chỉ address, transaction hash và trạng thái nằm trong evidence
theo network mới được xem là bằng chứng thật.

## Trạng thái Studionet đã kiểm chứng

- Network: `studionet`, chain ID `61999`.
- Primitive:
  `0x05b27207c7aC50d22E5C1afBfD3c20DBccCa0570`.
- Consumer guard:
  `0xA58132c068E0406E2d5d43E8b72E2b2361ac057D`.
- Full lifecycle từ deployment đến consensus, quarantine, cure, route
  enforcement và withdrawal đã đạt `FINALIZED`.
- Frontend `/covenant` đã đọc canonical covenant, binding, case và verdict từ
  Studionet.
- Browser-wallet write từ frontend còn chờ một Chrome session có connector và
  MetaMask; không được gộp bằng chứng này với các transaction ký bởi script.

Nguồn evidence:
[evidence/studionet/deployment.json](evidence/studionet/deployment.json).

## Secret boundary

Không đưa private key/seed phrase vào source, README, shell history, log hoặc
chat. Script chỉ đọc hai biến từ root `.env`, file này bị Git ignore:

```dotenv
STUDIONET_PRIVATE_KEY=<provider key>
STUDIONET_INTEGRATOR_PRIVATE_KEY=<integrator key>
```

Không đưa secret vào `frontend/.env`; mọi biến `NEXT_PUBLIC_*` được gửi xuống
browser và chỉ được chứa dữ liệu công khai.

## Script Studionet có thể tiếp tục

Chạy từ `C:\Genlayer`:

```powershell
node scripts/deploy-idea001-studionet.mjs inspect
node scripts/deploy-idea001-studionet.mjs deploy-primitive
node scripts/deploy-idea001-studionet.mjs deploy-guard
node scripts/deploy-idea001-studionet.mjs setup-provider
node scripts/deploy-idea001-studionet.mjs fund-integrator
node scripts/deploy-idea001-studionet.mjs run-demo
```

Mỗi command đọc evidence trước khi gửi giao dịch, xác nhận key khớp đúng ví đã
ghi nhận và tiếp tục từ state hiện có. Không xóa evidence để buộc chạy lại một
giao dịch đã finalized.

## Cấu hình frontend

Chỉ dùng address công khai đã xác minh:

```dotenv
NEXT_PUBLIC_COVENANT_CONTRACT_ADDRESS=0x05b27207c7aC50d22E5C1afBfD3c20DBccCa0570
NEXT_PUBLIC_TOOL_ROUTER_GUARD_ADDRESS=0xA58132c068E0406E2d5d43E8b72E2b2361ac057D
```

Sau đó:

```powershell
npm run dev -- --port 3100
```

Mở `http://localhost:3100/covenant`. Read actions phải trả canonical state và
không fallback sang demo data. Với write action, UI phải đi qua:

```text
SUBMITTING → SUBMITTED → DECIDED → FINALIZED → READING_STATE → COMPLETE
```

Nếu browser đóng giữa chừng, nhập transaction hash vào `Resume finality` thay
vì gửi lại giao dịch.

## Network evidence bắt buộc

Một lifecycle tối thiểu phải chứng minh:

1. provider tạo/activate covenant với guarantee và allowlisted source;
2. provider offer binding kèm bond, integrator accept;
3. integrator/watcher mở bonded case và thêm live public evidence;
4. validators adjudicate `BREAKING`;
5. binding trở thành `QUARANTINED` và settlement ledger đổi;
6. finalized message đổi `ToolRouterGuard` sang `QUARANTINED`;
7. một route request bị consumer từ chối;
8. provider submit cure + evidence, top up nếu cần;
9. validators adjudicate `CURED`, binding/consumer trở lại `ACTIVE`;
10. một route request mới thành công;
11. claimant/provider withdraw credit và balance/receipt xác nhận value transfer;
12. frontend đọc lại state onchain sau mỗi finalization.

Lifecycle trên đã được ghi nhận cho Studionet trong evidence JSON. Khi chạy lại
trên Asimov hoặc Bradbury, tạo thư mục evidence riêng; không ghi đè kết quả
Studionet.

Evidence phải được tách theo network. Không dùng local direct-test output để
thay thế Studionet/Asimov/Bradbury evidence.

## Điều kiện dừng an toàn

Dừng và không tuyên bố thành công nếu:

- transaction chỉ submitted/decided nhưng chưa finalized;
- subscriber message không đến consumer;
- UI chỉ hiện hash nhưng không đọc lại contract state;
- balance/receipt không xác nhận withdrawal;
- source URL không phải public HTTPS allowlisted source;
- explorer/CLI output mâu thuẫn với README;
- frontend hiển thị state local hoặc hash tĩnh thay cho view trả từ contract.
