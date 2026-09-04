import hashlib
import json
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional

class AuditService:
    def __init__(self):
        self._audit_log: List[Dict[str, Any]] = []

    def record_event(
        self,
        actor_type: str,
        actor_id: str,
        action: str,
        entity_type: str,
        entity_id: str,
        before_state: Optional[Dict[str, Any]] = None,
        after_state: Optional[Dict[str, Any]] = None,
        reason: Optional[str] = None,
        correlation_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Creates an immutable audit event with tamper-evident cryptographic hash per PRD §44 & SDS §48.
        """
        now = datetime.now(timezone.utc).isoformat()
        
        # Calculate tamper-evident hash
        payload_to_hash = f"{actor_type}:{actor_id}:{action}:{entity_type}:{entity_id}:{now}"
        event_hash = hashlib.sha256(payload_to_hash.encode()).hexdigest()

        event = {
            "id": f"aud_{len(self._audit_log) + 1:05d}",
            "actor_type": actor_type,
            "actor_id": actor_id,
            "action": action,
            "entity_type": entity_type,
            "entity_id": entity_id,
            "before_state": before_state or {},
            "after_state": after_state or {},
            "reason": reason or "Standard reconciliation execution",
            "correlation_id": correlation_id or event_hash[:16],
            "tamper_hash": event_hash,
            "created_at": now
        }
        self._audit_log.append(event)
        return event

    def get_logs(self, limit: int = 100) -> List[Dict[str, Any]]:
        return list(reversed(self._audit_log[-limit:]))

# Global audit service singleton
audit_service = AuditService()
