import sys
import subprocess

def free_port(port=8000):
    try:
        output = subprocess.check_output(f"netstat -ano | findstr :{port}", shell=True).decode()
        pids = set()
        for line in output.strip().split("\n"):
            parts = line.strip().split()
            if len(parts) >= 5 and "LISTENING" in parts:
                pids.add(parts[-1])
        for pid in pids:
            try:
                print(f"Killing process {pid} on port {port}...")
                subprocess.call(f"taskkill /F /PID {pid}", shell=True)
            except Exception as e:
                print(e)
    except Exception:
        print(f"Port {port} is free.")

if __name__ == "__main__":
    port_to_kill = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    free_port(port_to_kill)
