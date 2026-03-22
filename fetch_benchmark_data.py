import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from huggingface_hub import hf_hub_download
from huggingface_hub.utils import RepositoryNotFoundError

# Load .env file
env_path = Path(".") / ".env"
load_dotenv(dotenv_path=env_path)

HF_TOKEN = os.getenv("HF_TOKEN")
REPO_ID = "intellistream/sage-benchmark-results"
REPO_TYPE = "dataset"
TARGET_DIR = Path("docs_src/data")
BENCHMARK_FILE = "benchmark_results.json"


def _normalize_workload_name(name: str | None) -> str:
    if not name:
        return "Unknown"
    raw = str(name).strip()
    if raw.lower().startswith("q") and len(raw) >= 2 and raw[1].isdigit() and raw[1] in "12345678":
        return f"Q{raw[1]}"
    if "scheduler" in raw.lower():
        return "Scheduler"
    return raw


def _to_percent(value: float | int | None) -> float | None:
    if value is None:
        return None
    number = float(value)
    return number * 100 if number <= 1 else number


def _to_entry(entry: dict, index: int) -> dict:
    nodes = int(entry.get("nodes") or 1)
    parallelism = int(entry.get("parallelism") or 1)
    backend = str(entry.get("backend") or "sage").lower()
    metadata = entry.get("metadata") or {}
    workload_name = _normalize_workload_name(entry.get("workload"))

    return {
        "entry_id": entry.get("run_id") or f"{backend}-{workload_name}-{index}",
        "sage_version": metadata.get("sage_version"),
        "sagellm_version": metadata.get("sagellm_version"),
        "timestamp": str(entry.get("timestamp") or "")[:10] or "-",
        "metadata": metadata,
        "components": metadata.get("component_versions") or {},
        "model_name": metadata.get("model_name"),
        "embedding_model_name": metadata.get("embedding_model_name"),
        "backend": backend,
        "nodes": nodes,
        "parallelism": parallelism,
        "seed": entry.get("seed"),
        "config_type": "multi-node" if nodes > 1 else "single-chip",
        "resource_config": {
            "name": f"{nodes} node{'s' if nodes > 1 else ''} • {backend.upper()}",
            "details": (
                f"parallelism={parallelism}, seed={entry.get('seed', '-')}, "
                f"run_id={entry.get('run_id', '-') }"
            ),
        },
        "workload": {
            "name": workload_name,
            "type": metadata.get("experiment_name") or str(entry.get("workload") or "benchmark"),
            "description": (
                f"scheduler={metadata.get('scheduler_name')}"
                if metadata.get("scheduler_name")
                else f"backend={backend}"
            ),
        },
        "metrics": {
            "throughput_qps": entry.get("throughput"),
            "latency_p99": (
                entry.get("latency_p99")
                if entry.get("latency_p99") is not None
                else entry.get("latency_p95")
            ),
            "success_rate": _to_percent(entry.get("success_rate")),
            "memory_mb": None,
            "accuracy_score": None,
        },
        "raw_record": entry,
    }


def _is_failed_run(raw: dict) -> bool:
    """Returns True if the benchmark run had zero successful requests (service offline)."""
    metadata = raw.get("metadata") or {}
    successful = metadata.get("successful_requests")
    # Only filter when the field is explicitly present and is 0
    return successful is not None and int(successful) == 0


def _split_leaderboards(records: list[dict]) -> tuple[list[dict], list[dict]]:
    normalized = [_to_entry(entry, idx) for idx, entry in enumerate(records)]
    # Exclude entries where all requests failed (backend/gateway was not running)
    valid = [row for row in normalized if not _is_failed_run(row.get("raw_record") or {})]
    skipped = len(normalized) - len(valid)
    if skipped:
        print(f"  ⚠️  Skipped {skipped} fully-failed run(s) (successful_requests=0)")
    single = [row for row in valid if row.get("config_type") == "single-chip"]
    multi = [row for row in valid if row.get("config_type") == "multi-node"]
    return single, multi


def main():
    print(f"--- Fetching Benchmark Data from HuggingFace ---")
    print(f"Repo: {REPO_ID} ({REPO_TYPE})")

    if not HF_TOKEN:
        print(
            "Warning: HF_TOKEN not found in .env. Attempting anonymous access (public repo only)."
        )
    else:
        print("HF_TOKEN loaded from .env.")

    TARGET_DIR.mkdir(parents=True, exist_ok=True)

    try:
        print(f"Downloading {BENCHMARK_FILE}...")
        benchmark_path = hf_hub_download(
            repo_id=REPO_ID,
            filename=BENCHMARK_FILE,
            repo_type=REPO_TYPE,
            token=HF_TOKEN,
            force_download=True,
        )
        print(f"✅ Successfully downloaded to {benchmark_path}")
    except RepositoryNotFoundError:
        print(f"❌ Error: Repository {REPO_ID} not found or not accessible with provided token.")
        print("Please check the REPO_ID in script and HF_TOKEN in .env.")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error downloading {BENCHMARK_FILE}: {str(e)}")
        sys.exit(1)

    import json

    benchmark_data = json.loads(Path(benchmark_path).read_text(encoding="utf-8"))
    if not isinstance(benchmark_data, list):
        print("❌ Invalid benchmark_results.json format: expected a JSON array.")
        sys.exit(1)

    single_data, multi_data = _split_leaderboards(benchmark_data)

    single_path = TARGET_DIR / "leaderboard_single.json"
    multi_path = TARGET_DIR / "leaderboard_multi.json"

    single_path.write_text(json.dumps(single_data, ensure_ascii=False, indent=2), encoding="utf-8")
    multi_path.write_text(json.dumps(multi_data, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"✅ Wrote {single_path} ({len(single_data)} entries)")
    print(f"✅ Wrote {multi_path} ({len(multi_data)} entries)")
    print("\nAll data files updated successfully.")


if __name__ == "__main__":
    main()
