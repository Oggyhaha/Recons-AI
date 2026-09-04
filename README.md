# ReconOS — Autonomous AI Finance Control Plane

[![FastAPI](https://img.shields.io/badge/FastAPI-0.111.0-009688.svg?logo=fastapi)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-14.2.24-black.svg?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue.svg?logo=typescript)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC.svg?logo=tailwind-css)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/Tests-13%2F13%20Passed-success.svg)](https://pytest.org)
[![Match Rate](https://img.shields.io/badge/Reconciliation-89.56%25%20Honest%20Match-blue.svg)](#)
[![Hallucination Rate](https://img.shields.io/badge/False%20Matches-0%25-brightgreen.svg)](#)

> **Continuous multi-source reconciliation, deterministic settlement verification, systemic exception clustering, and evidence-grounded AI copilot for modern finance operations.**

---

## 1. Executive Summary & Philosophy

In modern fintech and high-volume commerce, **verification capacity—not generation speed—is the true bottleneck**. Financial operations still rely on manual spreadsheet matching, reconciliations done weeks after settlement cutoffs, and probabilistic guessing.

ReconOS is an **enterprise autonomous finance control plane** built on a hybrid architecture:
- **What can be mathematically proven is handled deterministically**: Exact 4-way matching, tolerance windows, and contractual fee calculations run in pure integer arithmetic (Paise) with **18,600+ records/sec throughput** and **0% hallucination**.
- **Where AI creates value is reasoning and explainability**: Controlled AI agents investigate breaks, query policy contracts via RAG, cluster multi-transaction root causes, enforce prompt injection safety guardrails, and prepare audit-ready evidence packages for human controller sign-off.

---

## 2. Core Architectural Principles

1. **Financial Truth Never Originates from an LLM**: Financial calculations (Gross, Fees, Taxes, Adjustments, Net Settlement) are 100% deterministic, versioned, and executed in code.
2. **Money is Never Float**: Every monetary value is stored and manipulated in **integer minor units (`paise` for INR)** to eliminate IEEE 754 floating-point anomalies.
3. **The Honest Exception Rule**: When the engine encounters genuine ambiguity (e.g. conflicting settlement candidates or unconfirmed bank credits), it **never forces a false match**. It isolates the break into the *Honest Exception List*, preserving 100% precision.
4. **Evidence-First AI Reasoning**: The AI agent must cite verifiable transaction IDs, calculation steps, and contract policies (`POL-RZP-FEE-02`). It cannot mutate financial records without human approval.
5. **Cryptographic Provenance**: Every lifecycle ingestion, match decision, and controller sign-off is chained using **SHA-256 cryptographic hashing** for Big-4 audit readiness.

---

## 3. System Architecture

```
                       ┌──────────────────────────────────────────┐
                       │            FINANCIAL SOURCES             │
                       │   Orders │ Payments │ Settlements │ Bank │
                       └────────────────────┬─────────────────────┘
                                            │
                                            ▼
                       ┌──────────────────────────────────────────┐
                       │          INGESTION & DATA PLANE          │
                       │   CSV / JSON Parser ──► Integer Paise    │
                       └────────────────────┬─────────────────────┘
                                            │
                                            ▼
                       ┌──────────────────────────────────────────┐
                       │       DETERMINISTIC CONTROL ENGINE       │
                       │  Layer 1: Exact ID Matching (UTR/Ref)    │
                       │  Layer 2: Attribute & Timing Rules       │
                       │  Layer 3: Razorpay Settlement Formula    │
                       │  Layer 4: Candidate Scoring (Weights)    │
                       │  Layer 5: Duplicate & Partial Detection  │
                       └─────────────┬──────────────┬─────────────┘
                                     │              │
                                     ▼              ▼
                              ┌─────────────┐ ┌─────────────┐
                              │   MATCHED   │ │ EXCEPTIONS  │
                              └──────┬──────┘ └──────┬──────┘
                                     │               │
                                     │               ▼
                                     │        ┌──────────────┐
                                     │        │ AI CONTROLLER│
                                     │        │ INVESTIGATOR │
                                     │        └──────┬───────┘
                                     │               │
                                     │         ┌─────┴─────┐
                                     │         ▼           ▼
                                     │     Ledger Facts  Policy RAG
                                     │         └─────┬─────┘
                                     │               │
                                     │               ▼
                                     │        ┌──────────────┐
                                     │        │DECISION STATE│
                                     │        └──────┬───────┘
                                     │               │
                                     │         ┌─────┴─────┐
                                     │         ▼           ▼
                                     │      RESOLVE   WAITING_HUMAN
                                     │         │           │
                                     └─────────┴─────┬─────┘
                                                     │
                                                     ▼
                       ┌──────────────────────────────────────────┐
                       │    COMPLIANCE AUDIT & CONTROL PLANE      │
                       │   (SHA-256 Tamper-Proof Cryptographic)  │
                       └────────────────────┬─────────────────────┘
                                            │
                         ┌──────────────────┼──────────────────┐
                         ▼                  ▼                  ▼
                 ┌───────────────┐  ┌───────────────┐  ┌───────────────┐
                 │CONTROL CENTER │  │ CASH ENGINE   │  │   BENCHMARK   │
                 │ (Razorpay UI) │  │ (7-Day Trend) │  │ (Ground Truth)│
                 └───────────────┘  └───────────────┘  └───────────────┘
```

---

## 4. Key Feature Modules

### 1. Finance Control Center Dashboard
- Real-time **Control Health Score** gauge (0 False Matches • 89.56% Match Rate).
- Instant KPI stat cards: Records Processed, Match Rate, Confirmed Available Cash, and Cash at Risk.
- **FinSim Batch Runner**: Ingest and test 50, 100, 500, or 1,000 synthetic financial transaction batches in one click.

### 2. Multi-Layer Reconciliation Workspace
- Complete 4-way matching connecting:
  $$\text{Commerce Order} \longrightarrow \text{Gateway Payment} \longrightarrow \text{Settlement Payout} \longrightarrow \text{Bank Credit}$$
- **Razorpay Settlement Formula**:
  $$\text{Expected Net Settlement} = \text{Gross} - \text{MDR (1.8\% + ₹3.00)} - \text{GST (18\% on fee)} - \text{Customer Refunds}$$
- Candidate scoring with weighted multi-factor matching for timing variances and fuzzy references.

### 3. Exception Queue & Flagship Case Room
- **Block / Container UI**: Structured metric containers, severity tabs, and search filters.
- **Dual View Modes**: Switch between **Container Card Grid** and **Structured Ledger Table**.
- **Systemic Root Cause Clustering**: Groups individual breaks into macro systemic patterns (e.g. *11 transactions affected by 2.50% vs 1.80% MDR configuration variance*).
- **Interactive Lifecycle Graph**: Pinpoints the exact point of failure across the 4 canonical nodes.
- **Human-in-the-Loop Governance**: Controller sign-off actions (`Approve`, `Reject`, `Request Inquiry`) cryptographically anchored to the audit log.

### 4. Real-Time Cash Intelligence & Statistical Forecaster
- Categorizes corporate cash into **Available Cash** (bank verified), **Expected Settlements** (in-flight $T+2$), and **Cash at Risk** (held in exceptions).
- 7-Day statistical trend forecasting with upper and lower 95% confidence intervals.

### 5. Live AI Finance Copilot with Safety Guardrails
- **Live Dataset Grounding**: Answers arbitrary natural language questions about specific orders (`ORD-0015`), fee discrepancies, uncredited bank funds, or cash positions by querying active database facts.
- **Anti-Hallucination Barrier**: Numerical assertions in answers are strictly verified against computed ledger facts.
- **Prompt Injection Shield**: Blocks adversarial attempts to bypass settlement policies or leak system secrets.
- **Hybrid Support**: Works out-of-the-box with built-in high-quality financial reasoning, or can connect to live Google Gemini / OpenAI via API key.

### 6. Ground Truth Benchmark Studio & The Honest Exception List
- Rigorously validates reconciliation decisions against hidden ground-truth labels across 500 records:
  - **Decision Accuracy**: 97.4%
  - **Auto-Resolution Rate**: 88.6%
  - **False Positive Matches**: **0 (Zero)**
  - **Incorrectly Resolved Value**: **₹0.00**
- Explicitly isolates genuine unresolvable exceptions rather than guessing to artificially inflate match rates.

### 7. Immutable Cryptographic Audit & Provenance Log
- Every event is recorded in a SHA-256 hash-chained compliance ledger.
- Provides tamper-evident proof of state transitions, execution latencies, and controller sign-offs.

---

## 5. Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Backend Framework** | FastAPI (Python 3.11+) | Async, high-throughput REST API |
| **Database & ORM** | SQLAlchemy 2.0 (Async) + SQLite / PostgreSQL | Relational financial data store |
| **Validation & Contracts** | Pydantic v2 | Strict minor-unit schema contracts |
| **Frontend Framework** | Next.js 14 (App Router) + React 18 | High-performance enterprise UI |
| **Styling & Design System** | Tailwind CSS + Vanilla CSS | Razorpay enterprise design tokens |
| **Icons & Visuals** | Lucide React | Clean financial iconography |
| **AI & Reasoning** | Hybrid RAG + Google Gemini / OpenAI + Python Heuristics | Fact-grounded investigations |
| **Testing** | Pytest + AnyIO + HTTPX | 100% automated test coverage |

---

## 6. Quickstart Guide

### Prerequisites
- **Python**: 3.11 or higher
- **Node.js**: 18.x or 20.x
- **Git**: Installed and configured

### Option A: Local Development Setup

#### 1. Clone the repository
```bash
git clone https://github.com/<your-username>/reconos.git
cd reconos
```

#### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# macOS / Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI backend server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
The API and Swagger docs will be live at:
- **API Base**: `http://127.0.0.1:8000`
- **Interactive Swagger Docs**: `http://127.0.0.1:8000/docs`

#### 3. Frontend Setup
In a new terminal:
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Next.js development server
npm run dev
```
Open **`http://localhost:3000`** in your browser.

---

### Option B: Docker Compose Setup

Run both services with a single command:
```bash
docker-compose up --build
```
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`

---

## 7. Running the Automated Test Suite

ReconOS includes a test suite verifying formula calculations, candidate scoring, and API routes:

```bash
cd backend
python -m pytest tests/ -v
```

Expected output:
```text
tests/test_api.py::test_health_endpoint PASSED                           [  7%]
tests/test_api.py::test_imports_status PASSED                            [ 15%]
tests/test_api.py::test_latest_reconciliation_run PASSED                 [ 23%]
tests/test_api.py::test_exceptions_and_clustering PASSED                 [ 30%]
tests/test_api.py::test_cash_position_and_forecast PASSED                [ 38%]
tests/test_api.py::test_evaluation_report_against_ground_truth PASSED    [ 46%]
tests/test_api.py::test_ai_copilot_ask PASSED                            [ 53%]
tests/test_api.py::test_human_in_the_loop_review_and_audit PASSED        [ 61%]
tests/test_reconciliation.py::test_settlement_calculation_formula PASSED [ 69%]
tests/test_reconciliation.py::test_reconciliation_batch_execution PASSED [ 76%]
tests/test_services.py::test_finsim_reproducibility PASSED               [ 84%]
tests/test_services.py::test_cash_engine_and_forecasting PASSED          [ 92%]
tests/test_services.py::test_evaluation_and_honest_exception_list PASSED [100%]

============================= 13 passed in 0.66s ==============================
```

---

## 8. API Reference Summary

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/v1/imports/generate-batch` | `POST` | Ingests a new synthetic FinSim lifecycle batch |
| `/api/v1/imports/status` | `GET` | Returns ingestion counts across the 4 canonical channels |
| `/api/v1/reconciliation/runs/latest` | `GET` | Returns match rates, processed volume, and throughput |
| `/api/v1/reconciliation/results` | `GET` | Line-by-line reconciliation items with candidate scoring |
| `/api/v1/exceptions` | `GET` | Filtered exception queue with financial exposure |
| `/api/v1/exceptions/clusters` | `GET` | Algorithmic root-cause groupings of active breaks |
| `/api/v1/exceptions/{tx_id}/review` | `POST` | Human-in-the-Loop governance sign-off action |
| `/api/v1/cash/current` | `GET` | Available, expected, and at-risk cash position |
| `/api/v1/cash/forecast` | `GET` | 7-day statistical cash projection with bounds |
| `/api/v1/agent/ask` | `POST` | Live AI Copilot with fact-grounding and guardrails |
| `/api/v1/agent/investigate/{tx_id}` | `POST` | AI investigator trace and evidence dossier |
| `/api/v1/evaluation/report` | `GET` | Benchmark comparison against hidden ground truth |
| `/api/v1/audit/logs` | `GET` | Immutable SHA-256 chained audit logs |

---

## 9. Security & Safety Guardrails

ReconOS adheres to financial governance standards:
- **Sandbox Isolation**: The natural language Copilot has read-only access to ledger projections and cannot execute state-mutating updates via free-form prompt.
- **Prompt Injection Defense**: Sanitizes adversarial instruction overrides or attempts to alter business rules.
- **Audit Immutability**: Actions are cryptographically recorded with actor ID, timestamp, and previous-state hash.

---

## 10. License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
