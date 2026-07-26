"""Direct-mode tests for the reusable ToolRouterGuard consumer."""

from tests.direct.conftest import to_hex


CONTRACT_PATH = "contracts/tool_router_guard.py"


def _raw_address_hex(address):
    if hasattr(address, "as_hex"):
        return address.as_hex
    return "0x" + address.hex()


def _deploy_guard(
    direct_vm,
    direct_deploy,
    owner,
    covenant_address,
    allow_degraded=False,
):
    direct_vm.sender = owner
    return direct_deploy(
        CONTRACT_PATH,
        _raw_address_hex(covenant_address),
        "binding-1",
        allow_degraded,
    )


def test_guard_starts_active_and_owner_can_route(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    guard = _deploy_guard(
        direct_vm,
        direct_deploy,
        direct_alice,
        direct_bob,
    )

    assert guard.can_route() is True
    guard.route_request("request-1", "price-tool")

    route = guard.get_route("request-1")
    assert route.tool_id == "price-tool"
    assert route.operator.as_hex == to_hex(direct_alice)
    assert route.covenant_status == "ACTIVE"
    assert guard.get_route_ids() == ["request-1"]


def test_only_covenant_contract_can_update_status(
    direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie
):
    guard = _deploy_guard(
        direct_vm,
        direct_deploy,
        direct_alice,
        direct_bob,
    )

    direct_vm.sender = direct_charlie
    with direct_vm.expect_revert("Only covenant contract can update status"):
        guard.on_covenant_status(
            "binding-1",
            "verdict-case-1",
            "QUARANTINED",
        )


def test_quarantine_notification_blocks_routes_and_is_idempotent(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    guard = _deploy_guard(
        direct_vm,
        direct_deploy,
        direct_alice,
        direct_bob,
    )

    direct_vm.sender = direct_bob
    assert (
        guard.on_covenant_status(
            "binding-1",
            "verdict-case-1",
            "QUARANTINED",
        )
        is True
    )
    assert (
        guard.on_covenant_status(
            "binding-1",
            "verdict-case-1",
            "QUARANTINED",
        )
        is False
    )

    status = guard.get_status()
    assert status["covenant_status"] == "QUARANTINED"
    assert status["last_verdict_id"] == "verdict-case-1"
    assert status["can_route"] is False

    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("Protected tool is quarantined"):
        guard.route_request("request-1", "price-tool")


def test_cure_notification_restores_routing(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    guard = _deploy_guard(
        direct_vm,
        direct_deploy,
        direct_alice,
        direct_bob,
    )
    direct_vm.sender = direct_bob
    guard.on_covenant_status(
        "binding-1",
        "verdict-case-1",
        "QUARANTINED",
    )
    guard.on_covenant_status(
        "binding-1",
        "cure-cure-1",
        "ACTIVE",
    )

    assert guard.can_route() is True
    direct_vm.sender = direct_alice
    guard.route_request("request-after-cure", "price-tool")
    route = guard.get_route("request-after-cure")
    assert route.verdict_id == "cure-cure-1"
    assert route.covenant_status == "ACTIVE"


def test_degraded_policy_is_explicit(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    guard = _deploy_guard(
        direct_vm,
        direct_deploy,
        direct_alice,
        direct_bob,
        allow_degraded=False,
    )
    direct_vm.sender = direct_bob
    guard.on_covenant_status(
        "binding-1",
        "verdict-case-1",
        "DEGRADED",
    )
    assert guard.can_route() is False

    direct_vm.sender = direct_alice
    guard.set_allow_degraded(True)
    assert guard.can_route() is True
    guard.route_request("degraded-request", "price-tool")
    assert guard.get_route("degraded-request").covenant_status == "DEGRADED"


def test_operator_access_and_duplicate_request_protection(
    direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie
):
    guard = _deploy_guard(
        direct_vm,
        direct_deploy,
        direct_alice,
        direct_bob,
    )

    direct_vm.sender = direct_charlie
    with direct_vm.expect_revert("Caller is not an operator"):
        guard.route_request("request-1", "price-tool")

    direct_vm.sender = direct_alice
    guard.set_operator(to_hex(direct_charlie), True)

    direct_vm.sender = direct_charlie
    guard.route_request("request-1", "price-tool")
    with direct_vm.expect_revert("Request already routed"):
        guard.route_request("request-1", "price-tool")


def test_wrong_binding_or_status_is_rejected(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    guard = _deploy_guard(
        direct_vm,
        direct_deploy,
        direct_alice,
        direct_bob,
    )
    direct_vm.sender = direct_bob

    with direct_vm.expect_revert("Binding ID does not match guard"):
        guard.on_covenant_status(
            "binding-other",
            "verdict-case-1",
            "QUARANTINED",
        )

    with direct_vm.expect_revert("Unsupported covenant status"):
        guard.on_covenant_status(
            "binding-1",
            "verdict-case-1",
            "UNKNOWN",
        )
