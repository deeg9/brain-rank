"""
NeuroCut — RunPod Async Endpoint Test Client

Submits an inference job to a RunPod serverless endpoint via /run (async),
then polls /status/{job_id} until the job completes or fails.

Required environment variables:
    RUNPOD_API_KEY      — RunPod API key (starts with "rp_")
    RUNPOD_ENDPOINT_ID  — RunPod endpoint ID from the endpoint details page

Usage:
    export RUNPOD_API_KEY=your-api-key
    export RUNPOD_ENDPOINT_ID=your-endpoint-id
    python scripts/test_endpoint.py [optional-video-url]

The default test video is a short clip from the Sintel open movie.
Results are saved to data/endpoint_test_result.json on success.
"""

import json
import os
import sys
import time

import requests

# ---------- Configuration ----------
RUNPOD_BASE_URL = "https://api.runpod.ai/v2"
POLL_INTERVAL_SECONDS = 30
TIMEOUT_SECONDS = 1500  # 25 minutes
DEFAULT_VIDEO_URL = (
    "https://download.blender.org/demo/movies/Sintel.2010.720p.mkv"
)
OUTPUT_FILE = "data/endpoint_test_result.json"


def main():
    # ---------- Validate env vars ----------
    api_key = os.environ.get("RUNPOD_API_KEY")
    if not api_key:
        print("ERROR: RUNPOD_API_KEY environment variable is not set.")
        print("Get your API key from: runpod.io > Settings > API Keys")
        sys.exit(1)

    endpoint_id = os.environ.get("RUNPOD_ENDPOINT_ID")
    if not endpoint_id:
        print("ERROR: RUNPOD_ENDPOINT_ID environment variable is not set.")
        print("Find your endpoint ID at: runpod.io > Serverless > Your Endpoint")
        sys.exit(1)

    # ---------- Video URL ----------
    video_url = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_VIDEO_URL
    print(f"Video URL: {video_url}")
    print(f"Endpoint:  {endpoint_id}")
    print()

    # ---------- Submit job via /run ----------
    run_url = f"{RUNPOD_BASE_URL}/{endpoint_id}/run"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }
    payload = {"input": {"video_url": video_url}}

    print("Submitting job...")
    response = requests.post(run_url, headers=headers, json=payload, timeout=30)

    if response.status_code != 200:
        print(f"ERROR: Submit failed with status {response.status_code}")
        print(response.text)
        sys.exit(1)

    result = response.json()
    job_id = result.get("id")
    if not job_id:
        print(f"ERROR: No job ID in response: {result}")
        sys.exit(1)

    print(f"Job submitted: {job_id}")
    print(f"Polling every {POLL_INTERVAL_SECONDS}s (timeout: {TIMEOUT_SECONDS}s)")
    print()

    # ---------- Poll /status until done ----------
    status_url = f"{RUNPOD_BASE_URL}/{endpoint_id}/status/{job_id}"
    start_time = time.time()

    while True:
        elapsed = time.time() - start_time
        if elapsed > TIMEOUT_SECONDS:
            print(
                f"\nERROR: Timeout after {TIMEOUT_SECONDS}s ({TIMEOUT_SECONDS // 60} min)."
            )
            print("The job may still be running on RunPod.")
            print(f"Check status manually: GET {status_url}")
            sys.exit(1)

        time.sleep(POLL_INTERVAL_SECONDS)

        try:
            poll_response = requests.get(status_url, headers=headers, timeout=30)
            poll_data = poll_response.json()
        except Exception as e:
            print(f"  [{int(elapsed)}s] Poll error: {e}")
            continue

        status = poll_data.get("status", "UNKNOWN")
        print(f"  [{int(elapsed)}s] Status: {status}")

        if status == "COMPLETED":
            output = poll_data.get("output", {})
            print()
            print("=" * 50)
            print("JOB COMPLETED")
            print("=" * 50)
            print()
            print(json.dumps(output, indent=2))

            # Save result
            os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
            with open(OUTPUT_FILE, "w") as f:
                json.dump(output, f, indent=2)
            print(f"\nResult saved to: {OUTPUT_FILE}")
            sys.exit(0)

        elif status == "FAILED":
            error = poll_data.get("error", "Unknown error")
            print()
            print("=" * 50)
            print("JOB FAILED")
            print("=" * 50)
            print(f"Error: {error}")
            if "output" in poll_data:
                print(f"Output: {json.dumps(poll_data['output'], indent=2)}")
            sys.exit(1)

        # IN_QUEUE, IN_PROGRESS — keep polling


if __name__ == "__main__":
    main()
