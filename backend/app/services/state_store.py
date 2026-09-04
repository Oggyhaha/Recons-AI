from typing import Dict, List, Any, Optional
from app.simulator.finsim import FinSim
from app.services.reconciliation import ReconciliationEngine
from app.services.exceptions import ExceptionManagementService
from app.services.cash_engine import CashEngine
from app.services.evaluation import EvaluationEngine
from app.services.audit_service import audit_service
from app.services.agent_service import FinanceAgentService

class SystemStateStore:
    def __init__(self):
        self.finsim = FinSim(seed=42)
        self.recon_engine = ReconciliationEngine()
        self.agent_service = FinanceAgentService()
        
        # In-memory working cache populated with default high-fidelity 500-record batch
        self.current_batch: Dict[str, Any] = {}
        self.reconciliation_data: Dict[str, Any] = {}
        self.exceptions_list: List[Dict[str, Any]] = []
        self.clusters_list: List[Dict[str, Any]] = []
        self.cash_position_data: Dict[str, Any] = {}
        self.cash_forecast_data: Dict[str, Any] = {}
        self.evaluation_report_data: Dict[str, Any] = {}
        self.agent_investigation_runs: Dict[str, Dict[str, Any]] = {}
        
        # Initialize default standard 500-record demo dataset
        self.generate_and_reconcile(record_count=500, anomaly_rate=0.15)

    def generate_and_reconcile(self, record_count: int = 500, anomaly_rate: float = 0.15) -> Dict[str, Any]:
        audit_service.record_event(
            actor_type="SYSTEM",
            actor_id="FinSim-Engine",
            action="BATCH_GENERATION_STARTED",
            entity_type="DATASET",
            entity_id=f"FINSIM-{record_count}-BATCH",
            reason=f"Generated synthetic financial world with {record_count} records ({int(anomaly_rate*100)}% anomaly rate)."
        )

        # 1. Generate multi-source synthetic batch
        self.current_batch = self.finsim.generate_batch(
            record_count=record_count,
            anomaly_rate=anomaly_rate
        )

        # 2. Execute deterministic reconciliation
        self.reconciliation_data = self.recon_engine.reconcile_batch(
            orders=self.current_batch["orders"],
            payments=self.current_batch["payments"],
            settlements=self.current_batch["settlements"],
            bank_transactions=self.current_batch["bank_transactions"],
            refunds=self.current_batch["refunds"],
            adjustments=self.current_batch["adjustments"]
        )

        self.exceptions_list = list(self.reconciliation_data["exceptions"])
        self.clusters_list = ExceptionManagementService.cluster_exceptions(self.exceptions_list)

        # 3. Update Cash Position & Forecast
        self.cash_position_data = CashEngine.calculate_cash_position(
            bank_transactions=self.current_batch["bank_transactions"],
            settlements=self.current_batch["settlements"],
            refunds=self.current_batch["refunds"],
            exceptions=self.exceptions_list
        )

        self.cash_forecast_data = CashEngine.generate_cash_forecast(
            cash_position=self.cash_position_data,
            horizon_days=7
        )

        # 4. Compute Rigorous Evaluation against Hidden Ground Truth
        self.evaluation_report_data = EvaluationEngine.evaluate_batch(
            reconciliation_results=self.reconciliation_data["results"],
            ground_truth=self.current_batch["ground_truth"],
            throughput_rps=self.reconciliation_data["summary"]["throughput_rps"]
        )

        audit_service.record_event(
            actor_type="SYSTEM",
            actor_id="ReconEngine-Core",
            action="BATCH_RECONCILIATION_COMPLETED",
            entity_type="RECONCILIATION_RUN",
            entity_id=f"RUN-{record_count}",
            after_state=self.reconciliation_data["summary"],
            reason=f"Reconciled {record_count} records. Match rate: {self.reconciliation_data['summary']['match_rate']}%."
        )

        return {
            "summary": self.reconciliation_data["summary"],
            "evaluation": self.evaluation_report_data,
            "cash": self.cash_position_data
        }

# Global singleton
system_state = SystemStateStore()
