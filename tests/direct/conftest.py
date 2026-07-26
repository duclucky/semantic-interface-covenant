"""Shared helpers for direct mode tests."""

from __future__ import annotations

import os
import tempfile


def _install_windows_stdin_patch() -> None:
    """Work around genlayer-test's open-temp-file behavior on Windows.

    genlayer-test duplicates a temporary file onto stdin and immediately
    unlinks the path. POSIX permits unlinking an open file, while Windows
    raises WinError 32. Keep the path until VM cleanup has restored stdin.

    This patch is intentionally test-only and can be removed once the
    upstream loader defers unlinking on Windows.
    """
    if os.name != "nt":
        return

    from gltest.direct import loader
    from gltest.direct.vm import VMContext

    if getattr(loader, "_genlayer_windows_stdin_patch", False):
        return

    def inject_message_to_fd0(vm: VMContext) -> None:
        from genlayer.py import calldata
        from genlayer.py.types import Address

        sender_addr = Address(vm.sender) if isinstance(vm.sender, bytes) else vm.sender
        contract_addr = (
            Address(vm._contract_address)
            if isinstance(vm._contract_address, bytes)
            else vm._contract_address
        )
        origin_addr = Address(vm.origin) if isinstance(vm.origin, bytes) else vm.origin

        encoded = calldata.encode(
            {
                "contract_address": contract_addr,
                "sender_address": sender_addr,
                "origin_address": origin_addr,
                "stack": [],
                "value": vm._value,
                "datetime": vm._datetime,
                "is_init": False,
                "chain_id": vm._chain_id,
                "entry_kind": 0,
                "entry_data": b"",
                "entry_stage_data": None,
            }
        )

        fd, path = tempfile.mkstemp()
        try:
            os.write(fd, encoded)
            os.lseek(fd, 0, os.SEEK_SET)
            vm._original_stdin_fd = os.dup(0)
            os.dup2(fd, 0)
            vm._genlayer_stdin_temp_path = path
        finally:
            os.close(fd)

    original_cleanup = VMContext._cleanup_after_deactivate

    def cleanup_after_deactivate(self: VMContext) -> None:
        try:
            original_cleanup(self)
        finally:
            path = getattr(self, "_genlayer_stdin_temp_path", None)
            if path:
                try:
                    os.unlink(path)
                except FileNotFoundError:
                    pass
                self._genlayer_stdin_temp_path = None

    loader._inject_message_to_fd0 = inject_message_to_fd0
    loader._genlayer_windows_stdin_patch = True
    VMContext._cleanup_after_deactivate = cleanup_after_deactivate


_install_windows_stdin_patch()


def to_hex(addr_bytes):
    """Convert address bytes to checksummed hex matching contract output.

    The contract's get_bets()/get_points() return keys via Address.as_hex,
    which produces EIP-55 checksummed hex. Call after direct_deploy so the
    SDK is on sys.path.
    """
    if hasattr(addr_bytes, "as_hex"):
        return addr_bytes.as_hex
    from genlayer.py.types import Address

    return Address(addr_bytes).as_hex
