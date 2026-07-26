# GenLayer Builder Program & Intelligent Contracts — Tài Liệu Context Đầy Đủ Cho AI

> **Cách dùng file này:** Đây là tài liệu mồi ngữ cảnh (context-priming) tự chứa. Một AI assistant đọc xong file này phải hiểu: (1) GenLayer là gì, (2) Intelligent Contract hoạt động và được viết ra sao, (3) chương trình Builder/Contributor vận hành thế nào, (4) **mục đóng góp "Intelligent Contracts" trên portal chấm cái gì và cách build một contract đạt điểm cao để nộp**, (5) mọi cạm bẫy kỹ thuật khi deploy. Mọi thông tin tính đến giữa 2026; GenLayer đang ở testnet Bradbury — điểm số, thời hạn, token có thể thay đổi, luôn kiểm chứng tại nguồn chính thức.
>
> **Lệnh mặc định khi import file này:** "Giúp tôi build một Intelligent Contract để nộp cho mục Intelligent Contracts trên GenLayer portal." Nếu người dùng không nói gì khác, giả định đây là mục tiêu.

---

# PHẦN A — NỀN TẢNG GENLAYER

## A1. GenLayer là gì

GenLayer là một blockchain **Layer-1** (chạy trên hạ tầng ZKsync Elastic Network) tự định vị là **"lớp phân xử (adjudication layer) cho nền kinh tế agentic"** — một **"synthetic jurisdiction"** (khu vực tài phán tổng hợp), một tòa án phi tập trung trên chuỗi.

Định vị lịch sử:
- **Bitcoin** → tiền tệ không cần tin cậy (trustless money)
- **Ethereum** → tính toán không cần tin cậy (trustless computation)
- **GenLayer** → **phân xử / ra quyết định không cần tin cậy (trustless adjudication / decision-making)**

Khác biệt cốt lõi: GenLayer tích hợp **AI ngay tại tầng đồng thuận (consensus layer)**. Mỗi validator node chạy một LLM đa dạng, và mạng lưới validator hoạt động như một **bồi thẩm đoàn AI phi tập trung** — bỏ phiếu, tranh luận, hội tụ về một kết quả chung cho cả những quyết định **chủ quan (subjective)**.

Ba năng lực smart contract truyền thống KHÔNG làm được nhưng GenLayer làm được:
1. **Quyết định chủ quan:** đánh giá ngữ cảnh, sắc thái, phán đoán — biến "phán quyết kiểu con người" thành kết quả thực thi trên chuỗi.
2. **Dữ liệu phi cấu trúc:** xử lý văn bản, hình ảnh, bằng chứng định tính.
3. **Truy cập Internet trực tiếp:** lấy dữ liệu web trực tiếp trên chuỗi, **không cần oracle, không cần trung gian**.

## A2. Các khái niệm cốt lõi

### Intelligent Contract
Tên GenLayer đặt cho smart contract của họ:
- **Viết bằng Python** (không phải Solidity), là class kế thừa `gl.Contract`.
- Thực thi được tác vụ **non-deterministic** — gọi LLM, đọc web — những thứ blockchain thường cấm.
- Tính nhất quán đảm bảo nhờ **cơ chế đồng thuận AI** thay vì nhờ kết quả luôn giống hệt.

### Optimistic Democracy (cơ chế đồng thuận)
Khi một giao dịch có phần non-deterministic:
- Một validator đóng vai **leader** đề xuất kết quả.
- Các validator khác **validate** lại bằng LLM của riêng mình, bỏ phiếu đồng ý/không theo đa số.
- Có cơ chế **appeal (kháng nghị)** nhiều vòng, **finality window**, **staking**, **slashing**.
- Thưởng/phạt dựa trên việc validator thuộc phe đa số hay thiểu số → tạo động lực validator thật sự kiểm tra chứ không "ăn theo" leader. (Bradbury thử nghiệm trả gas gấp 60–100 lần chi phí inference để việc ăn theo không có lợi.)

### Equivalence Principle (Nguyên tắc tương đương) — TRỤC KIẾN THỨC QUAN TRỌNG NHẤT
Cơ chế để validator "đồng ý" dù LLM mỗi người trả kết quả hơi khác. Lập trình viên **chọn** mức so sánh:

- **`gl.eq_principle.strict_eq(fn)`** — validator chạy lại `fn`, đồng thuận CHỈ KHI kết quả **giống hệt**. Dùng cho giá trị xác định: `bool`, số đã chuẩn hóa, JSON đã normalize. Không tốn LLM để so sánh.
- **`gl.eq_principle.prompt_comparative(fn, principle)`** — cả leader và validator cùng chạy `fn`, rồi validator dùng **NLP** để kiểm hai kết quả có *tương đương theo `principle`* không. Dùng khi output là văn bản mà "cùng nghĩa, khác chữ" vẫn phải pass (vd tóm tắt). `principle` là một câu mô tả tiêu chí tương đương.
- **`gl.eq_principle.prompt_non_comparative(fn, *, task, criteria)`** — leader chạy `task` trên input; validator **KHÔNG chạy lại task**, chỉ kiểm output của leader có đạt `criteria` không. Nhanh & rẻ hơn, hợp cho output định tính (tóm tắt tin tức, đánh giá).
- **Custom validator** qua **`gl.vm.run_nondet_unsafe(leader_fn, validator_fn)`** (hoặc bản an toàn hơn `gl.vm.run_nondet`) — anh **tự viết** `validator_fn(leader_result) -> bool`, toàn quyền định nghĩa "tương đương". Đây là cách mạnh nhất và là chỗ ăn điểm cho contract nghiêm túc.

