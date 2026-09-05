import time
import requests

def benchmark():
    print("=" * 70)
    print("  PENGUJIAN KECEPATAN & LATENSI WAKTU RESPON APLIKASI (BENCHMARK)")
    print("=" * 70)

    endpoints = [
        ("Health Check", "GET", "http://127.0.0.1:8000/api/v1/health", None),
        ("Stock Universe Listing (154 Emiten)", "GET", "http://127.0.0.1:8000/api/v1/stocks/", None),
        ("Screener Multi-Factor Filter (154 Emiten)", "POST", "http://127.0.0.1:8000/api/v1/screener/query", {"limit": 50}),
        ("Natural Language AI Search", "POST", "http://127.0.0.1:8000/api/v1/screener/natural-language", {"query": "saham banking undervalue"}),
        ("Single Stock 360 Analysis (BBCA.JK)", "GET", "http://127.0.0.1:8000/api/v1/stocks/BBCA.JK", None),
        ("BSJP Rapid Scanner", "GET", "http://127.0.0.1:8000/api/v1/screener/bsjp?min_score=60", None),
    ]

    for name, method, url, payload in endpoints:
        latencies = []
        for trial in range(3):
            t0 = time.perf_counter()
            if method == "GET":
                r = requests.get(url)
            else:
                r = requests.post(url, json=payload)
            t1 = time.perf_counter()
            latency_ms = (t1 - t0) * 1000.0
            latencies.append(latency_ms)

        avg_lat = sum(latencies) / len(latencies)
        min_lat = min(latencies)
        status = "ULTRA_FAST (<50ms)" if avg_lat < 50 else ("FAST (<500ms)" if avg_lat < 500 else "NORMAL")
        print(f"[{status}] {name}")
        print(f"    Average: {avg_lat:.2f} ms | Fastest: {min_lat:.2f} ms | HTTP Status: {r.status_code}")

    print("=" * 70)

if __name__ == "__main__":
    benchmark()
