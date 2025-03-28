const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const winston = require('winston');
const axios = require('axios');

// Initialize logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'python-bridge' },
  transports: [
    new winston.transports.File({ filename: 'logs/python-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/python-combined.log' }),
    new winston.transports.Console({ format: winston.format.simple() })
  ],
});

// Make sure logs directory exists
if (!fs.existsSync('logs')) {
  fs.mkdirSync('logs');
}

// Initialize Express app
const app = express();

// Apply middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Track running Python processes
const runningProcesses = {};

// Check if Python is installed
const checkPythonInstallation = () => {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn('python', ['--version']);
    
    pythonProcess.stdout.on('data', (data) => {
      logger.info(`Python installed: ${data.toString().trim()}`);
      resolve(true);
    });
    
    pythonProcess.stderr.on('data', (data) => {
      logger.warn(`Python check stderr: ${data.toString().trim()}`);
    });
    
    pythonProcess.on('error', (error) => {
      logger.error(`Python not found: ${error.message}`);
      resolve(false);
    });
    
    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        logger.warn(`Python check process exited with code ${code}`);
        resolve(false);
      }
    });
  });
};

// Install Python dependencies
const installDependencies = () => {
  return new Promise((resolve, reject) => {
    logger.info('Installing Python dependencies...');
    
    // Check if requirements.txt exists
    if (!fs.existsSync('requirements.txt')) {
      // Create a basic requirements.txt if it doesn't exist
      fs.writeFileSync('requirements.txt', 'streamlit==1.34.0\nopenai==1.16.0\npandas==2.2.0\n');
    }
    
    const pipProcess = spawn('pip', ['install', '-r', 'requirements.txt']);
    
    pipProcess.stdout.on('data', (data) => {
      logger.info(`pip stdout: ${data.toString().trim()}`);
    });
    
    pipProcess.stderr.on('data', (data) => {
      logger.warn(`pip stderr: ${data.toString().trim()}`);
    });
    
    pipProcess.on('error', (error) => {
      logger.error(`pip error: ${error.message}`);
      reject(error);
    });
    
    pipProcess.on('close', (code) => {
      if (code === 0) {
        logger.info('Python dependencies installed successfully');
        resolve();
      } else {
        logger.error(`pip process exited with code ${code}`);
        reject(new Error(`pip process exited with code ${code}`));
      }
    });
  });
};

