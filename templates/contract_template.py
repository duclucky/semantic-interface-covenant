# v0.2.16
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *

import json
import typing
from dataclasses import dataclass

# TEMPLATE for a GenLayer Intelligent Contract primitive.
# Rename things, replace the leader prompt and the validator comparison
# with YOUR primitive's meaning-level check. Keep this file PURE ASCII
# (no em-dash, no curly quotes, no accented characters) - rule R25.
#
# Consensus design (explain this in your README too):
# - leader_fn fetches the web page, asks the LLM jury, and returns a
#   NORMALIZED json payload (decision fields only, free prose truncated).
# - validator_fn re-runs the same judgement independently and agrees ONLY
#   if the MEANING matches: same verdict and same confidence band.
#   It never compares raw prose or json shape.


@allow_storage
@dataclass
class Ruling:
    subject: str
    criteria: str
    verdict: str          # PASS | PARTIAL | FAIL
    confidence: bigint    # 0..100 (stored ints must be bigint - R14)
    reason: str


def _norm_verdict(raw: str) -> str:
    v = str(raw or "").strip().upper()
    if "FAIL" in v or "VIOLAT" in v:
        return "FAIL"
    if "PARTIAL" in v or "WARN" in v:
        return "PARTIAL"
    if "PASS" in v or "COMPL" in v or v == "OK":
        return "PASS"
    return "PARTIAL"


def _band(c) -> int:
    # 3 confidence bands: <35 low, 35..79 mid, >=80 high
    try:
        c = int(c)
    except Exception:
        c = 0
    return 0 if c < 35 else (1 if c < 80 else 2)


class Contract(gl.Contract):
    # storage: TreeMap keys MUST be str (R19), numbers MUST be bigint (R14)
    rulings: TreeMap[str, Ruling]
    next_id: bigint

    def __init__(self):
        # do NOT reassign TreeMap()/DynArray() here (core rule #2)
        self.next_id = bigint(0)

    @gl.public.write
    def adjudicate(self, url: str, criteria: str) -> None:
        # ---- deterministic input validation + UserError branches ----
        if not (url.startswith("http://") or url.startswith("https://")):
            raise gl.vm.UserError("url must start with http:// or https://")
        if not criteria or not criteria.strip():
            raise gl.vm.UserError("criteria must not be empty")

        # capture into locals: self/storage is NOT accessible inside
        # the non-deterministic block (core rule #7)
        u, c = url.strip(), criteria.strip()

        def leader_fn():
            page = gl.nondet.web.render(u, mode="text")
            evidence = (page or "")[:6000]
            prompt = f"""You are an impartial adjudicator on a decentralized court.
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
- If the page is empty or unreachable, rule PARTIAL with low confidence.

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
            # normalized payload: decision only, sorted keys
            return json.dumps(
                {"verdict": verdict, "confidence": conf, "reason": reason},
                sort_keys=True,
            )

        def validator_fn(leader_res: typing.Any) -> bool:
            if not isinstance(leader_res, gl.vm.Return):
                return False
            try:
                leader = json.loads(leader_res.calldata)
            except Exception:
                return False
            mine = json.loads(leader_fn())  # independent re-run
            # MEANING-level agreement: verdict + confidence band.
            # Never compare prose or json shape.
            if _norm_verdict(leader.get("verdict")) != _norm_verdict(mine.get("verdict")):
                return False
            return _band(leader.get("confidence")) == _band(mine.get("confidence"))

        raw = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)
        p = json.loads(raw)

        # ---- deterministic state update from consensus payload ----
        rid = str(self.next_id)
        self.rulings[rid] = Ruling(
            subject=u,
            criteria=c,
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
        return json.dumps({
            "id": ruling_id,
            "subject": r.subject,
            "criteria": r.criteria,
            "verdict": r.verdict,
            "confidence": int(r.confidence),
            "reason": r.reason,
        })

    @gl.public.view
    def get_count(self) -> int:
        return int(self.next_id)