> **API cũ vs mới (rất hay nhầm):** tài liệu cũ dùng `gl.exec_prompt`, `gl.get_webpage`, `gl.eq_principle_strict_eq`. API **hiện tại** là `gl.nondet.exec_prompt`, `gl.nondet.web.render` / `gl.nondet.web.get`, `gl.eq_principle.strict_eq`. Luôn dùng API mới.

### Non-deterministic block — hai giới hạn phải nhớ
Mọi thao tác non-deterministic (`gl.nondet.*`) **phải** nằm trong một **hàm Python con (inner function)**, được gọi qua `gl.eq_principle.*` hoặc `gl.vm.run_nondet*`. Hai giới hạn:
- **Không truy cập `self` / storage** từ bên trong block → phải capture giá trị ra biến local trước.
- **Trạng thái interpreter không mang ngược về** code deterministic (đổi biến global sẽ không thấy).

Biến bên ngoài được **capture tự động** (closure), không cần truyền tham số vào inner fn.

### GenVM
Máy ảo Python runtime của GenLayer, nơi thực thi Intelligent Contract. Mỗi module chỉ được có **một** class kế thừa `gl.Contract`.

### Ghost contract
Mỗi Intelligent Contract có một **ghost contract** tương ứng trên GenLayer Chain (tầng EVM) cùng địa chỉ — giữ balance GEN, chuyển tiếp giao dịch tới consensus, thực thi external messages. Để nhận/gửi GEN: `@gl.public.write.payable`, `gl.message.value`, và `emit_transfer()`.

### Greyboxing (đặc trưng testnet Bradbury)
Khả năng validator áp dụng biến đổi tùy ý **trước mỗi lần gọi LLM** (bắt, phân tích, sửa, lọc input trước inference) để tối ưu hiệu năng/chi phí/bảo mật. Liên kết với "Constitution" — khung quản trị tương lai.

## A3. Bộ công cụ phát triển

| Công cụ | Vai trò | Link |
|---|---|---|
| **GenLayer Studio** | IDE trình duyệt: viết/test/deploy Intelligent Contract, không cần cài đặt. Điểm khởi đầu chính. | https://studio.genlayer.com/contracts |
| **GenLayer CLI** | Deploy & quản lý contract từ dòng lệnh; account, network, staking, localnet. | docs.genlayer.com/api-references/genlayer-cli |
| **GenLayerJS** (genlayer-js) | Thư viện JS/TS để frontend đọc-ghi Intelligent Contract, query transaction. | docs.genlayer.com/api-references/genlayer-js |
| **GenLayerPY** | SDK Python tương đương. | docs.genlayer.com/api-references/genlayer-py |
| **gltest** (genlayer-test) | Bộ test cho contract, hỗ trợ mock LLM/web. | pypi.org/project/genlayer-test |
| **Skills** | Plugin cho Claude Code: scaffold/deploy/vận hành contract; có `genlayer-dev` skill. | https://skills.genlayer.com/ |

**Studio vs Testnet:** Studio là môi trường mô phỏng để phát triển nhanh (chain id studionet = **61999**, rpc `https://studio.genlayer.com/api`). Testnet Bradbury là mạng phi tập trung thật với inference LLM thật. Builder được khuyến khích deploy cả hai và **so sánh kết quả thực thi**. Bradbury không chạy app production, lịch sử có thể reset định kỳ.

---

# PHẦN B — INTELLIGENT CONTRACT: VIẾT NHƯ THẾ NÀO

## B1. Khung xương một contract

```python
# v0.2.16
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *

import json
import typing
from dataclasses import dataclass


@allow_storage
@dataclass
class Record:                 # custom storage struct
    owner: str
    amount: bigint            # persisted int => bigint (KHÔNG u256/int)


class Contract(gl.Contract):  # PHẢI tên "Contract", kế thừa gl.Contract
    items: TreeMap[str, Record]   # storage: TreeMap key luôn str
    total: bigint

    def __init__(self):
        self.total = bigint(0)    # KHÔNG động vào TreeMap ở đây

    @gl.public.view               # đọc, không tốn gas
    def get_total(self) -> int:
        return int(self.total)

    @gl.public.write              # ghi, tốn gas, đổi state
    def do_thing(self, key: str) -> None:
        ...
```

## B2. Pattern non-deterministic chuẩn (web + LLM + consensus)

Đây là "trái tim". Ba biến thể theo mức equivalence:

