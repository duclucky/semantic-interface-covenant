# Quy Trình Build & Nộp Intelligent Contract (End-to-End)

Mục tiêu: nộp mục **Intelligent Contracts** (track Builder, 0–300 điểm) trên Portal.

## Bước 0 — Chuẩn bị tài khoản
1. Lập profile trên Portal `https://portal.genlayer.foundation/`, connect ví + GitHub/Discord/Twitter.
2. Star repo GitHub GenLayer (điểm khởi đầu nhanh).
3. Lấy testnet token từ faucet (chú ý: faucet studionet và Bradbury KHÔNG dùng lẫn — R24).

## Bước 1 — Chọn ý tưởng primitive
Đọc [04-Y-TUONG-PRIMITIVE.md](04-Y-TUONG-PRIMITIVE.md). Tiêu chí chọn:
- Là **primitive tái dùng** (input tham số hóa), KHÔNG phải app một-lần.
- Non-determinism là **cốt lõi** — bỏ LLM/web đi thì vô nghĩa.
- Có chỗ cho **custom validator kiểm Ý NGHĨA** kết quả (không kiểm format).
- Tránh tuyệt đối: hello-world, simple storage, thin LLM wrapper, fork ví dụ mẫu, "AI decides X" chung chung.

## Bước 2 — Thiết kế trước khi code
Viết ra giấy (rồi cho vào README):
1. **Public API**: method nào view, method nào write, tham số gì.
2. **State design**: struct `@allow_storage @dataclass`, `bigint` cho số, `TreeMap[str, ...]`, vòng đời state (tạo → xử lý → finalize).
3. **Consensus design**: leader_fn làm gì, validator_fn so sánh CÁI GÌ (verdict + band confidence, không so prose).
4. **Edge cases**: URL chết, JSON hỏng, double-processing, input rỗng → nhánh xử lý + `gl.vm.UserError`.

## Bước 3 — Viết contract
- Bắt đầu từ `templates/contract_template.py`.
- Tuân thủ TOÀN BỘ rule trong skill `.claude/skills/genlayer-contract/SKILL.md` (7 rule cốt lõi + R13–R26).
- Đặc biệt: **file thuần ASCII** (R25 — không em-dash, không tiếng Việt có dấu trong .py), `from genlayer import *` ở dòng 3 (R26).

## Bước 4 — Viết tests (gltest)
- `pip install genlayer-test`
- Mock LLM/web TRƯỚC khi chạy tx non-deterministic (R17):
```python
client.provider.make_request(method="sim_installMocks", params={
    "llm_mocks": {".*": json.dumps({"verdict": "PASS", "confidence": 85, "reason": "..."})},
    "web_mocks": {".*": {"status": 200, "body": "Mock page content"}},
})
```
- `params` là dict trần, KHÔNG bọc list.
- Write: `contract.connect(acct).method(args=[...]).transact()`. Read: `contract.method(args=[...]).call()` (R16).
- Cover: happy path + ít nhất vài edge-case.

## Bước 5 — Deploy lên Studio
0. **Quét ASCII trước** (nguyên nhân số 1 của `Could not load contract schema`):
```bash
python3 -c 'import sys
for i,l in enumerate(open(sys.argv[1],encoding="utf-8"),1):
    bad=[c for c in l if ord(c)>127]
    if bad: print(f"Line {i}: {bad!r}  {l.strip()}")' contracts/your_contract.py
```
1. Mở `https://studio.genlayer.com/run-debug`.
2. Settings → Reset Storage → Confirm → hard refresh (Ctrl+Shift+R).
3. Deploy contract sanity tối thiểu trước (storage test) → xác nhận môi trường ổn.
4. Deploy contract chính.
5. Click transaction trong sidebar → xác nhận **`Result: SUCCESS`** (không chỉ `Status: FINALIZED`).
6. Nếu ERROR → tra bảng "Triệu chứng → nguyên nhân" trong SKILL.md.
7. (Khuyến khích) deploy thêm lên **Bradbury testnet**, ghi lại contract address — reviewer muốn thấy hoạt động trên explorer (theo 2.md: "contract address để xem activity là essential").

## Bước 6 — Chuẩn bị repo GitHub
Cấu trúc gợi ý:
```
my-primitive/
├── README.md          # muc dich, API, CACH CONSENSUS DUOC DUNG, vi du dung, cach chay test
├── contracts/
│   └── my_primitive.py
├── tests/
│   └── test_my_primitive.py
├── examples/          # (tuy chon) script GenLayerPY goi contract
└── .gitignore
```
README PHẢI có mục **"How consensus is used"** — giải thích validator kiểm ý nghĩa thế nào. Đây là thứ reviewer tìm đầu tiên.

**Commit history thật** — nhiều commit theo tiến trình, không 1 commit dump toàn bộ (reviewer chấm Engineering nhìn lịch sử — 1.md: "One file, one commit. No real structure" = 1 điểm).

## Bước 7 — Nộp qua Portal
Form **Submit Contribution**:
- **Track:** Builder
- **Contribution Type:** Intelligent Contracts
- **Contribution Date:** ngày nộp
- **Title:** tên primitive + cụm mô tả. VD: `WebComplianceOracle — consensus-graded web compliance primitive`
- **Notes (≤1000 ký tự):** nêu (1) primitive làm gì, (2) cách consensus/validator được dùng — NHẤN MẠNH kiểm ý nghĩa, (3) vì sao tái dùng được, (4) có tests/docs. Tránh giọng "AI decides X".
- **Evidence:** URL repo GitHub (+ contract address đã deploy nếu có).
- Tick reCAPTCHA → Submit.

Trạng thái: Pending Review → Accepted / Rejected / **More Information Needed** (có thể bổ sung và sửa submission).

## Bước 8 — Trước khi bấm Submit
Chạy toàn bộ [03-CHECKLIST-TRUOC-KHI-NOP.md](03-CHECKLIST-TRUOC-KHI-NOP.md). Thiếu 1 mục = cân nhắc hoãn nộp.
