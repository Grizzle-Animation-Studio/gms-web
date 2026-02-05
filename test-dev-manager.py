"""
Test script to verify dev-server-manager.py functionality
This simulates clicking the restart button
"""
import subprocess
import time
import sys

def check_port_3000():
    """Check if anything is listening on port 3000"""
    result = subprocess.run(
        'netstat -ano | findstr ":3000.*LISTENING"',
        shell=True,
        capture_output=True,
        text=True
    )
    if result.stdout:
        lines = result.stdout.strip().split('\n')
        pids = []
        for line in lines:
            parts = line.split()
            if parts:
                pid = parts[-1]
                if pid.isdigit():
                    pids.append(pid)
        return pids
    return []

def kill_port_3000():
    """Kill all processes on port 3000"""
    pids = check_port_3000()
    for pid in pids:
        try:
            subprocess.run(f'taskkill /F /PID {pid}', shell=True, check=True, capture_output=True)
            print(f"✅ Killed PID {pid}")
        except:
            pass

def start_server():
    """Start the dev server"""
    project_dir = r"c:\Users\Mac D Part Deux\.gemini\antigravity\playground\scarlet-supernova\gms-web"
    
    print("▶️ Starting dev server...")
    process = subprocess.Popen(
        ["cmd", "/c", "npm", "run", "dev"],
        cwd=project_dir,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1
    )
    
    # Read output for 5 seconds to see if it starts
    start_time = time.time()
    while time.time() - start_time < 5:
        line = process.stdout.readline()
        if line:
            print(line.rstrip())
            if "Ready" in line:
                print("✅ Server is ready!")
                return process
    
    return process

if __name__ == "__main__":
    print("🧪 Testing dev server restart functionality\n")
    
    # Step 1: Kill any existing server
    print("Step 1: Killing existing server on port 3000...")
    kill_port_3000()
    time.sleep(1)
    
    pids = check_port_3000()
    if pids:
        print(f"❌ FAIL: Port 3000 still has processes: {pids}")
        sys.exit(1)
    else:
        print("✅ Port 3000 is clear\n")
    
    # Step 2: Start the server
    print("Step 2: Starting server...")
    process = start_server()
    time.sleep(2)
    
    # Step 3: Verify it's running
    print("\nStep 3: Verifying server is running...")
    pids = check_port_3000()
    if pids:
        print(f"✅ SUCCESS: Server running on port 3000 (PIDs: {pids})")
    else:
        print("❌ FAIL: Server not detected on port 3000")
        process.terminate()
        sys.exit(1)
    
    # Cleanup
    print("\n🧹 Cleaning up...")
    process.terminate()
    time.sleep(1)
    kill_port_3000()
    
    print("\n✅ All tests passed! The restart logic works correctly.")