**(a) strict_eq — khi output là bool/giá trị chuẩn hóa:**
```python
@gl.public.write
def verify(self, url: str) -> None:
    def check() -> bool:
        page = gl.nondet.web.render(url, mode="text")
        return "target-string" in page
    self.flag = gl.eq_principle.strict_eq(check)
```

**(b) Custom validator — kiểm Ý NGHĨA phán quyết (mạnh nhất, ăn điểm):**
```python
@gl.public.write
def adjudicate(self, url: str, criteria: str) -> None:
    def leader_fn():
        page = gl.nondet.web.render(url, mode="text")[:6000]
        prompt = f"""You are an impartial adjudicator.
CRITERIA: {criteria}
PAGE: {page}
Respond ONLY as JSON: {{"verdict":"PASS"|"FAIL","confidence":<0-100>,"reason":"..."}}"""
        res = gl.nondet.exec_prompt(prompt, response_format="json")
        # normalize thành payload consensus-friendly (bỏ chữ tự do, giữ quyết định)
        verdict = "PASS" if str(res.get("verdict","")).upper().startswith("P") else "FAIL"
        conf = max(0, min(100, int(res.get("confidence", 0))))
        return json.dumps({"verdict": verdict, "confidence": conf,
                           "reason": str(res.get("reason",""))[:400]}, sort_keys=True)

    def validator_fn(leader_res: typing.Any) -> bool:
        if not isinstance(leader_res, gl.vm.Return):
            return False
        leader = json.loads(leader_res.calldata)     # payload của leader
        mine = json.loads(leader_fn())               # validator tự chạy lại
        if leader["verdict"] != mine["verdict"]:
            return False                             # khác KẾT LUẬN => không đồng thuận
        band = lambda c: 0 if c < 35 else (1 if c < 80 else 2)
        return band(leader["confidence"]) == band(mine["confidence"])

    raw = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)
    payload = json.loads(raw)
    # ... cập nhật state deterministic từ payload ...
```

**(c) prompt_comparative / prompt_non_comparative — khi output là văn bản định tính:**
```python
summary = gl.eq_principle.prompt_comparative(
    fetch_and_summarize,
    principle="Two summaries are equivalent if they state the same key facts, "
              "even if worded differently."
)
```

## B3. Prompt phải chặt
- Nêu rõ vai trò + tiêu chí + **định dạng output**. Yêu cầu **CHỈ JSON**, không markdown fence.
- LLM đôi khi bọc ```json — luôn strip: `res.replace("```json","").replace("```","").strip()` khi dùng `response_format="text"`; với `response_format="json"` GenLayer trả dict sẵn.
- Với custom validator: **chỉ đưa phần quyết định (verdict) vào cái được so sánh**, bỏ prose tự do ra khỏi phép so sánh → tránh consensus fail giả.

---

# PHẦN C — CHƯƠNG TRÌNH BUILDER / CONTRIBUTOR

## C1. Tổng quan
GenLayer Foundation vận hành một **Points Program** khuyến khích đóng góp giai đoạn testnet.
- **Cổng chính:** Portal `https://portal.genlayer.foundation/` (và `points.genlayer.foundation`).
- Bản chất: theo dõi đóng góp minh bạch, **leaderboard công khai**, mỗi hành động cho **points + badges**. Hướng tới **Deepthought DAO**.
- Mã nguồn hệ thống điểm: `github.com/genlayer-foundation/points` (Django; model User / ContributionType / Contribution với points, evidence, notes).

## C2. Ba track
1. **Builders** — deploy contract, xây dApp, nộp dự án hackathon, **nộp Intelligent Contracts**. *(Track của bạn.)*
2. **Validators** — waitlist, vận hành AI node, quest validator.
3. **Community** — content, sự kiện, tool, tutorial.

## C3. Quy trình Builder tham gia & nộp bài (end-to-end)
1. **Lập profile trên Portal**, connect ví + GitHub/Discord/Twitter để đóng góp được ghi nhận và mở mission.
2. **Star repo GitHub của GenLayer** — điểm khởi đầu nhanh.
3. **Lấy testnet token** từ faucet (không cần tiền thật).
4. **Phát triển contract** bằng Python trong Studio/CLI. Ví dụ mẫu tham khảo: Storage, LLM Hello World, Wizard of Coin, Fetch Web Content, Fetch GitHub Profile, Prediction Market, Vector Store Log Indexer.
5. **Deploy & ghi nhận on-chain**, đối chiếu Studio vs Bradbury.
6. **(Tùy chọn)** xây dApp bằng GenLayerJS.
7. **Nộp qua Portal dashboard** (Submit Contribution) với evidence: link repo + demo; hoặc nộp hackathon (DoraHacks) với GitHub link + demo video.
8. **Nhận points + badge**, theo dõi leaderboard.

## C4. Submit Contribution — cách form hoạt động
Trong "Submit Contribution", chọn **track** (Builder/Validator/Community), rồi chọn **Contribution Type** từ dropdown. Điền **Contribution Date**, **Title** (optional), **Notes/Description**, và **Evidence** (URL link — dán URL tự động nhận diện loại). Có **reCAPTCHA** ("I'm not a robot") trước khi Submit.