// Create a basic Python script if it doesn't exist
const createPythonScripts = () => {
  // Create deep_research_openai.py if it doesn't exist
  if (!fs.existsSync('deep_research_openai.py')) {
    const scriptContent = `
import streamlit as st
import pandas as pd
import openai
import os
import json
from datetime import datetime

# Set page configuration
st.set_page_config(page_title="XII-OS Deep Research", layout="wide")

# Initialize OpenAI client (will use API key from environment)
try:
    openai.api_key = os.environ.get("OPENAI_API_KEY")
except Exception as e:
    st.error(f"Error initializing OpenAI: {e}")

# Application title
st.title("XII-OS Deep Research")
st.markdown("Powered by OpenAI and Streamlit")

# Sidebar for options
with st.sidebar:
    st.header("Research Options")
    model = st.selectbox("Select AI Model", ["gpt-4o", "gpt-4", "gpt-3.5-turbo"])
    temperature = st.slider("Temperature", 0.0, 1.0, 0.7, 0.1)
    max_tokens = st.slider("Max Tokens", 100, 4000, 1500, 100)
    
    st.markdown("---")
    st.markdown("### About")
    st.markdown("This tool performs deep research using OpenAI models.")
    st.markdown("Data is retrieved from custom knowledge bases.")

# Main content
query = st.text_area("Enter your research query:", height=100)

# Advanced options
with st.expander("Advanced Options"):
    search_depth = st.select_slider("Search Depth", options=["Basic", "Standard", "Deep", "Comprehensive"])
    include_citations = st.checkbox("Include Citations", value=True)
    
    col1, col2 = st.columns(2)
    with col1:
        domains = st.multiselect("Limit to Domains", ["Tennis", "Sports", "Rules", "History", "Statistics"])
    with col2:
        date_range = st.date_input("Date Range", 
                                 [datetime(2000, 1, 1), datetime.now()])

if st.button("Start Research"):
    if not query:
        st.warning("Please enter a research query.")
    else:
        with st.spinner("Researching..."):
            # This would be replaced with actual OpenAI call
            try:
                st.session_state.results = {
                    "query": query,
                    "model": model,
                    "timestamp": datetime.now().isoformat(),
                    "findings": [
                        {
                            "title": "Sample Research Finding 1",
                            "content": "This is what would be returned from the AI model...",
                            "relevance": 0.95,
                            "source": "Sample Database"
                        },
                        {
                            "title": "Sample Research Finding 2",
                            "content": "More information that would be returned...",
                            "relevance": 0.82,
                            "source": "Sample Database"
                        }
                    ]
                }
                
                # Return results
                st.success("Research complete!")
                
                # Display results
                for idx, finding in enumerate(st.session_state.results["findings"]):
                    with st.expander(f"{finding['title']} (Relevance: {finding['relevance']})"):
                        st.markdown(finding["content"])
                        st.caption(f"Source: {finding['source']}")
                
                # Export option
                if st.download_button("Export Results as JSON", 
                                    data=json.dumps(st.session_state.results, indent=2),
                                    file_name="research_results.json",
                                    mime="application/json"):
                    st.balloons()
                    
            except Exception as e:
                st.error(f"Error during research: {e}")

# Footer
st.markdown("---")
st.markdown("XII-OS Deep Research | Tennis Tiebreaker System")
`;
    
    fs.writeFileSync('deep_research_openai.py', scriptContent);
    logger.info('Created deep_research_openai.py file');
  }
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'python-bridge',
    pythonScripts: fs.existsSync('deep_research_openai.py') ? ['deep_research_openai.py'] : [],
    runningProcesses: Object.keys(runningProcesses)
  });
});

// Start Streamlit app
app.post('/streamlit/start', async (req, res) => {
  const { script = 'deep_research_openai.py', port = 8501 } = req.body;
  
  // Check if process is already running
  if (runningProcesses[script]) {
    return res.json({
      status: 'running',
      script,
      port,
      pid: runningProcesses[script].pid,
      url: `http://localhost:${port}`
    });
  }
  
  // Check if script exists
  if (!fs.existsSync(script)) {
    return res.status(404).json({ error: `Script not found: ${script}` });
  }
  
  try {
    // Check Python installation
    const pythonInstalled = await checkPythonInstallation();
    if (!pythonInstalled) {
      return res.status(500).json({ error: 'Python is not installed or not in PATH' });
    }
    
    // Install dependencies
    await installDependencies();
    
    // Start Streamlit
    logger.info(`Starting Streamlit app with script: ${script} on port ${port}`);
    
    const streamlitProcess = spawn('streamlit', ['run', script, '--server.port', port.toString()]);
    
    runningProcesses[script] = {
      process: streamlitProcess,
      pid: streamlitProcess.pid,
      startTime: new Date(),
      port
    };
    
    streamlitProcess.stdout.on('data', (data) => {
      logger.info(`Streamlit stdout: ${data.toString().trim()}`);
    });
    
    streamlitProcess.stderr.on('data', (data) => {
      logger.warn(`Streamlit stderr: ${data.toString().trim()}`);
    });
    
    streamlitProcess.on('error', (error) => {
      logger.error(`Streamlit error: ${error.message}`);
      delete runningProcesses[script];
    });
    
    streamlitProcess.on('close', (code) => {
      logger.info(`Streamlit process exited with code ${code}`);
      delete runningProcesses[script];
    });
    
    // Wait for Streamlit to start
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    res.json({
      status: 'started',
      script,
      port,
      pid: streamlitProcess.pid,
      url: `http://localhost:${port}`
    });
  } catch (error) {
    logger.error(`Error starting Streamlit: ${error.message}`);
    res.status(500).json({ error: `Failed to start Streamlit: ${error.message}` });
  }
});

