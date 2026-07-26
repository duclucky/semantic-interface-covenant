# Tiêu Chí Chấm Điểm — Góc Nhìn Reviewer

> Tổng hợp từ `1.md` (Projects & Milestones Criteria) + `2.md` (Updates sau vòng review đầu) + mô tả mục Intelligent Contracts. Hiểu reviewer nghĩ gì = biết build gì.

## 1. Ba kết cục của một submission
1. **Pass gate → chấm điểm**
2. **Reject** — kèm feedback rõ ràng
3. **Request more info** — khi thiếu code trong repo, thiếu contract address, không rõ cách chạy

## 2. Gate — bị reject ngay nếu
- Không có contract GenLayer thật, hoặc phần AI không chạy trên GenLayer.
- Dùng tên GenLayer nhưng không thật sự dùng contract.
- Code không chạy.
- Rỗng, copy project khác, hoặc example đổi tên với gần như không sửa gì.
- App giả vờ kết nối contract nhưng thực tế không kết nối.
- Mass-submit các bản build AI gần giống nhau, 1 commit, thường hỏng ("farming") → reject.

## 3. Bốn trục điểm 0–5 (mục Projects — nhưng phản ánh tư duy chấm chung)

### 3.1 GenLayer fit — "có thật sự CẦN GenLayer không?"
- 1: app thường làm được y hệt; AI chỉ để vui.
- 3: AI làm việc thật, GenLayer giúp ích, nhưng app thường vẫn sống được.
- 4: quyết định quan trọng có tiền/kết quả thật, không ai được quyết một mình.
- 5: **không có GenLayer thì không tồn tại**.

### 3.2 Contract quality — "validator kiểm CÁI THẬT hay chỉ kiểm CÁI VỎ?"
- 1: example copy, hoặc validator chỉ kiểm shape/format — **hai validator ra phán quyết khác nhau mà cùng pass = hỏng**.
- 3: contract thật, validator kiểm câu trả lời thật, phương pháp hợp bài toán.
- 5: check mạnh + nhiều contract phối hợp hoặc code nâng cao làm tốt.

### 3.3 Engineering — "công sức thật hay code copy?"
- 1: một file, một commit.
- 3: cấu trúc tốt, lịch sử commit thật, build được.
- 5: sạch, dễ chạy, docs tốt. (Tests là điểm cộng, không bắt buộc.)

### 3.4 Frontend/UX — chỉ áp dụng cho Projects
- 0 là OK cho project chỉ có contract. **Mục Intelligent Contracts KHÔNG cần frontend.**

## 4. Nguyên tắc reviewer (từ 2.md — rất quan trọng)
- **Contract code PHẢI nằm trong repo.** Link Studio/deployment đơn thuần không đủ. Cần thêm contract address trên explorer để thấy activity.
- **"Verify, do not trust"** — reviewer sẽ tự mở app/contract, dùng thử, đối chiếu explorer xem contract deploy có ĐÚNG là contract trong repo không.
- **UI đẹp không cứu được project yếu.** "The GenLayer work matters more than how it looks."
- **Điểm cao hơn khi:** GenLayer là thiết yếu, use case nguyên bản, logic contract có ý nghĩa + tích hợp tốt, có usage/traction thật.
- Đa số project chỉ được 1–2 điểm. 4–5 hiếm như unicorn.

## 5. Mục Intelligent Contracts (0–300) — ĐƯỢC NHẬN vs BỊ LOẠI

### Được nhận
- Standalone contract (không frontend), useful / reusable / educational cho builder khác.
- Real GenLayer consensus logic (equivalence principle / custom validator thật).
- Clear state design; validator/equivalence check **kiểm ý nghĩa**.
- Use case có nghĩa vượt ngoài demo một-lần.
- Source đọc được + giải thích mục đích + cách consensus được dùng + docs/tests.

### Bị loại
- Hello-world, simple storage, basic examples.
- Thin LLM wrapper (bọc mỏng một lời gọi LLM).
- Format-only validator (chỉ kiểm schema/JSON keys).
- Boilerplate fork (Wizard of Coin đổi tên...).
- "AI decides X" chung chung không có primitive tái dùng.
- App có frontend (→ nộp Projects), update project cũ (→ Milestones).

## 6. Suy ra chiến lược build
1. Chọn bài toán mà **phán quyết chủ quan + dữ liệu web là cốt lõi** → GenLayer fit cao.
2. **Custom validator so sánh verdict + confidence band** — không bao giờ chỉ kiểm JSON keys → Contract quality cao.
3. Repo cấu trúc rõ, commit theo tiến trình, README có mục "How consensus is used", tests với mock → Engineering cao.
4. Deploy thật, ghi contract address, để reviewer verify được → qua gate "verify, do not trust".