Trạng thái submission: **Pending Review → Accepted / Rejected / More Information Needed**. Có thể sửa/xóa submission. Đọc "Evidence Guidelines" trên portal để tăng khả năng được duyệt.

---

# PHẦN D — MỤC "INTELLIGENT CONTRACTS" (TRỌNG TÂM KHI IMPORT FILE NÀY)

Đây là một **Contribution Type mới** trong track **Builder** trên portal, thang **0–300 điểm**.

## D1. Định nghĩa chính thức (nguyên văn tinh thần từ mô tả trên form)
> Nộp **standalone GenLayer Intelligent Contracts** đủ tốt để **useful, reusable, hoặc educational** cho builder khác. Họ tìm **contract primitive chất lượng cao và use case có ý nghĩa**: contract có **logic consensus GenLayer thật**, **state design rõ ràng**, **validator/equivalence check có suy nghĩ**, và use case **còn có ý nghĩa vượt ngoài demo một-lần**.

## D2. ĐƯỢC NHẬN (build theo đúng những thứ này)
- **Standalone contract** — đứng riêng, KHÔNG kèm frontend/app. (Nếu có app đầy đủ → nộp mục **Projects**. Nếu là update lớn cho project đã duyệt → mục **Milestones**.)
- **Real GenLayer consensus logic** — dùng thật equivalence principle / custom validator, không né tránh non-determinism.
- **Clear state design** — storage có cấu trúc, kiểu đúng, xử lý vòng đời state rõ ràng.
- **Thoughtful validators / equivalence checks** — validator kiểm **ý nghĩa** phán quyết, không chỉ kiểm định dạng.
- **Use case matter beyond a one-off demo** — một primitive builder khác cắm vào nhiều bài toán.
- **Readable source + giải thích mục đích + cách consensus được dùng + đủ documentation hoặc tests** để reviewer và builder khác hiểu primitive.

## D3. BỊ LOẠI (tuyệt đối tránh — đây là ranh giới rớt điểm)
- ❌ Basic examples, **hello-world**, **simple storage**.
- ❌ **Thin LLM wrapper** — chỉ bọc mỏng một lời gọi LLM rồi trả kết quả.
- ❌ **Format-only validator** — validator chỉ kiểm schema/JSON keys/định dạng, không kiểm nội dung. (Hai validator ra phán quyết khác nhau mà cùng pass = hỏng.)
- ❌ **Boilerplate fork** — fork ví dụ mẫu (vd Wizard of Coin) rồi đổi tên.
- ❌ Demo **"AI decides X" chung chung** — không có primitive tái dùng, không có chiều sâu consensus.
- ❌ App đầy đủ có frontend (→ Projects), hoặc update project cũ (→ Milestones).

## D4. CHECKLIST một Intelligent Contract đạt điểm cao (0–300)
Trước khi nộp, contract phải trả lời "có" cho tất cả:
- [ ] **Đứng một mình** được, không cần UI để có giá trị.
- [ ] Non-determinism là **cốt lõi**: bỏ phần LLM/web đi thì primitive vô nghĩa.
- [ ] Có **custom validator** (hoặc `prompt_comparative`/`prompt_non_comparative` dùng đúng chỗ) kiểm **ý nghĩa** kết quả — nêu rõ trong doc "consensus được dùng thế nào".
- [ ] **State design** rõ: struct `@allow_storage @dataclass`, `bigint` cho số, `TreeMap[str, …]`, vòng đời state tường minh.
- [ ] **Edge-case có nhánh xử lý + UserError**: web fail/URL chết, JSON hỏng, double-processing, giá trị rỗng/0.
- [ ] **Tổng quát hóa** thành primitive tái dùng (tham số hóa tiêu chí/nguồn, không hardcode một tình huống).
- [ ] **README/docstring**: mục đích, API công khai, cách consensus hoạt động, ví dụ dùng.
- [ ] **Tests** (gltest, mock LLM/web) cho happy path + ít nhất vài edge-case.
- [ ] **Deploy được** trên Studio (Result: SUCCESS), đối chiếu Bradbury nếu có thể.
- [ ] Source **đọc được**: tách hàm, đặt tên rõ, comment ở chỗ nondet phức tạp.

## D5. Ý tưởng primitive hợp mục này (đều là "primitive", không phải app)
- **WebComplianceOracle** — nhận `(url, criteria_ngôn_ngữ_tự_nhiên)` → trả phán quyết đồng thuận `PASS/FAIL/PARTIAL` + confidence + reason; validator kiểm ý nghĩa. Builder khác cắm vào: nghiệm thu bounty, duyệt claim, kiểm license, kiểm tuân thủ nội dung.
- **SubjectiveVoteResolver** — nhận nhiều lập luận văn bản → LLM-jury phán "bên nào thuyết phục hơn", validator đồng thuận trên kết luận.
- **MultiSourceFactCheck** — đọc ≥2 URL, cross-check, trả verdict true/false + độ tin, validator kiểm cùng kết luận.
- **QualitativeMilestoneVerifier** — đọc PR/issue GitHub, phán milestone có đạt cam kết định tính không.
- **NuancedClauseInterpreter** — nhận điều khoản hợp đồng mơ hồ ("force majeure", "hợp lý") + tình huống → phán áp dụng hay không.

