import 'dotenv/config';
import WebSocket from 'ws';
import { spawn } from 'child_process';
import path from 'path';

const RELAY_API_KEY = process.env.RELAY_API_KEY;
const API_URL = process.env.API_URL || 'http://localhost:3001';
const WS_URL = API_URL.replace(/^http/, 'ws');

// Path to the python runner script
const RUNNER_SCRIPT = '/home/bulut/.openclaw/workspace/skills/relay-task-runner.py';

if (!RELAY_API_KEY) {
  console.error('FATAL: RELAY_API_KEY is missing.');
  process.exit(1);
}

console.log('Worker starting...');
console.log(`Connecting to ${WS_URL}/ws?apiKey=...`);

const processedTasks = new Set<string>();

function connect() {
  const ws = new WebSocket(`${WS_URL}/ws?apiKey=${RELAY_API_KEY}`);

  ws.on('open', () => {
    console.log('Connected to Relay WebSocket');
  });

  ws.on('message', async (data) => {
    try {
      const msg = JSON.parse(data.toString());
      
      // Handle task_update (new tasks created via API)
      if (msg.type === 'task_update') {
        const task = msg.data;
        // Process new tasks in 'inbox' status
        if (task.status === 'inbox' && !processedTasks.has(task.id)) {
            console.log(`New task detected: ${task.title} (${task.id})`);
            processedTasks.add(task.id);
            runTask(task.id);
        }
      }
      
      // Handle system.broadcast (explicit broadcast events)
      if (msg.type === 'event' && msg.data?.type === 'system.broadcast') {
          const payload = msg.data.payload;
          if (payload && payload.taskId) {
             if (!processedTasks.has(payload.taskId)) {
                 console.log(`Broadcast received: ${payload.title} (${payload.taskId})`);
                 processedTasks.add(payload.taskId);
                 runTask(payload.taskId);
             }
          }
      }

    } catch (e) {
      console.error('Error processing message:', e);
    }
  });

  ws.on('close', () => {
    console.log('Disconnected. Reconnecting in 5s...');
    setTimeout(connect, 5000);
  });

  ws.on('error', (err) => {
    console.error('WebSocket error:', err);
  });
}

function runTask(taskId: string) {
    console.log(`Spawning runner for task ${taskId}...`);
    
    // Assign to a default agent if not specified (Orchestrator decides)
    // For now, let's use 'personal-psychologist' as the default worker for broad tasks,
    // or 'main' (me) if it's coordination.
    // Ideally, we'd have a router. Let's use 'personal-psychologist' for this demo.
    const agentId = 'personal_psychologist';

    const runner = spawn('python3', ['-u', RUNNER_SCRIPT, taskId, agentId]);

    runner.stdout.on('data', (data) => {
        console.log(`[Runner ${taskId}] stdout: ${data}`);
    });

    runner.stderr.on('data', (data) => {
        console.error(`[Runner ${taskId}] stderr: ${data}`);
    });

    runner.on('close', (code) => {
        console.log(`Runner process exited with code ${code}`);
    });
}

connect();
