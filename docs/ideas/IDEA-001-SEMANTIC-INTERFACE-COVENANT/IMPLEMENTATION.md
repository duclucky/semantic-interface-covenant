# IDEA-001 — Implementation Status

**Trạng thái:** `BUILDING — STUDIONET LIFECYCLE VALIDATED`

**Ngày kiểm chứng local gần nhất:** 2026-07-26

**Ngày kiểm chứng Studionet gần nhất:** 2026-07-26

**Network evidence:**
[evidence/studionet/deployment.json](evidence/studionet/deployment.json)

**Submission notes:** [SUBMISSION.md](SUBMISSION.md)

**Builder integration:** [INTEGRATION.md](INTEGRATION.md)

Đây là hồ sơ implementation của `SemanticInterfaceCovenant`. Specification và
trust model chuẩn nằm tại [README.md](README.md).
Quy trình deployment/evidence nằm tại [DEPLOYMENT.md](DEPLOYMENT.md).

## Source và tests

- Primitive contract:
  [contracts/semantic_interface_covenant.py](../../../contracts/semantic_interface_covenant.py)
- Consumer contract:
  [contracts/tool_router_guard.py](../../../contracts/tool_router_guard.py)
- Primitive direct tests:
  [tests/direct/test_semantic_interface_covenant.py](../../../tests/direct/test_semantic_interface_covenant.py)
- Consumer direct tests:
  [tests/direct/test_tool_router_guard.py](../../../tests/direct/test_tool_router_guard.py)
- GenLayer frontend client:
  [frontend/lib/contracts/SemanticInterfaceCovenant.ts](../../../frontend/lib/contracts/SemanticInterfaceCovenant.ts)
- Covenant workbench:
  [frontend/app/covenant/page.tsx](../../../frontend/app/covenant/page.tsx)

`SemanticInterfaceCovenant` hiện có 30 public methods:

- 17 write methods;
- 13 view methods.

`ToolRouterGuard` hiện có 8 public methods:

- 4 write methods;
- 4 view methods.

## Đã triển khai

### Structured, isolated storage

Storage dùng các entity riêng:

- `Covenant`;
- `Guarantee`;
- `SourceRule`;
- `Binding`;
- `Case`;
- `Observation`;
- `Verdict`;
- `Cure`;
- `CureSource`.

Mọi record được key theo ID/composite ID trong `TreeMap`. Không có global
`last_verdict`, `last_score` hoặc raw result field mà caller tùy ý ghi đè.

### Bilateral covenant lifecycle

Provider:

1. tạo covenant;
2. thêm structured guarantee;
3. thêm public source rule;
4. activate để khóa cấu hình;
5. gửi GEN bond khi offer binding.

Integrator phải gọi `accept_binding`. Provider không thể tự chấp nhận thay
integrator.

### Case và evidence

Integrator hoặc authorized watcher:

1. gửi challenge bond;
2. mở case;
3. thêm observation URL nằm trong covenant allowlist;
4. gọi adjudication.

URL validation hiện có:

- HTTPS-only;
- giới hạn độ dài;
- chặn credential trong authority;
- chặn localhost, loopback, link-local và các private IPv4 range phổ biến;
- observation phải cùng authority và nằm dưới source prefix đã đăng ký;
- số source/observation bị giới hạn.

### Intelligent consensus

`adjudicate_case` thực hiện trong contract:

1. đọc guarantee/source/case state;
2. validator độc lập fetch public web evidence bằng `gl.nondet.web.get`;
3. gọi `gl.nondet.exec_prompt` với web content được đánh dấu untrusted;
4. normalize output;
5. dùng custom `run_nondet_unsafe` validator;
6. so exact consensus-critical fingerprint;
7. chỉ sau consensus mới ghi verdict, đổi binding state và cập nhật bond ledger.

Consensus-critical fields:

- compatibility class;
- severity band;
- source coverage;
- required action;
- sorted violated guarantee IDs.

Rationale không cần giống từng chữ.

### Verdict và settlement

- `COMPATIBLE`: binding giữ/khôi phục `ACTIVE`; challenge bond chuyển thành
  provider credit.
- `DEGRADED`: binding thành `DEGRADED`; challenge bond trả claimant.
- `BREAKING`: binding thành `QUARANTINED`; challenge bond trả claimant và
  service credit được trừ từ provider bond.
- `UNVERIFIABLE`: không slash provider; challenge bond trả claimant.

Credit được giữ trong per-account ledger. `withdraw_credit` trừ ledger rồi phát
external `EthSend` value transfer tới caller.

### Cure

Provider của binding có thể:

1. submit cure gắn với parent verdict;
2. thêm allowlisted cure evidence;
3. top up bond nếu bond không còn đủ;
4. yêu cầu validator adjudicate cure.

Binding chỉ trở lại `ACTIVE` nếu consensus trả `CURED` và provider bond đã đủ
service credit cho incident tiếp theo.

### Access control và invariants

Direct tests hiện chứng minh:

- chỉ provider cấu hình/activate/deprecate covenant của mình;
- chỉ designated integrator accept binding;
- chỉ integrator hoặc watcher mở case;
- chỉ provider submit cure/top-up;
- one active case và one active cure trên mỗi binding;
- binding/case isolation;
- source allowlist;
- không adjudicate/settle cùng case hai lần;
- provider bond không bị trừ cho verdict không punitive;
- settlement bị cap bởi provider bond;
- close binding chuyển bond còn lại thành credit của provider;
- rút vượt credit bị revert.