Điểm chung: **input tham số hóa** (tái dùng), **lõi là phán quyết chủ quan/web**, **validator kiểm nghĩa**.

## D6. Cách điền form Submit Contribution cho mục này
- **Track:** Builder.
- **Contribution Type:** Intelligent Contracts.
- **Contribution Date:** ngày nộp.
- **Title:** tên primitive + một cụm mô tả (vd "WebComplianceOracle — consensus-graded web compliance primitive").
- **Notes/Description (≤1000 ký tự):** nêu (1) primitive làm gì, (2) **cách consensus/validator được dùng** (nhấn mạnh kiểm ý nghĩa, không phải format), (3) vì sao nó tái dùng được / vượt ngoài demo, (4) có tests/docs. Tránh nghe như "AI decides X".
- **Evidence:** URL repo GitHub (có README + source + tests + lịch sử commit thật). Có thể thêm URL contract đã deploy / demo.
- Tick reCAPTCHA → **Submit Contribution**.

---

# PHẦN E — CẠM BẪY DEPLOY (BẮT BUỘC TUÂN THỦ)

Đây là các lỗi thật đã gặp trên Studio và gltest/simulator. Vi phạm là hỏng deploy hoặc hỏng consensus.

## E1. Bảy rule cốt lõi
1. **Dòng đầu tiên PHẢI là `# v0.2.16`** (dòng 2 là comment `# { "Depends": "py-genlayer:..." }`). Thiếu → Studio rớt về v0.1.0, lỗi `Contract Queues not found` / `IdlenessPhase not found`.
2. **KHÔNG reassign `TreeMap()` / `DynArray()` trong `__init__`** — GenVM tự khởi tạo rỗng. Reassign → `AssertionError: TreeMap <- TreeMap`.
3. **KHÔNG `float` trong chữ ký method công khai** — dùng `int` (nhân 100 nếu cần cents).
4. **Kiểu public method hợp lệ CHỈ:** `str, bool, bytes, int`, sized ints (`u8`..`u256`, `i8`..`i256`), `Address`, `DynArray[T]`, `TreeMap[K,V]`. ❌ `float, list[T], dict[K,V]`, generic chưa instantiate, class tự chế.
5. **Storage dùng `TreeMap`/`DynArray`, KHÔNG `dict`/`list`.** Chỉ generic đã instantiate đầy đủ (`TreeMap[str,u256]` ✓, `TreeMap` trần ✗).
6. **Class PHẢI tên `Contract` và kế thừa `gl.Contract`.** Một module chỉ một Contract subclass.
7. **Mọi `gl.nondet.*` PHẢI nằm trong inner fn**, gọi qua `gl.eq_principle.*` hoặc `gl.vm.run_nondet_unsafe(leader_fn, validator_fn)`. Gọi trực tiếp trong thân method → crash.

## E2. Rule runtime/SDK (chỉ lộ khi chạy simulator/gltest)
- **R13 — Chỉ `from genlayer import *`.** KHÔNG `import genlayer as gl` / `import genlayer` (ghi đè `gl` sandbox → `module 'genlayer' has no attribute 'Contract'`).
- **R14 — Field số persisted PHẢI `bigint`, KHÔNG `u256`/`int`.** (`from genlayer.std import bigint` nếu cần; thường có sẵn qua `import *`.) `int` bị cấm cho storage; chỉ cast `u256`/`int` tạm trong bộ nhớ khi gọi API ngoài. `TypeError: use bigint or one of sized integers please` → sửa về `bigint`.
  > Xung đột với Rule #5: Rule #5 ghi `TreeMap[str, u256]` compile được ở vài build Studio nhưng FAIL metadata trên simulator. Khi mâu thuẫn, **ưu tiên `bigint` cho mọi thứ stored**.
- **R15 — `gl.eth.send_value` KHÔNG tồn tại.** Gửi GEN: `gl.get_contract_at(addr).emit_transfer(value=u256(amount))`.
- **R16 — gltest write dùng fluent API, không kwargs:** `contract.connect(acct).method(args=[...]).transact(value=X)`. Read: `contract.method(args=[...]).call()`.
- **R17 — Mock LLM/web TRƯỚC khi chạy tx non-deterministic trong test.** Không mock → `web.render`/`exec_prompt` fail consensus, lộ ra dưới dạng lỗi *state* khó hiểu. `sim_installMocks` với `params` là **dict trần**, KHÔNG bọc list (list bị chuẩn hóa thành 0 mock).
  ```python
  client.provider.make_request(method="sim_installMocks", params={
      "llm_mocks": {".*": json.dumps({"verdict":"PASS","confidence":85,"reason":"..."})},
      "web_mocks": {".*": {"status":200,"body":"Mock page content"}},
  })
  ```
  Validator lấy payload leader qua `leader_res.calldata` sau khi check `isinstance(leader_res, gl.vm.Return)`.
