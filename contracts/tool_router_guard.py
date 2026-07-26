# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
"""
ToolRouterGuard

Minimal reusable consumer for SemanticInterfaceCovenant. It demonstrates the
enforcement side of the primitive: finalized covenant status notifications
change whether an operator may route a request to a protected API/MCP/tool.
"""

from dataclasses import dataclass

from genlayer import *


MAX_ID_LENGTH = 96
ALLOWED_STATUSES = ("ACTIVE", "DEGRADED", "QUARANTINED", "CLOSED")


@allow_storage
@dataclass
class RouteRecord:
    request_id: str
    tool_id: str
    operator: Address
    covenant_status: str
    verdict_id: str


class ToolRouterGuard(gl.Contract):
    owner: Address
    covenant_contract: Address
    binding_id: str
    allow_degraded: bool
    covenant_status: str
    last_verdict_id: str
    route_count: u256

    operators: TreeMap[Address, bool]
    processed_notifications: TreeMap[str, bool]
    routes: TreeMap[str, RouteRecord]
    route_index: TreeMap[str, str]

    def __init__(
        self,
        covenant_contract: str,
        binding_id: str,
        allow_degraded: bool = False,
    ):
        self._require_id(binding_id, "Binding ID")
        self.owner = gl.message.sender_address
        self.covenant_contract = Address(covenant_contract)
        self.binding_id = binding_id
        self.allow_degraded = allow_degraded
        self.covenant_status = "ACTIVE"
        self.last_verdict_id = ""
        self.route_count = u256(0)
        self.operators[self.owner] = True

    def _require_id(self, value: str, label: str) -> None:
        if len(value) == 0 or len(value) > MAX_ID_LENGTH:
            raise gl.vm.UserError(label + " has invalid length")
        for char in value:
            if not (
                ("a" <= char <= "z")
                or ("A" <= char <= "Z")
                or ("0" <= char <= "9")
                or char in ("-", "_", ".")
            ):
                raise gl.vm.UserError(label + " contains invalid characters")

    def _can_route(self) -> bool:
        if self.covenant_status == "ACTIVE":
            return True
        return self.covenant_status == "DEGRADED" and self.allow_degraded

    @gl.public.write
    def set_operator(self, operator_address: str, enabled: bool) -> None:
        if gl.message.sender_address != self.owner:
            raise gl.vm.UserError("Only owner can configure operators")
        operator = Address(operator_address)
        self.operators[operator] = enabled

    @gl.public.write
    def set_allow_degraded(self, allowed: bool) -> None:
        if gl.message.sender_address != self.owner:
            raise gl.vm.UserError("Only owner can configure routing policy")
        self.allow_degraded = allowed

    @gl.public.write
    def on_covenant_status(
        self,
        binding_id: str,
        verdict_id: str,
        new_status: str,
    ) -> bool:
        if gl.message.sender_address != self.covenant_contract:
            raise gl.vm.UserError("Only covenant contract can update status")
        if binding_id != self.binding_id:
            raise gl.vm.UserError("Binding ID does not match guard")
        self._require_id(verdict_id, "Verdict ID")
        if new_status not in ALLOWED_STATUSES:
            raise gl.vm.UserError("Unsupported covenant status")

        notification_key = binding_id + ":" + verdict_id
        if self.processed_notifications.get(notification_key) is True:
            return False

        self.processed_notifications[notification_key] = True
        self.covenant_status = new_status
        self.last_verdict_id = verdict_id
        return True

    @gl.public.write
    def route_request(self, request_id: str, tool_id: str) -> None:
        self._require_id(request_id, "Request ID")
        self._require_id(tool_id, "Tool ID")
        sender = gl.message.sender_address
        if self.operators.get(sender) is not True:
            raise gl.vm.UserError("Caller is not an operator")
        if not self._can_route():
            raise gl.vm.UserError("Protected tool is quarantined")
        if request_id in self.routes:
            raise gl.vm.UserError("Request already routed")

        self.routes[request_id] = RouteRecord(
            request_id=request_id,
            tool_id=tool_id,
            operator=sender,
            covenant_status=self.covenant_status,
            verdict_id=self.last_verdict_id,
        )
        index = int(self.route_count)
        self.route_index[str(index)] = request_id
        self.route_count = u256(index + 1)

    @gl.public.view
    def can_route(self) -> bool:
        return self._can_route()

    @gl.public.view
    def get_status(self) -> dict:
        return {
            "binding_id": self.binding_id,
            "covenant_contract": self.covenant_contract,
            "covenant_status": self.covenant_status,
            "last_verdict_id": self.last_verdict_id,
            "allow_degraded": self.allow_degraded,
            "can_route": self._can_route(),
            "route_count": self.route_count,
        }

    @gl.public.view
    def get_route(self, request_id: str) -> RouteRecord:
        if request_id not in self.routes:
            raise gl.vm.UserError("Route not found")
        return self.routes[request_id]

    @gl.public.view
    def get_route_ids(self) -> list[str]:
        result: list[str] = []
        for index in range(int(self.route_count)):
            result.append(self.route_index[str(index)])
        return result
