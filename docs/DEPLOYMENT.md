# IDEA-001 - Deployment and Real-Evidence Runbook

Tai lieu nay vua ghi trang thai deployment da kiem chung, vua la quy trinh co
the chay lai. Chi address, transaction hash va trang thai nam trong evidence
theo network moi duoc xem la bang chung that.

## Trang thai Studionet da kiem chung

- Network: `studionet`, chain ID `61999`.
- Primitive:
  `0x05b27207c7aC50d22E5C1afBfD3c20DBccCa0570`.
- Consumer guard:
  `0xA58132c068E0406E2d5d43E8b72E2b2361ac057D`.
- Full lifecycle tu deployment den consensus, quarantine, cure, route
  enforcement va withdrawal da dat `FINALIZED`.

Nguon evidence:
[evidence/studionet/deployment.json](evidence/studionet/deployment.json).

## Secret boundary

Khong dua private key/seed phrase vao source, README, shell history, log hoac
chat. Script chi doc hai bien tu root `.env`, file nay bi Git ignore:

```dotenv
STUDIONET_PRIVATE_KEY=<provider key>
STUDIONET_INTEGRATOR_PRIVATE_KEY=<integrator key>
```

## Script Studionet co the tiep tuc

Chay tu repository root:

```powershell
node scripts/deploy-idea001-studionet.mjs inspect
node scripts/deploy-idea001-studionet.mjs deploy-primitive
node scripts/deploy-idea001-studionet.mjs deploy-guard
node scripts/deploy-idea001-studionet.mjs setup-provider
node scripts/deploy-idea001-studionet.mjs fund-integrator
node scripts/deploy-idea001-studionet.mjs run-demo
```

Moi command doc evidence truoc khi gui giao dich, xac nhan key khop dung vi da
ghi nhan va tiep tuc tu state hien co. Khong xoa evidence de buoc chay lai mot
giao dich da finalized.

## Network evidence bat buoc

Mot lifecycle toi thieu phai chung minh:

1. provider tao/activate covenant voi guarantee va allowlisted source;
2. provider offer binding kem bond, integrator accept;
3. integrator/watcher mo bonded case va them live public evidence;
4. validators adjudicate `BREAKING`;
5. binding tro thanh `QUARANTINED` va settlement ledger doi;
6. finalized message doi `ToolRouterGuard` sang `QUARANTINED`;
7. mot route request bi consumer tu choi;
8. provider submit cure + evidence, top up neu can;
9. validators adjudicate `CURED`, binding/consumer tro lai `ACTIVE`;
10. mot route request moi thanh cong;
11. claimant/provider withdraw credit va balance/receipt xac nhan value
    transfer;
12. script doc lai canonical contract state sau finalization.

Lifecycle tren da duoc ghi nhan cho Studionet trong evidence JSON. Khi chay lai
tren Asimov hoac Bradbury, tao thu muc evidence rieng; khong ghi de ket qua
Studionet.

Evidence phai duoc tach theo network. Khong dung local direct-test output de
thay the Studionet/Asimov/Bradbury evidence.

## Dieu kien dung an toan

Dung va khong tuyen bo thanh cong neu:

- transaction chi submitted/decided nhung chua finalized;
- subscriber message khong den consumer;
- canonical state read mau thuan voi receipt hoac explorer;
- balance/receipt khong xac nhan withdrawal;
- source URL khong phai public HTTPS allowlisted source;
- explorer/CLI output mau thuan voi README;
- evidence JSON chi chua local mock hoac static hash thay cho network state.
