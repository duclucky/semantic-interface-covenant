# Checklist Trước Khi Nộp Intelligent Contract

Trả lời "CÓ" cho TẤT CẢ trước khi bấm Submit. Thiếu mục nào → quay lại sửa.

## A. Bản chất primitive
- [ ] Contract **đứng một mình** được, không cần UI để có giá trị.
- [ ] Non-determinism là **cốt lõi**: bỏ phần LLM/web đi thì primitive vô nghĩa.
- [ ] Input **tham số hóa** (criteria/nguồn truyền vào), không hardcode một tình huống.
- [ ] KHÔNG phải: hello-world / simple storage / thin LLM wrapper / fork example / "AI decides X" chung chung.

## B. Consensus & validator
- [ ] Có **custom validator** (`gl.vm.run_nondet_unsafe`) hoặc `prompt_comparative`/`prompt_non_comparative` dùng đúng chỗ.
- [ ] Validator kiểm **Ý NGHĨA** kết quả (verdict, kết luận, band confidence) — KHÔNG kiểm format/schema.
- [ ] Chỉ phần quyết định vào phép so sánh; prose tự do bị loại khỏi so sánh (tránh consensus fail giả).
- [ ] Hai validator ra phán quyết khác nhau thì KHÔNG THỂ cùng pass.

## C. State design
- [ ] Struct dùng `@allow_storage @dataclass`.
- [ ] Số persisted dùng `bigint` (KHÔNG `int`/`u256` cho storage).
- [ ] `TreeMap` key luôn `str`.
- [ ] KHÔNG reassign `TreeMap()`/`DynArray()` trong `__init__`.
- [ ] Vòng đời state tường minh (tạo → xử lý → finalize).

## D. Edge cases
- [ ] URL chết / web fail → có nhánh xử lý.
- [ ] JSON hỏng từ LLM → strip/parse phòng thủ.
- [ ] Double-processing → chặn.
- [ ] Input rỗng/0 → `gl.vm.UserError` với message rõ.

## E. Kỹ thuật deploy (xem SKILL.md đầy đủ)
- [ ] Dòng 1: `# v0.2.16`; dòng 2: `# { "Depends": "py-genlayer:..." }`; dòng 3: `from genlayer import *`.
- [ ] File `.py` **thuần ASCII** — đã chạy script quét, không in ra gì.
- [ ] Class tên `Contract`, kế thừa `gl.Contract`, một class/module.
- [ ] Mọi `gl.nondet.*` nằm trong inner fn, không truy cập `self` bên trong.
- [ ] Không `float`/`list`/`dict` trong chữ ký public method.
- [ ] Deploy Studio: **`Result: SUCCESS`** (đã click vào transaction xem, không chỉ FINALIZED).
- [ ] (Khuyến khích) đã deploy Bradbury, có contract address.

## F. Repo & docs
- [ ] Contract code **nằm trong repo** (không chỉ link Studio).
- [ ] README: mục đích, public API, **"How consensus is used"**, ví dụ dùng, cách chạy test.
- [ ] Tests gltest: mock LLM/web, happy path + vài edge-case, chạy pass.
- [ ] Commit history thật (nhiều commit theo tiến trình, không 1 commit dump).
- [ ] Source đọc được: tách hàm, tên rõ, comment (ASCII) ở chỗ nondet phức tạp.

## G. Form nộp
- [ ] Track: Builder / Type: Intelligent Contracts.
- [ ] Title: tên primitive + cụm mô tả.
- [ ] Notes ≤1000 ký tự: (1) làm gì, (2) consensus dùng thế nào — kiểm ý nghĩa, (3) vì sao tái dùng, (4) tests/docs.
- [ ] Evidence: URL repo + contract address (nếu có).
