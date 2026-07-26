# Quy trình đăng ký và chống trùng ý tưởng

Thư mục này chứa specification của từng Intelligent Contract idea. Registry
chuẩn nằm ở [docs/IDEA-REGISTRY.md](../IDEA-REGISTRY.md).

## Cấu trúc một dự án một thư mục

Mỗi ý tưởng/dự án có một thư mục con riêng, đặt tên theo ID và slug:

```text
docs/ideas/
├── README.md
└── IDEA-NNN-SLUG/
    ├── README.md
    ├── RESEARCH.md          # thêm khi có research riêng
    ├── ARCHITECTURE.md      # thêm khi thiết kế cần tách nhỏ
    └── evidence/            # thêm khi có evidence, tách theo network
```

Quy tắc:

- `README.md` trong thư mục dự án là specification và entrypoint chuẩn.
- Research, architecture, threat model hoặc evidence của dự án phải nằm trong
  chính thư mục đó; không tạo file dự án rải rác trực tiếp dưới `docs/ideas/`.
- Chỉ tạo file/thư mục phụ khi có nội dung thật; không tạo cây placeholder.
- Contract, direct tests và frontend vẫn tuân theo layout chung của workspace:
  `contracts/`, `tests/direct/` và `frontend/`. Khi có nhiều implementation,
  dùng cùng project ID trong tên file/module để giữ truy vết.
- Evidence phải tách rõ `localnet`, `studionet`, `asimov` và `bradbury`; không
  trộn transaction hoặc address giữa các network.

## Admission gates

Một ý tưởng chỉ được chọn nếu trả lời `PASS` cho tất cả cổng bắt buộc:

| Gate | Câu hỏi bắt buộc |
|---|---|
| Replacement | Nếu thay GenLayer bằng database có chữ ký hoặc backend LLM, trust property nào mất đi? |
| Judgment | Có một quyết định nondeterministic mà deterministic contract không tự đánh giá được không? |
| Evidence | Validator có thể độc lập truy cập bằng chứng công khai/authoritative không? |
| Equivalence | Các field consensus-critical có cấu trúc và nguyên tắc tương đương rõ không? |
| Consequence | Verdict có trực tiếp đổi tiền, quyền, trạng thái hoặc enforcement không? |
| Adversarial | Có ít nhất hai bên có động cơ làm lệch kết quả không? |
| State model | Có entity isolation, access control, append-only history và chống overwrite/double settlement không? |
| Reuse | Builder khác có thể tích hợp primitive mà không fork logic lõi không? |
| Differentiation | Khác về cấu trúc với registry hiện tại, không chỉ khác tên/domain/prompt không? |
| Claim-to-code | Mọi claim sản phẩm quan trọng đều có contract method, state, test và UI/read path dự kiến không? |
| Full lifecycle | DApp dự kiến ký giao dịch thật, theo dõi accepted/finalized và đọc state onchain không? |
| Scope honesty | Giới hạn, nguồn không kiểm được và bằng chứng chưa có được nêu thẳng không? |

Chỉ cần một gate bắt buộc thất bại thì ý tưởng vẫn ở `CANDIDATE` hoặc chuyển
`REJECTED`; không “bù” bằng frontend đẹp hoặc prompt dài.

## Fingerprint bắt buộc

Mỗi spec phải có đúng bảy phần fingerprint:

```text
Trust problem:
Actors/adversary:
Evidence class:
Consensus question:
State machine:
Direct consequence:
Reuse surface:
```

### Luật so sánh

- Giống từ bốn chiều trở lên: mặc định trùng.
- Thay football bằng insurance, DAO bằng marketplace, hoặc API bằng website
  không làm thành ý tưởng mới nếu decision/state/consequence giữ nguyên.
- Thêm reputation, appeal hoặc dashboard vào một generic oracle không tự tạo
  ra primitive mới.
- Multi-contract chỉ có giá trị khi các contract có trách nhiệm độc lập; tách
  cùng một CRUD flow thành nhiều file không phải chiều sâu.
- Một “AI score” không đủ. Phải nói score/verdict làm state nào chuyển và ai
  chịu hậu quả.

## Mẫu specification

Mỗi file `IDEA-NNN-SLUG/README.md` cần có:

1. Tóm tắt một câu và demo hook.
2. Fingerprint bảy chiều.
3. Trust/adversary model.
4. Scope và non-goals.
5. Entity, key, isolation và state machine.
6. Bằng chứng, nguồn authoritative và failure policy.
7. Exact consensus question.
8. Structured verdict và equivalence principle.
9. Settlement/enforcement.
10. Public interface để builder tái sử dụng.
11. Access control và invariants.
12. Abuse/security analysis.
13. Direct-mode và lifecycle test plan.
14. Claim-to-code matrix.
15. Analogue/differentiation matrix.
16. Adoption path.
17. Kill criteria.
18. Evidence status: local, Studionet hoặc testnet phải tách biệt.

## Điều kiện trước khi code

Không bắt đầu contract chỉ vì ý tưởng “nghe hay”. Trước khi chuyển `BUILDING`,
spec phải khóa được:

- nguồn nào validator được phép fetch;
- hành vi khi nguồn mâu thuẫn, biến mất hoặc bị prompt injection;
- những field nào cần exact match và field nào được phép khác;
- hậu quả chỉ chạy khi accepted hay finalized;
- cách chống cùng một case bị settlement hai lần;
- cách frontend đọc state thật và hiển thị transaction lifecycle;
- ít nhất một consumer integration cụ thể ngoài demo quản trị.

## Điều kiện trước khi nộp

Một ý tưởng/spec không phải contribution. Chỉ xem là sẵn sàng nộp khi:

- contract hoàn chỉnh, lint sạch và direct tests bao phủ adversarial paths;
- state thực sự per-entity, không có global “last result”;
- nondeterministic evaluation nằm trong Intelligent Contract;
- frontend gọi write thật, theo dõi transaction, rồi đọc state thật;
- settlement/enforcement chạy từ verdict onchain;
- source và documentation khớp claim;
- có evidence riêng cho từng network được dùng;
- README giải thích bằng ngôn ngữ cụ thể: làm gì, giải quyết trust problem nào,
  dùng ra sao;
- có đường tích hợp/reuse rõ ràng cho builder khác.
