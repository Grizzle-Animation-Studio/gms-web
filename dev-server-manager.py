import tkinter as tk
from tkinter import ttk, scrolledtext
import subprocess
import threading
import os
import queue

class DevServerManager:
    def __init__(self, root):
        self.root = root
        self.root.title("Dev Server Manager - Port 3000")
        self.root.geometry("600x400")
        
        self.process = None
        self.output_queue = queue.Queue()
        # Always use the gms-web directory
        self.project_dir = r"c:\Users\Mac D Part Deux\.gemini\antigravity\playground\scarlet-supernova\gms-web"
        
        # Create UI
        self.create_widgets()
        
        # Start checking queue for output
        self.check_output_queue()
        
    def create_widgets(self):
        # Status label
        self.status_label = tk.Label(
            self.root, 
            text="Server Status: Not Running", 
            font=("Arial", 12, "bold"),
            fg="red"
        )
        self.status_label.pack(pady=10)
        
        # Button frame
        button_frame = tk.Frame(self.root)
        button_frame.pack(pady=10)
        
        # Kill button
        self.kill_btn = tk.Button(
            button_frame,
            text="🛑 Kill Server",
            command=self.kill_server,
            bg="#ff4444",
            fg="white",
            font=("Arial", 10, "bold"),
            padx=20,
            pady=10,
            width=15
        )
        self.kill_btn.pack(side=tk.LEFT, padx=5)
        
        # Start button
        self.start_btn = tk.Button(
            button_frame,
            text="▶️ Start Server",
            command=self.start_server,
            bg="#44ff44",
            fg="black",
            font=("Arial", 10, "bold"),
            padx=20,
            pady=10,
            width=15
        )
        self.start_btn.pack(side=tk.LEFT, padx=5)
        
        # Restart button
        self.restart_btn = tk.Button(
            button_frame,
            text="🔄 Restart Server",
            command=self.restart_server,
            bg="#4444ff",
            fg="white",
            font=("Arial", 10, "bold"),
            padx=20,
            pady=10,
            width=15
        )
        self.restart_btn.pack(side=tk.LEFT, padx=5)
        
        # Output console
        console_label = tk.Label(self.root, text="Server Output:", font=("Arial", 10))
        console_label.pack(pady=(10, 5))
        
        self.console = scrolledtext.ScrolledText(
            self.root,
            height=15,
            bg="black",
            fg="lightgreen",
            font=("Consolas", 9)
        )
        self.console.pack(fill=tk.BOTH, expand=True, padx=10, pady=5)
        
    def log(self, message, color="lightgreen"):
        """Add message to console (safe to call from any thread via queue)"""
        self.console.insert(tk.END, f"{message}\n", color)
        self.console.see(tk.END)
        
    def update_status(self, text, color):
        """Update status label (call from main thread only)"""
        self.status_label.config(text=text, fg=color)
        
    def check_output_queue(self):
        """Check queue for messages from background threads"""
        try:
            while True:
                msg_type, data = self.output_queue.get_nowait()
                
                if msg_type == "log":
                    message, color = data
                    self.log(message, color)
                elif msg_type == "status":
                    text, color = data
                    self.update_status(text, color)
                    
        except queue.Empty:
            pass
        
        # Check again in 100ms
        self.root.after(100, self.check_output_queue)
        
    def queue_log(self, message, color="lightgreen"):
        """Queue a log message (thread-safe)"""
        self.output_queue.put(("log", (message, color)))
        
    def queue_status(self, text, color):
        """Queue a status update (thread-safe)"""
        self.output_queue.put(("status", (text, color)))
        
    def kill_server(self):
        self.log("🛑 Killing server on port 3000...")
        
        # First, kill the tracked process if it exists
        if self.process and self.process.poll() is None:
            try:
                self.process.terminate()
                self.process.wait(timeout=3)
                self.log("✅ Terminated tracked process")
            except:
                # Force kill if terminate doesn't work
                try:
                    self.process.kill()
                    self.log("✅ Force-killed tracked process")
                except:
                    pass
        self.process = None
        
        try:
            # Windows command to find and kill process on port 3000
            result = subprocess.run(
                'netstat -ano | findstr :3000',
                shell=True,
                capture_output=True,
                text=True
            )
            
            if result.stdout:
                lines = result.stdout.strip().split('\n')
                pids = set()
                for line in lines:
                    if 'LISTENING' in line or 'ESTABLISHED' in line:
                        parts = line.split()
                        if parts:
                            pid = parts[-1]
                            if pid.isdigit():
                                pids.add(pid)
                
                for pid in pids:
                    try:
                        subprocess.run(f'taskkill /F /PID {pid}', shell=True, check=True, 
                                     capture_output=True)
                        self.log(f"✅ Killed process {pid}")
                    except:
                        pass
                        
                self.update_status("Server Status: Stopped", "red")
                self.log("✅ Server stopped successfully")
            else:
                self.log("ℹ️ No server running on port 3000")
                self.update_status("Server Status: Not Running", "gray")
                
        except Exception as e:
            self.log(f"❌ Error: {str(e)}", "red")
            
    def start_server(self):
        if self.process and self.process.poll() is None:
            self.log("⚠️ Server is already running!")
            return
            
        self.log("▶️ Starting dev server...")
        self.update_status("Server Status: Starting...", "orange")
        
        # Delete stale lock file if it exists
        lock_file = os.path.join(self.project_dir, ".next", "dev", "lock")
        if os.path.exists(lock_file):
            try:
                os.remove(lock_file)
                self.log("🗑️ Removed stale lock file")
            except Exception as e:
                self.log(f"⚠️ Could not remove lock file: {e}", "yellow")
        
        def run_server():
            try:
                # Use cwd parameter to set working directory - avoids quoting issues with spaces
                self.process = subprocess.Popen(
                    ["cmd", "/c", "npm", "run", "dev"],
                    cwd=self.project_dir,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.STDOUT,
                    text=True,
                    encoding='utf-8',  # Use UTF-8 encoding
                    errors='replace',  # Replace characters that can't be decoded
                    bufsize=1
                )
                
                # Update status (thread-safe via queue)
                self.queue_status("Server Status: Running", "green")
                self.queue_log("✅ Server started on http://localhost:3000")
                
                # Stream output (non-blocking for GUI)
                for line in self.process.stdout:
                    line = line.rstrip()
                    if line:  # Only log non-empty lines
                        self.queue_log(line)
                        if "Ready" in line or "compiled" in line:
                            self.queue_status("Server Status: Ready ✓", "green")
                
                # Process ended
                self.queue_log("⚠️ Server process ended", "yellow")
                self.queue_status("Server Status: Stopped", "red")
                        
            except Exception as e:
                self.queue_log(f"❌ Error starting server: {str(e)}", "red")
                self.queue_status("Server Status: Error", "red")
                
        thread = threading.Thread(target=run_server, daemon=True)
        thread.start()
        
    def restart_server(self):
        self.log("🔄 Restarting server...")
        self.kill_server()
        self.root.after(2000, self.start_server)  # Wait 2 seconds before starting
        
    def on_closing(self):
        if self.process and self.process.poll() is None:
            self.kill_server()
        self.root.destroy()

if __name__ == "__main__":
    root = tk.Tk()
    app = DevServerManager(root)
    root.protocol("WM_DELETE_WINDOW", app.on_closing)
    root.mainloop()