- **R18 — Custom storage struct PHẢI `@allow_storage @dataclass`** (import `from dataclasses import dataclass`), KHÔNG bbase `Record` tự chế → nếu sai: `Could not load contract schema`. Struct chứa `TreeMap`/`DynArray` bên trong cần `gl.storage.inmem_allocate(Type, *args)` khi tạo in-memory.
- **R19 — `TreeMap` key PHẢI `str`** (calldata chỉ hỗ trợ map key string như JSON). Key là int/Address → convert `str(id)` / hex ở biên. Key `bigint`/`Address` là nguyên nhân phổ biến của `Could not load contract schema`.
- **R20 — Convert `Address` sang `str` phòng thủ:**
  ```python
  def _addr_str(a: Address) -> str:
      try: return a.as_hex
      except Exception: return str(a)
  ```
- **R25 — File contract PHẢI thuần ASCII. KHÔNG ký tự non-ASCII ở BẤT KỲ đâu, kể cả comment.** Backend sinh schema của Studio/SDK encode mã nguồn bằng `.encode("ascii")` trước khi hex-hóa; gặp một ký tự non-ASCII là crash `UnicodeEncodeError` → biểu hiện ra ngoài đúng là **`Could not load contract schema`** (schema không load nổi, không phải lỗi runtime). Thủ phạm phổ biến nhất là **em-dash `—`** (U+2014) trong comment mô tả — rất hay lọt vào vì AI/editor tự thay `-` thành `—`. Các ký tự nguy hiểm khác: en-dash `–`, dấu ngoặc cong `" " ' '`, mũi tên `→ ← ⇒`, ký tự tiếng Việt có dấu (`ạ ế ộ …`), emoji, non-breaking space (U+00A0).
  > **Quy tắc cứng:** viết comment trong file `.py` contract **chỉ bằng ASCII** — dùng `-` thay `—`, `->` thay `→`, ngoặc thẳng `"` `'`. Muốn ghi chú tiếng Việt thì để ở README, KHÔNG để trong file contract.
  > **Cách quét trước khi deploy:**
  > ```bash
  > python3 -c 'import sys
  > for i,l in enumerate(open(sys.argv[1],encoding="utf-8"),1):
  >     bad=[c for c in l if ord(c)>127]
  >     if bad: print(f"Line {i}: {bad!r}  {l.strip()}")' contracts/your_contract.py
  > ```
  > Không in ra gì = sạch. Có in ra = sửa hết những dòng đó về ASCII rồi deploy lại.
- **R26 — `from genlayer import *` NÊN đứng ngay dòng 3** (ngay dưới `# v0.2.16` ở dòng 1 và `# { "Depends": ... }` ở dòng 2), KHÔNG chèn khối comment mô tả dài giữa phần pin version và lệnh import. Một số build GenVM parse phần header kỳ vọng import SDK ở đầu; đẩy nó xuống sau nhiều dòng comment có thể góp phần gây lỗi load schema. Docstring/comment mô tả dài để **sau** dòng import, hoặc chuyển sang README.
  > Layout đầu file chuẩn:
  > ```python
  > # v0.2.16
  > # { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
  > from genlayer import *
  >
  > import json
  > import typing
  > from dataclasses import dataclass
  > # (mo ta contract o day, sau import — va chi bang ASCII)
  > ```

## E3. Frontend/dApp (chỉ áp dụng nếu làm mục Projects — mục Intelligent Contracts KHÔNG cần frontend)
- **R21** — Ví burner random có balance 0 → không transact được. Dùng ví **đã funded**, connect + user-signs.
- **R22** — KHÔNG nhét private key vào biến `VITE_` (bị bundle vào JS công khai). Build client với **địa chỉ**, để MetaMask ký.
- **R23** — Lỗi MetaMask `'from'` = sai network. Trên connect, **switch/add** network GenLayer: studionet chain id **61999** (hex `0xF1EF`), rpc `https://studio.genlayer.com/api`, symbol GEN, decimals 18.
- **R24** — studionet vs testnet faucet KHÔNG lẫn nhau. Contract deploy ở network nào chỉ sống ở đó. Giữ contract + frontend chain + ví balance + faucet **cùng một network**. Studionet demo: nạp ví từ Studio **Accounts** panel.

## E4. Quy trình deploy khuyến nghị
0. **Quét ASCII trước khi động vào Studio** (R25): chạy script quét non-ASCII trên file contract; sửa hết `—`/dấu cong/tiếng Việt có dấu về ASCII. Kiểm luôn `from genlayer import *` ở dòng 3 (R26). Bỏ bước này là nguyên nhân số một của `Could not load contract schema`.
1. Mở `https://studio.genlayer.com/run-debug`.
2. **Settings → Reset Storage → Confirm** → hard refresh (Cmd/Ctrl+Shift+R).
3. Deploy `storage_test.py` (contract sanity tối thiểu) trước → xác nhận môi trường ổn.
4. Deploy contract chính.
5. **Click transaction** trong sidebar, xác nhận `Result: SUCCESS` (không chỉ `Status: FINALIZED`).
6. Nếu `Result: ERROR` → đọc traceback, map về một trong các rule trên.

