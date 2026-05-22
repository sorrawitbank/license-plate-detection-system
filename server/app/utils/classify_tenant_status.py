from __future__ import annotations


def classify_tenant_status(
    vehicle_id: str | None,
    slot_id: int | None,
) -> str:
    if vehicle_id is None:
        return "External"
    if slot_id is None:
        return "Former Tenant"
    return "Tenant"
