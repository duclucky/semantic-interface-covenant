# GenLayer Intelligent Contract Idea Registry

Đây là **nguồn chuẩn duy nhất** để ghi nhận ý tưởng Intelligent Contract trong
workspace. Mục tiêu của registry không phải tích lũy thật nhiều tên, mà là ngăn
việc vô tình lặp lại một trust model cũ dưới tên, ngành hoặc giao diện khác.

Mọi ý tưởng phải được đăng ký ở đây và có fingerprint trước khi viết contract.
Quy trình tạo, so sánh và loại ý tưởng nằm tại
[docs/ideas/README.md](ideas/README.md).

## Quy tắc không trùng

Tên sản phẩm, đối tượng ngành và prompt LLM không tạo nên một ý tưởng mới. Một
ý tưởng được xem là khác về cấu trúc khi nó thay đổi đáng kể các chiều sau:

1. **Trust problem:** quyết định nào không được phép phụ thuộc một bên?
2. **Actors và adversary:** ai có lợi nếu kết quả bị thiên lệch?
3. **Evidence class:** validator kiểm tra loại bằng chứng nào?
4. **Consensus question:** validator phải đồng thuận chính xác về điều gì?
5. **State machine:** những entity và chuyển trạng thái nào tồn tại onchain?
6. **Direct consequence:** tiền, quyền, trạng thái hoặc hành vi nào đổi ngay?
7. **Reuse surface:** builder khác gọi primitive này bằng interface nào?

Nếu một ý tưởng mới giống mục đã có ở **từ bốn chiều trở lên**, mặc định xem là
trùng. Người đề xuất phải chỉ ra sự khác biệt cấu trúc, không chỉ khác use case.

## Trạng thái

| Trạng thái | Ý nghĩa |
|---|---|
| `CANDIDATE` | Đang khảo sát, chưa vượt đủ các cổng |
| `SELECTED` | Đã vượt novelty và value gates, được phép viết spec |
| `DESIGN` | Có specification, chưa có contract hoàn chỉnh |
| `BUILDING` | Đang triển khai contract/test/integration |
| `VALIDATED` | Lint, test và lifecycle đã được kiểm chứng |
| `LEGACY-EXCLUDED` | Brainstorm cũ; giữ làm vùng chống trùng, không build |
| `REJECTED` | Không đạt trust/value/reuse gate |
| `ARCHIVED` | Từng hợp lệ nhưng không tiếp tục |

## Ý tưởng đang hoạt động

| ID | Tên | Trạng thái | Fingerprint rút gọn | Specification |
|---|---|---|---|---|
| `IDEA-001` | Semantic Interface Covenant | `BUILDING` | Provider và integrator cùng chấp nhận một covenant có bond; validator phán semantic compatibility của API/MCP/agent tool từ bằng chứng công khai; verdict quarantine/restore integration và quyết toán bond | [IDEA-001](ideas/IDEA-001-SEMANTIC-INTERFACE-COVENANT/README.md) |

## Vùng loại trừ lịch sử

Các mục sau được giữ lại để chặn việc đổi tên hoặc đổi domain rồi nộp lại cùng
một cấu trúc.

| ID | Ý tưởng/cấu trúc | Trạng thái | Fingerprint bị loại hoặc đã dùng |
|---|---|---|---|
| `HIST-001` | CampaignScoreRegistry | `REJECTED` | Backend tự chấm campaign; contract chỉ nhận raw JSON và ghi đè ba global fields; không có nondeterministic judgment, consensus-critical transition, isolation hay settlement |
| `LEGACY-001` | WebComplianceOracle | `LEGACY-EXCLUDED` | URL + natural-language criteria → `PASS/PARTIAL/FAIL`; generic policy oracle |
| `LEGACY-002` | SubjectiveVoteResolver | `LEGACY-EXCLUDED` | Nhiều lập luận → LLM jury chọn bên thắng; generic debate/governance verdict |
| `LEGACY-003` | MultiSourceFactCheck | `LEGACY-EXCLUDED` | Claim + nhiều URL → true/false/confidence; generic fact checker |
| `LEGACY-004` | QualitativeMilestoneVerifier | `LEGACY-EXCLUDED` | PR/issue + mô tả milestone → đạt/không đạt; grant/bounty deliverable evaluation |
| `LEGACY-005` | NuancedClauseInterpreter | `LEGACY-EXCLUDED` | Điều khoản mơ hồ + tình huống → áp dụng/không; generic legal/SLA/insurance interpretation |
| `LEGACY-006` | EscrowWithSubjectiveRelease | `LEGACY-EXCLUDED` | Một escrow, một subjective verdict, release/refund |
| `LEGACY-007` | ReputationJury | `LEGACY-EXCLUDED` | Entity + rubric → score band và lịch sử reputation |
| `LEGACY-008` | DisputeEscalator | `LEGACY-EXCLUDED` | Sơ thẩm/phúc thẩm nhiều contract; generic escalation wrapper |

