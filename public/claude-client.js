/**
 * Claude AI Context Protocol Client
 * 
 * This file demonstrates how to interact with the Claude AI Context Protocol API.
 */

// Utility function to make API calls
async function callAPI(endpoint, method = 'GET', data = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  const response = await fetch(`/api/claude/${endpoint}`, options);
  return response.json();
}

// Create a new conversation context
async function createContext(contextId, systemPrompt) {
  const content = {
    system: systemPrompt,
    messages: []
  };
  
  return callAPI('context', 'POST', { context_id: contextId, content });
}

// Send a message to Claude
async function sendMessage(message, contextId = null) {
  const messages = [{ role: 'user', content: message }];
  
  const requestData = {
    messages,
    model: 'claude-3-opus-20240229',
    max_tokens: 1000,
    temperature: 0.7
  };
  
  if (contextId) {
    requestData.context_id = contextId;
  }
  
  return callAPI('chat', 'POST', requestData);
}

// Example usage:
// Initialize context for XII-OS transfer portal analysis
async function initializeTransferPortalAnalyst() {
  const contextId = 'transfer-portal-analyst';
  const systemPrompt = `
    You are an AI assistant specialized in analyzing college sports transfer portal data.
    
    Your capabilities include:
    1. Analyzing basketball and football transfer portal data
    2. Identifying trends in transfer patterns
    3. Comparing transfer classes across schools
    4. Providing insights on NIL valuations
    5. Analyzing the impact of transfers on team rosters
    
    Always provide concise, data-driven responses based on the transfer portal data in the XII-OS system.
  `;
  
  try {
    const result = await createContext(contextId, systemPrompt);
    console.log('Transfer Portal Analyst context created:', result);
    return contextId;
  } catch (error) {
    console.error('Error creating context:', error);
  }
}

// Example: Ask a question about basketball transfers
async function askAboutBasketballTransfers(contextId) {
  const question = "What are the top 5 basketball transfers by NIL value in the current portal?";
  
  try {
    const response = await sendMessage(question, contextId);
    console.log('Claude response:', response);
    
    // Display the response on the page
    const responseContainer = document.getElementById('claude-response');
    if (responseContainer) {
      responseContainer.textContent = response.content[0].text;
    }
  } catch (error) {
    console.error('Error sending message:', error);
  }
}

// Initialize UI elements after page load
document.addEventListener('DOMContentLoaded', () => {
  const initButton = document.getElementById('init-claude');
  const askButton = document.getElementById('ask-claude');
  let currentContextId = null;
  
  if (initButton) {
    initButton.addEventListener('click', async () => {
      initButton.disabled = true;
      initButton.textContent = 'Initializing...';
      
      currentContextId = await initializeTransferPortalAnalyst();
      
      initButton.textContent = 'Claude Context Initialized';
      askButton.disabled = false;
    });
  }
  
  if (askButton) {
    askButton.addEventListener('click', async () => {
      if (!currentContextId) {
        alert('Please initialize Claude context first');
        return;
      }
      
      askButton.disabled = true;
      askButton.textContent = 'Thinking...';
      
      await askAboutBasketballTransfers(currentContextId);
      
      askButton.disabled = false;
      askButton.textContent = 'Ask About Transfers';
    });
  }
}); 