// Stop Streamlit app
app.post('/streamlit/stop', (req, res) => {
  const { script = 'deep_research_openai.py' } = req.body;
  
  if (!runningProcesses[script]) {
    return res.status(404).json({ error: `No running process found for script: ${script}` });
  }
  
  try {
    // Kill the process
    const pid = runningProcesses[script].pid;
    process.kill(pid);
    
    logger.info(`Stopped Streamlit process for script: ${script} (PID: ${pid})`);
    
    delete runningProcesses[script];
    
    res.json({
      status: 'stopped',
      script,
      pid
    });
  } catch (error) {
    logger.error(`Error stopping Streamlit: ${error.message}`);
    res.status(500).json({ error: `Failed to stop Streamlit: ${error.message}` });
  }
});

// List running Streamlit apps
app.get('/streamlit/list', (req, res) => {
  const processes = Object.entries(runningProcesses).map(([script, data]) => ({
    script,
    pid: data.pid,
    port: data.port,
    startTime: data.startTime,
    url: `http://localhost:${data.port}`,
    uptime: Math.floor((new Date() - data.startTime) / 1000) // in seconds
  }));
  
  res.json({ processes });
});

// Execute Python script and return result
app.post('/python/exec', (req, res) => {
  const { script, args = [], input = null } = req.body;
  
  if (!script) {
    return res.status(400).json({ error: 'Script is required' });
  }
  
  // Create a temporary file if script is inline
  let scriptPath;
  let tempFile = false;
  
  if (script.includes('\n')) {
    // This is inline script content
    tempFile = true;
    scriptPath = path.join(os.tmpdir(), `xii-os-temp-${Date.now()}.py`);
    fs.writeFileSync(scriptPath, script);
  } else {
    // This is a script file name
    scriptPath = script;
    if (!fs.existsSync(scriptPath)) {
      return res.status(404).json({ error: `Script not found: ${scriptPath}` });
    }
  }
  
  const pythonProcess = spawn('python', [scriptPath, ...args]);
  
  if (input) {
    pythonProcess.stdin.write(input);
    pythonProcess.stdin.end();
  }
  
  let outputData = '';
  let errorData = '';
  
  pythonProcess.stdout.on('data', (data) => {
    outputData += data.toString();
  });
  
  pythonProcess.stderr.on('data', (data) => {
    errorData += data.toString();
    logger.warn(`Python stderr: ${data.toString().trim()}`);
  });
  
  pythonProcess.on('error', (error) => {
    logger.error(`Python error: ${error.message}`);
    res.status(500).json({ error: `Python error: ${error.message}` });
  });
  
  pythonProcess.on('close', (code) => {
    // Clean up temp file if created
    if (tempFile && fs.existsSync(scriptPath)) {
      fs.unlinkSync(scriptPath);
    }
    
    if (code === 0) {
      // Try to parse output as JSON if possible
      try {
        const jsonOutput = JSON.parse(outputData);
        res.json({
          status: 'success',
          output: jsonOutput,
          code
        });
      } catch (e) {
        // Not JSON, return as string
        res.json({
          status: 'success',
          output: outputData,
          code
        });
      }
    } else {
      res.status(500).json({
        status: 'error',
        output: outputData,
        error: errorData,
        code
      });
    }
  });
});

// Initialize by creating required files
createPythonScripts();

// Start the server
const PORT = process.env.PYTHON_BRIDGE_PORT || 3005;

app.listen(PORT, () => {
  logger.info(`XII-OS Python Bridge running on port ${PORT}`);
  
  // Register with MCP server
  const mcpHost = process.env.MCP_HOST || 'localhost';
  const mcpPort = process.env.MCP_PORT || 3002;
  
  axios.post(`http://${mcpHost}:${mcpPort}/register`, {
    name: 'python-bridge',
    host: 'localhost',
    port: PORT,
    endpoints: ['/streamlit/start', '/streamlit/stop', '/streamlit/list', '/python/exec'],
    healthCheck: '/health'
  }).then(() => {
    logger.info('Registered with MCP server');
  }).catch(err => {
    logger.warn('Failed to register with MCP server', err.message);
  });
}); 