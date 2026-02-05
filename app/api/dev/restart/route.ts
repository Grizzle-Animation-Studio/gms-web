import { exec } from 'child_process';
import { promisify } from 'util';
import { NextResponse } from 'next/server';

const execAsync = promisify(exec);

export async function POST() {
    // Only allow in development
    if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json({ error: 'Only available in development' }, { status: 403 });
    }

    try {
        console.log('🔄 Restarting dev server...');

        // Find process on port 3000
        const { stdout } = await execAsync('netstat -ano | findstr :3000');
        const lines = stdout.split('\n').filter(line => line.includes('LISTENING'));

        if (lines.length > 0) {
            const pidMatch = lines[0].match(/\s+(\d+)\s*$/);
            if (pidMatch) {
                const pid = pidMatch[1];
                console.log(`💀 Killing PID: ${pid}`);

                // Kill the process
                await execAsync(`taskkill /F /PID ${pid}`);

                // Wait a bit before restarting
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Start new dev server (this will be handled by the dev process manager)
                console.log('✅ Server killed, process manager will restart it');

                return NextResponse.json({
                    success: true,
                    message: 'Server restart initiated. Page will reload automatically.'
                });
            }
        }

        return NextResponse.json({ error: 'No server found on port 3000' }, { status: 404 });
    } catch (error) {
        console.error('❌ Restart failed:', error);
        return NextResponse.json({
            error: 'Failed to restart server',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
