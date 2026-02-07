import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { initWasm } from './services/wasmLoader';

// Hide the initial splash screen - exported so App can call it when truly ready
export function hideSplash() {
  const splash = document.getElementById('splash');
  if (splash) {
    splash.classList.add('hidden');
    setTimeout(() => splash.remove(), 300);
  }
}

async function init() {
  try {
    // Initialize WASM module
    await initWasm();

    // Render the app - splash stays visible until App signals it's ready
    ReactDOM.createRoot(document.getElementById('root')!).render(
      <App />
    );
  } catch (error) {
    console.error('Failed to initialize app:', error);
    hideSplash();
    document.getElementById('root')!.innerHTML = `
      <div style="color: #b03c3c; padding: 20px; text-align: center; background: #000; min-height: 100vh; display: flex; flex-direction: column; justify-content: center; font-family: 'Press Start 2P', monospace; font-size: 10px; line-height: 20px;">
        <p>GAME OVER</p>
        <p style="margin-top: 16px; color: #6c6c6c;">FAILED TO LOAD CARTRIDGE</p>
        <p style="margin-top: 8px; color: #404040;">PRESS RESET TO TRY AGAIN</p>
      </div>
    `;
  }
}

init();