Triệu chứng → nguyên nhân nhanh:
- `Contract Queues not found` → thiếu dòng `# v0.2.16` (Rule #1).
- `Could not load contract schema` → kiểm theo thứ tự: **R25** (ký tự non-ASCII trong file, hay gặp nhất là em-dash `—` trong comment — quét bằng script ở R25 TRƯỚC TIÊN vì đây là thủ phạm âm thầm nhất), **R26** (import SDK không ở dòng 3 / bị comment dài chen giữa header), R18 (Record thay vì `@allow_storage @dataclass`), R19 (TreeMap key sai kiểu).
- `AssertionError: TreeMap <- TreeMap` → Rule #2.
- `TypeError: use bigint...` → R14.
- Test lỗi state kiểu "... is not awaiting review" → thường R17 (chưa mock, nondet tx fail âm thầm).

---

# PHẦN F — CONTRACT MẪU ĐẠT CHUẨN "INTELLIGENT CONTRACTS" (tham chiếu)

Primitive tái dùng, không phải app. `WebComplianceOracle`: nhận `(url, criteria)`, đọc trang web thật, để jury LLM phán tuân thủ, validator kiểm **ý nghĩa** verdict. Lưu lịch sử phán quyết. Đây là mẫu tinh thần — tổng quát hóa/đổi bài toán khi build thật để tránh "AI decides X" chung chung.

```python
# v0.2.16
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
#
# WebComplianceOracle — a reusable GenLayer primitive.
# Given (url, natural-language criteria), it fetches the live page and lets a
# decentralized LLM jury grade compliance as PASS / PARTIAL / FAIL with a
# confidence and rationale. Consensus is reached on the MEANING of the verdict
# (a validator agrees only if its independent ruling reaches the same verdict
# and a comparable confidence band), not on JSON shape. Other contracts/builders
# plug this in for bounty acceptance, claim triage, license checks, or content
# compliance — it is not a one-off demo.

from genlayer import *

import json
import typing
from dataclasses import dataclass


@allow_storage
@dataclass
class Ruling:
    url: str
    criteria: str
    verdict: str          # PASS | PARTIAL | FAIL
    confidence: bigint    # 0..100
    reason: str


def _norm_verdict(raw: str) -> str:
    v = str(raw or "").strip().upper()
    if "FAIL" in v or "VIOLAT" in v:
        return "FAIL"
    if "PARTIAL" in v or "DRIFT" in v or "WARN" in v:
        return "PARTIAL"
    if "PASS" in v or "COMPL" in v or "OK" == v:
        return "PASS"
    return "PARTIAL"


def _band(c) -> int:
    try:
        c = int(c)
    except Exception:
        c = 0
    return 0 if c < 35 else (1 if c < 80 else 2)


class Contract(gl.Contract):
    rulings: TreeMap[str, Ruling]   # str(id) -> Ruling
    next_id: bigint

    def __init__(self):
        self.next_id = bigint(0)

    @gl.public.write
    def grade(self, url: str, criteria: str) -> None:
        if not (url.startswith("http://") or url.startswith("https://")):
            raise gl.vm.UserError("url must start with http:// or https://")
        if not criteria or not criteria.strip():
            raise gl.vm.UserError("criteria must not be empty")

        u, c = url.strip(), criteria.strip()

        def leader_fn():
            page = gl.nondet.web.render(u, mode="text")
            evidence = (page or "")[:6000]
            prompt = f"""You are an impartial compliance adjudicator on a decentralized court.
Judge whether the live page honours the SPIRIT of the criteria.

CRITERIA:
{c}

LIVE PAGE CONTENT:
---
{evidence}
---

Rules:
- PASS: clearly honours the criteria.
- PARTIAL: ambiguous, borderline, or partially breaching.
- FAIL: clearly breaches the criteria.
- If the page is empty/unreachable, rule PARTIAL with low confidence.

Respond ONLY as JSON:
{{"verdict":"PASS"|"PARTIAL"|"FAIL","confidence":<integer 0-100>,"reason":"<one or two sentences>"}}"""
            res = gl.nondet.exec_prompt(prompt, response_format="json")
            verdict = _norm_verdict(res.get("verdict", "PARTIAL"))
            try:
                conf = int(res.get("confidence", 0))
            except Exception:
                conf = 0
            conf = max(0, min(100, conf))
            reason = str(res.get("reason", "")).strip()[:400]
            return json.dumps({"verdict": verdict, "confidence": conf, "reason": reason},
                              sort_keys=True)

        def validator_fn(leader_res: typing.Any) -> bool:
            if not isinstance(leader_res, gl.vm.Return):
                return False
            try:
                leader = json.loads(leader_res.calldata)
            except Exception:
                return False
            mine = json.loads(leader_fn())
            if _norm_verdict(leader.get("verdict")) != _norm_verdict(mine.get("verdict")):
                return False
            return _band(leader.get("confidence")) == _band(mine.get("confidence"))

        raw = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)
        p = json.loads(raw)

        rid = str(self.next_id)
        self.rulings[rid] = Ruling(
            url=u, criteria=c,
            verdict=_norm_verdict(p.get("verdict")),
            confidence=bigint(max(0, min(100, int(p.get("confidence", 0))))),
            reason=str(p.get("reason", "")).strip()[:400] or "No rationale.",
        )
        self.next_id = self.next_id + bigint(1)

    @gl.public.view
    def get_ruling(self, ruling_id: str) -> str:
        if ruling_id not in self.rulings:
            raise gl.vm.UserError("ruling not found")
        r = self.rulings[ruling_id]
        return json.dumps({"id": ruling_id, "url": r.url, "criteria": r.criteria,
                           "verdict": r.verdict, "confidence": int(r.confidence),
                           "reason": r.reason})

    @gl.public.view
    def get_all(self) -> str:
        out = []
        for i in range(int(self.next_id)):
            rid = str(i)
            if rid in self.rulings:
                out.append(json.loads(self.get_ruling(rid)))
        return json.dumps(out)

    @gl.public.view
    def get_count(self) -> int:
        return int(self.next_id)
```

**Vì sao mẫu này lọt "được nhận" chứ không "bị loại":**
- Không phải thin wrapper — có state design (Ruling struct, lịch sử phán quyết), custom validator kiểm nghĩa, edge-case + UserError.
- Tái dùng: tham số hóa `(url, criteria)` → dùng cho nhiều bài toán, "matter beyond a one-off demo".
- Consensus rõ ràng: validator đồng thuận trên **verdict + band confidence**, không phải schema.

---

# PHẦN G — LIÊN KẾT THAM CHIẾU CHÍNH THỨC

| Mục | URL |
|---|---|
| Website | https://www.genlayer.com/ |
| Cách hoạt động | https://www.genlayer.com/how-it-works |
| Documentation | https://docs.genlayer.com/ |
| Toàn bộ docs (1 file cho AI) | https://docs.genlayer.com/full-documentation.txt |
| Your First Intelligent Contract | https://docs.genlayer.com/developers/intelligent-contracts/first-intelligent-contract |
| Equivalence Principle | https://docs.genlayer.com/understand-genlayer-protocol/core-concepts/optimistic-democracy/equivalence-principle |
| Storage (persisted types) | https://docs.genlayer.com/developers/intelligent-contracts/storage |
| SDK API (run_nondet, eq_principle) | https://sdk.genlayer.com/main/api/genlayer.html |
| GenLayer Studio | https://studio.genlayer.com/contracts |
| Portal (Builder/Contributions) | https://portal.genlayer.foundation/#/builders/contributions |
| Submit Contributions guide | docs portal: Contributions → Submitting Contributions |
| Points program mã nguồn | https://github.com/genlayer-foundation/points |
| GitHub tổ chức | https://github.com/genlayerlabs |
| genlayer-js | https://github.com/genlayerlabs/genlayer-js |
| gltest | https://pypi.org/project/genlayer-test/ |
| Trang Testnet | https://www.genlayer.com/testnet |
| Skills (Claude Code plugin) | https://skills.genlayer.com/ |
| Discord | https://discord.gg/8Jm4v89VAu |

---

# PHẦN H — TÓM TẮT MỘT DÒNG (cho AI ghi nhớ nhanh)

> GenLayer là blockchain L1 đặt AI tại tầng đồng thuận; validator chạy LLM đa dạng đồng thuận theo "Optimistic Democracy" trên cả quyết định chủ quan, cho phép **Intelligent Contract** viết bằng Python thực thi non-deterministic (LLM + web, không oracle), với **Equivalence Principle** quyết định "hai kết quả có tương đương không". Mục đóng góp **Intelligent Contracts** (0–300đ, track Builder trên portal) chấm **standalone contract-primitive** có **consensus logic thật + state design rõ + validator kiểm NGHĨA (không kiểm format) + use case tái dùng + doc/tests**; **loại** hello-world, simple storage, thin LLM wrapper, format-only validator, boilerplate fork, "AI decides X" chung chung, và app có frontend (→ Projects). Build tuân thủ 7 rule cốt lõi + R13–R26 (dòng `# v0.2.16`, class `Contract`, `bigint` storage, `TreeMap[str,…]`, `@allow_storage @dataclass`, mọi `gl.nondet.*` trong inner fn qua `run_nondet_unsafe`, **file thuần ASCII không em-dash R25**, **import SDK ở dòng 3 R26**), deploy trên Studio tới `Result: SUCCESS`, nộp qua Portal Submit Contribution với evidence repo (README + source + tests + commit history thật).

---

*Biên soạn từ nguồn chính thức GenLayer (genlayer.com, docs.genlayer.com, sdk.genlayer.com, portal.genlayer.foundation) và kinh nghiệm deploy thực tế, tính đến giữa 2026. GenLayer đang ở testnet Bradbury — điểm số, thời hạn, chính sách token có thể thay đổi; kiểm chứng tại nguồn chính thức trước khi hành động.*
