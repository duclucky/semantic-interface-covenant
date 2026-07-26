# Tổng Quan GenLayer (Nghiên cứu tổng hợp — 07/2026)

> Tổng hợp từ: `genlayer-intelligent-contracts-guide.md` (context đầy đủ), `1.md` + `2.md` (tiêu chí chấm của reviewer), và docs chính thức (docs.genlayer.com — đã kiểm chứng API 07/2026).

## 1. GenLayer là gì

- Blockchain **Layer-1** chạy trên hạ tầng ZKsync Elastic Network.
- Định vị: **"lớp phân xử (adjudication layer) cho nền kinh tế agentic"** — tòa án phi tập trung trên chuỗi.
- Tiến hóa: Bitcoin (tiền trustless) → Ethereum (tính toán trustless) → **GenLayer (phân xử/ra quyết định trustless)**.
- Khác biệt cốt lõi: **AI nằm ngay tại tầng đồng thuận**. Mỗi validator chạy một LLM; mạng validator là **bồi thẩm đoàn AI phi tập trung**.

## 2. Ba năng lực smart contract thường KHÔNG có

1. **Quyết định chủ quan** — phán đoán ngữ cảnh, sắc thái, "phán quyết kiểu con người" thành kết quả on-chain.
2. **Dữ liệu phi cấu trúc** — văn bản, bằng chứng định tính.
3. **Truy cập Internet trực tiếp** — đọc web on-chain, **không cần oracle**.

## 3. Khái niệm cốt lõi

### Intelligent Contract
- Viết bằng **Python**, class kế thừa `gl.Contract`.
- Chạy được tác vụ **non-deterministic** (gọi LLM, đọc web).
- Nhất quán nhờ **đồng thuận AI**, không phải nhờ kết quả giống hệt.

### Optimistic Democracy
- 1 validator làm **leader** đề xuất kết quả; validator khác **validate** lại bằng LLM riêng, bỏ phiếu đa số.
- Có **appeal** nhiều vòng, finality window, staking, slashing.
- Thưởng/phạt theo phe đa số/thiểu số → validator phải thật sự kiểm tra.

### Equivalence Principle — trục kiến thức quan trọng nhất
Lập trình viên **chọn** cách validator so kết quả:

| API | Khi nào dùng |
|---|---|
| `gl.eq_principle.strict_eq(fn)` | Kết quả xác định (bool, số chuẩn hóa, JSON normalize) — phải giống hệt |
| `gl.eq_principle.prompt_comparative(fn, principle)` | Văn bản "cùng nghĩa khác chữ" vẫn pass (tóm tắt...) |
| `gl.eq_principle.prompt_non_comparative(fn, task=, criteria=)` | Validator KHÔNG chạy lại task, chỉ chấm output leader theo criteria — nhanh, rẻ |
| `gl.vm.run_nondet_unsafe(leader_fn, validator_fn)` | **Custom validator** — tự định nghĩa "tương đương". Mạnh nhất, chỗ ăn điểm |

> **API cũ vs mới:** dùng `gl.nondet.exec_prompt`, `gl.nondet.web.render` / `gl.nondet.web.get`, `gl.eq_principle.strict_eq`. KHÔNG dùng API cũ `gl.exec_prompt`, `gl.get_webpage`.

### Non-deterministic block — 2 giới hạn
- Mọi `gl.nondet.*` phải nằm trong **inner function**, gọi qua `gl.eq_principle.*` hoặc `gl.vm.run_nondet*`.
- **Không truy cập `self`/storage** trong block → capture ra biến local trước.
- State interpreter không mang ngược về code deterministic. Biến ngoài được capture tự động (closure).

### GenVM & Ghost contract
- GenVM: máy ảo Python runtime; mỗi module chỉ **một** class kế thừa `gl.Contract`.
- Ghost contract: bản EVM cùng địa chỉ giữ balance GEN; nhận/gửi GEN qua `@gl.public.write.payable`, `gl.message.value`, `emit_transfer()`.

## 4. Bộ công cụ

| Công cụ | Vai trò |
|---|---|
| **GenLayer Studio** | IDE trình duyệt — viết/test/deploy. https://studio.genlayer.com/contracts |
| **GenLayer CLI** | Deploy/quản lý từ dòng lệnh |
| **GenLayerJS / GenLayerPY** | SDK frontend/backend |
| **gltest** | Test framework, mock LLM/web (`pip install genlayer-test`) |
| **Skills plugin** | https://skills.genlayer.com/ (skill `genlayer-dev` cho Claude Code) |

- **Studionet**: chain id **61999**, RPC `https://studio.genlayer.com/api` — môi trường mô phỏng.
- **Testnet Bradbury**: mạng thật với LLM inference thật; có thể reset định kỳ. Nên deploy cả hai và so sánh.

## 5. Chương trình Builder / Points Program

- Portal: `https://portal.genlayer.foundation/` — leaderboard công khai, points + badges, hướng tới Deepthought DAO.
- 3 track: **Builders** (track của ta), Validators, Community.
- Mục **Intelligent Contracts**: Contribution Type trong track Builder, thang **0–300 điểm**, nhận **standalone contract-primitive** (không frontend).
- App đầy đủ có frontend → mục **Projects**; update lớn cho project đã duyệt → **Milestones**.

## 6. Link chính thức

| Mục | URL |
|---|---|
| Docs | https://docs.genlayer.com/ |
| Full docs 1 file (cho AI) | https://docs.genlayer.com/full-documentation.txt |
| First Intelligent Contract | https://docs.genlayer.com/developers/intelligent-contracts/first-intelligent-contract |
| SDK API | https://sdk.genlayer.com/main/api/genlayer.html |
| Studio | https://studio.genlayer.com/contracts |
| Portal | https://portal.genlayer.foundation/#/builders/contributions |
| Discord | https://discord.gg/8Jm4v89VAu |

## 7. File liên quan trong repo này

- [01-QUY-TRINH-BUILD-VA-NOP.md](01-QUY-TRINH-BUILD-VA-NOP.md) — quy trình end-to-end
- [02-TIEU-CHI-CHAM-DIEM.md](02-TIEU-CHI-CHAM-DIEM.md) — góc nhìn reviewer (tổng hợp 1.md + 2.md)
- [03-CHECKLIST-TRUOC-KHI-NOP.md](03-CHECKLIST-TRUOC-KHI-NOP.md) — checklist bắt buộc
- [04-Y-TUONG-PRIMITIVE.md](04-Y-TUONG-PRIMITIVE.md) — ý tưởng contract
- `templates/contract_template.py` — khung xương chuẩn (ASCII-clean)
- `.claude/skills/genlayer-contract/SKILL.md` — skill cho Claude Code
