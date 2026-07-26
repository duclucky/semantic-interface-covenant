# Ý Tưởng Primitive Cho Mục Intelligent Contracts

Điểm chung bắt buộc: **input tham số hóa** (tái dùng) + **lõi là phán quyết chủ quan/web** + **validator kiểm nghĩa**.

## Từ guide gốc (D5)

### 1. WebComplianceOracle
- Input: `(url, criteria ngôn ngữ tự nhiên)` → verdict đồng thuận `PASS/PARTIAL/FAIL` + confidence + reason.
- Validator: chạy lại độc lập, đồng thuận trên verdict + confidence band.
- Tái dùng: nghiệm thu bounty, duyệt claim, kiểm license, kiểm tuân thủ nội dung.
- Đã có mẫu tham chiếu đầy đủ trong guide (PHẦN F) — nếu chọn hướng này PHẢI biến tấu đáng kể (đổi bài toán, thêm chiều sâu state/appeal) để không thành "boilerplate fork" của chính guide.

### 2. SubjectiveVoteResolver
- Input: nhiều lập luận văn bản → LLM-jury phán "bên nào thuyết phục hơn".
- Validator đồng thuận trên kết luận (bên thắng), không trên văn giải thích.
- Tái dùng: tranh chấp escrow, chấm tranh biện, governance.

### 3. MultiSourceFactCheck
- Input: claim + >=2 URL nguồn → cross-check, verdict true/false + độ tin.
- Validator kiểm cùng kết luận. Tái dùng: oracle tin tức, chống fake news, điều kiện thanh toán.

### 4. QualitativeMilestoneVerifier
- Input: link PR/issue GitHub + mô tả cam kết định tính → phán milestone đạt/không.
- Tái dùng: giải ngân grant theo milestone, DAO payroll.

### 5. NuancedClauseInterpreter
- Input: điều khoản hợp đồng mơ hồ ("force majeure", "reasonable effort") + tình huống → phán áp dụng hay không.
- Tái dùng: hợp đồng thuê, bảo hiểm, SLA.

## Hướng phát triển thêm (nâng độ sâu để ăn điểm 4–5)

### 6. EscrowWithSubjectiveRelease (ghost contract + payable)
- Escrow GEN thật (`@gl.public.write.payable`, `emit_transfer`) + phán quyết chủ quan để giải ngân.
- GenLayer fit rất cao: "tiền thật + không ai được quyết một mình" = mức 4 theo thang 1.md.
- Độ khó cao hơn: vòng đời state (FUNDED → JUDGED → RELEASED/REFUNDED), chống double-release.

### 7. ReputationJury
- Primitive chấm điểm định tính một entity (repo, bài viết, hồ sơ) theo rubric tham số hóa, lưu lịch sử điểm theo thời gian.
- Validator đồng thuận trên band điểm (0-2 / 3-5...), không trên số chính xác.

### 8. DisputeEscalator (multi-contract — chiều sâu "5 điểm")
- Contract A phán sơ thẩm; nếu confidence thấp hoặc bị appeal, contract B (rubric chặt hơn, nhiều nguồn hơn) phúc thẩm.
- Đúng tinh thần "more than one contract working together" trong thang Contract quality 5.

## Cách chọn
1. Ưu tiên ý tưởng bạn giải thích được trong 2 câu: "primitive này phán X, validator đồng thuận trên Y".
2. Nếu mới bắt đầu: #3 hoặc #4 (phạm vi gọn, dễ test bằng mock).
3. Nếu muốn điểm cao: #6 hoặc #8 (tiền thật / multi-contract) — nhưng chỉ khi làm trọn vẹn edge cases.