### Consumer enforcement và subscriber message

`ToolRouterGuard` là consumer contract độc lập, không phải một bảng hiển thị:

- chỉ nhận `on_covenant_status` từ đúng covenant contract và đúng `binding_id`;
- xử lý notification theo `verdict_id` idempotently;
- chặn route khi trạng thái là `QUARANTINED` hoặc `CLOSED`;
- chặn `DEGRADED` theo mặc định, nhưng owner có thể chọn policy cho phép;
- chỉ operator được cấu hình mới có thể ghi route record;
- lưu route record có `request_id`, `tool_id`, operator, covenant status và
  verdict đã áp dụng.

Direct test của primitive đã chứng minh verdict breaking phát một finalized
`PostMessage` với calldata `on_covenant_status(binding_id, verdict_id,
"QUARANTINED")`. Direct tests của consumer chứng minh authorization,
idempotency, quarantine và cure/restore. Hai phía đã được kiểm thử độc lập;
delivery giữa hai contract trên một network vẫn cần real evidence.

### Frontend lifecycle

Trang `/covenant` dùng GenLayer client thật để:

- đọc covenant, binding, case, verdict, violations và withdrawable credit;
- tạo/activate covenant và thêm guarantee/source;
- offer/accept binding với GEN value;
- mở case, thêm public observation và gọi validator adjudication;
- submit cure, top-up bond, adjudicate cure và withdraw credit;
- estimate write fee, gửi transaction, chờ `decided`, rồi chờ `finalized`;
- resume finality tracking bằng transaction hash;
- refresh lại canonical contract state sau finalization.

Trang không tạo contract address, transaction hash, wallet signature hoặc state
giả trong `localStorage`. Khi
`NEXT_PUBLIC_COVENANT_CONTRACT_ADDRESS` chưa được cấu hình, trang hiển thị
`NOT CONFIGURED` và khóa các hành động onchain.

## Verification đã chạy

Lệnh:

```powershell
npm run check
```

Kết quả:

- `FootballBets`: lint pass;
- `PatternTest`: lint pass;
- `SemanticInterfaceCovenant`: lint pass;
- `ToolRouterGuard`: lint pass;
- 74 direct tests pass;
- 1 xfail đã biết trong test cũ về `strict_eq`/sandbox của direct-mode upstream;
- frontend TypeScript `tsc --noEmit` pass;
- Next.js production build pass.

Riêng IDEA-001:

```text
14 SemanticInterfaceCovenant tests passed
7 ToolRouterGuard tests passed
```

Coverage gồm bilateral acceptance, isolation, access control, URL boundary,
bond accounting, all verdict classes, validator replay, malicious leader
fingerprint, prompt-injection output normalization, cure/top-up và external
withdrawal emission, finalized subscriber message, consumer authorization,
idempotency và route enforcement.

Visual QA local tại `http://localhost:3100/covenant` đã pass. Browser thực hiện
ba view calls và hiển thị đúng canonical Studionet state: covenant `active`,
binding `ACTIVE`, case `RESOLVED` và verdict
`BREAKING/CRITICAL/SUFFICIENT` vi phạm `method-key`. Không có console error.
Snapshot đọc được ghi trong network evidence; đây là read evidence, không được
trình bày như browser-signed transaction evidence.

## Đã chứng minh trên Studionet

- primitive và consumer deployment bằng ví người dùng;
- hai EOA độc lập ký provider/integrator actions;
- transaction lifecycle tới `FINALIZED`;
- live web/LLM consensus cho `BREAKING` và `CURED`;
- finalized subscriber delivery đổi guard `ACTIVE → QUARANTINED → ACTIVE`;
- guard chặn route khi quarantine và nhận route trở lại sau cure;
- payable bond settlement và withdrawal làm số dư integrator tăng `1.1 GEN`.

Các mục dưới đây vẫn là `PENDING_REAL_EVIDENCE`:

- browser-wallet write trực tiếp từ frontend;
- deployment/lifecycle trên Asimov hoặc Bradbury;
- external adopter.

Frontend đã được cấu hình deployed address, đọc canonical state và dùng đúng
GenLayerJS `status: "ACCEPTED"|"FINALIZED"` lifecycle. Production build đã
pass; browser-signed write vẫn được giữ riêng là evidence còn thiếu.

## Khoảng cách so với specification

Implementation hiện tại chưa có:

- immutable content hash/snapshot cho baseline document;
- indexer;
- external adopter;
- pagination cursor; các list view hiện bounded bằng hard limit nhỏ;
- cơ chế DNS-level chống rebinding ngoài URL validation mà contract tự thực
  hiện.

Nếu GenVM web access không thể bảo đảm network-level SSRF boundary trong môi
trường triển khai, live arbitrary observation phải tiếp tục bị giới hạn vào
provider domains đã đăng ký và không được quảng bá là một general-purpose web
fetcher.

## Điều kiện để chuyển sang VALIDATED

Không chuyển registry sang `VALIDATED` cho tới khi:

1. primitive và consumer được deploy với address/receipt được lưu riêng theo
   network;
2. frontend dùng deployed address, gửi transaction đến finalized và đọc lại
   canonical state;
3. subscriber message thực sự đổi trạng thái consumer và consumer chặn route
   trên network;
4. withdrawal path được kiểm chứng bằng balance/receipt trên network;
5. README claim khớp hoàn toàn với source và evidence;
6. có ít nhất một integration/example ngoài chính workbench chứng minh đường
   adoption khả tín.