## Vì sao IDEA-001 không phải bản đổi tên

`IDEA-001` không nhận một đối tượng bất kỳ rồi chấm theo rubric tùy ý. Nó có
một protocol chuyên biệt:

- entity riêng gồm `Covenant`, `Binding`, `Case`, `Verdict` và `Cure`;
- hai bên chấp nhận trước các guarantee ID, nguồn được phép và hậu quả;
- provider bond và claimant challenge bond tạo động cơ chống gian lận;
- verdict chuyên ngành là `COMPATIBLE`, `DEGRADED`, `BREAKING` hoặc
  `UNVERIFIABLE`, không phải score chung;
- verdict trực tiếp đổi trạng thái integration thành `ACTIVE`, `DEGRADED` hoặc
  `QUARANTINED`, rồi quyết toán bond;
- consumer contract có thể đọc trạng thái hoặc nhận message finalized để dừng
  dùng một interface bị phá vỡ.

Nó khác uptime watchdog: một endpoint có thể trả HTTP 200 nhưng đã đổi ý nghĩa
của field hoặc tool behavior. Nó khác OpenAPI diff: thay đổi schema có thể
không phá semantic guarantee, và thay đổi câu chữ/behavior có thể phá covenant
dù schema giữ nguyên.

## Nhật ký khảo sát novelty

### 2026-07-26 — trước khi chọn IDEA-001

Đã so sánh với:

- tám ý tưởng legacy trong repository;
- phản hồi của GenLayer về `CampaignScoreRegistry`;
- các nhóm phổ biến trong public GenLayer ecosystem: fact-check, sentiment,
  price oracle, prediction resolution, bounty/milestone evaluation, escrow,
  ACP deliverable evaluator, reputation, governance, license compliance,
  server-health watchdog và agent intent execution;
- danh sách project công khai trên GenHub tại thời điểm khảo sát.

Không tìm thấy một GenLayer primitive công khai có cùng tổ hợp:
**bilateral interface covenant + semantic compatibility adjudication +
quarantine + bonded settlement**. Đây là kết quả khảo sát, không phải tuyên bố
bằng sáng chế hay khẳng định tuyệt đối rằng không có implementation riêng tư.

Các nguồn chuẩn dùng để khóa thiết kế:

- [When to Use GenLayer](https://docs.genlayer.com/developers/intelligent-contracts/when-to-use-genlayer)
- [Value Transfers](https://docs.genlayer.com/developers/intelligent-contracts/features/value-transfers)
- [Messages](https://docs.genlayer.com/developers/intelligent-contracts/features/messages)
- [GenHub Projects](https://community.genhub.fun/projects)

## Quy tắc cập nhật

Khi có ý tưởng mới:

1. Gán ID kế tiếp, không tái sử dụng ID.
2. Điền đủ fingerprint bảy chiều.
3. So với toàn bộ bảng hoạt động và vùng loại trừ.
4. Ghi ít nhất ba analogue gần nhất và sự khác biệt cấu trúc.
5. Chạy toàn bộ admission gates trong `docs/ideas/README.md`.
6. Chỉ chuyển sang `DESIGN` khi có file spec riêng.
7. Chỉ chuyển sang `BUILDING` khi spec chỉ rõ consensus boundary, consequence,
   storage isolation, failure policy và test plan.

Không xóa ý tưởng bị loại. Giữ chúng trong registry chính là cơ chế chống lặp.
