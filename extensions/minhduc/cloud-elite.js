(function (Scratch) {
  'use strict';

  class MinhDucCloudElite {
    constructor() {
      this.ws = null;
      this.status = 'Disconnected';
      this.projectName = 'None';
      this.resolveMap = new Map();
    }

    getInfo() {
      return {
        id: 'minhduccloudelite',
        name: 'Minh Duc Cloud Elite',
        color1: '#0052ff',
        color2: '#003eb3',
        blocks: [
          // CONNECTION CATEGORY
          {
            opcode: 'connect',
            blockType: Scratch.BlockType.COMMAND,
            text: 'Connect to Project [ID]',
            arguments: { ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'lobby' } }
          },
          {
            opcode: 'disconnect',
            blockType: Scratch.BlockType.COMMAND,
            text: 'Disconnect'
          },

          '---',

          // REPORTER ACTIONS (Wait for server response)
          {
            opcode: 'getVar',
            blockType: Scratch.BlockType.REPORTER,
            text: 'Get [KEY]',
            arguments: { KEY: { type: Scratch.ArgumentType.STRING, defaultValue: 'score' } }
          },
          {
            opcode: 'setVar',
            blockType: Scratch.BlockType.REPORTER,
            text: 'Set [KEY] to [VAL]',
            arguments: {
              KEY: { type: Scratch.ArgumentType.STRING, defaultValue: 'hp' },
              VAL: { type: Scratch.ArgumentType.STRING, defaultValue: '100' }
            }
          },
          {
            opcode: 'listVars',
            blockType: Scratch.BlockType.REPORTER,
            text: 'List All Variables'
          },
          {
            opcode: 'clearProject',
            blockType: Scratch.BlockType.REPORTER,
            text: 'Clear All Data (Wipe)'
          },

          '---',

          // MONITORING
          {
            opcode: 'readStatus',
            blockType: Scratch.BlockType.REPORTER,
            text: 'Connection Status'
          },
          {
            opcode: 'readProject',
            blockType: Scratch.BlockType.REPORTER,
            text: 'Current Project'
          },
          {
            opcode: 'getGuide',
            blockType: Scratch.BlockType.REPORTER,
            text: 'How to use? (Tutorial)'
          }
        ]
      };
    }

    // --- CORE LOGIC ---

    connect(args) {
      this.disconnect();
      const id = args.ID;
      this.ws = new WebSocket(`wss://tuhbooh-cloudvariable.hf.space/api/${id}`);
      this.status = 'Connecting...';

      this.ws.onopen = () => { 
        this.status = 'Connected'; 
        this.projectName = id;
      };
      
      this.ws.onmessage = (event) => {
        if (this.resolveMap.size > 0) {
          const firstResolve = this.resolveMap.keys().next().value;
          const timeout = this.resolveMap.get(firstResolve);
          clearTimeout(timeout);
          firstResolve(event.data);
          this.resolveMap.delete(firstResolve);
        }
      };

      this.ws.onclose = () => { 
        this.status = 'Disconnected'; 
        this.projectName = 'None';
        this.ws = null;
      };

      this.ws.onerror = () => { this.status = 'Connection Error'; };
    }

    disconnect() {
      if (this.ws) {
        this.ws.onclose = () => {};
        this.ws.close();
        this.ws = null;
      }
      this.status = 'Disconnected';
      this.projectName = 'None';
      for (let [resolve, timeout] of this.resolveMap) {
        clearTimeout(timeout);
        resolve("DISCONNECTED");
      }
      this.resolveMap.clear();
    }

    // --- ASYNC REQUEST HANDLER ---

    async _request(msg) {
      if (!this.ws || this.ws.readyState !== 1) return "OFFLINE";
      
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          this.resolveMap.delete(resolve);
          resolve("TIMEOUT");
        }, 3000); 

        this.resolveMap.set(resolve, timeout);
        this.ws.send(msg);
      });
    }

    async getVar(args) { return await this._request(`GET||${args.KEY}`); }
    async setVar(args) { return await this._request(`SET||${args.KEY}||${args.VAL}`); }
    async listVars() { return await this._request(`LIST`); }
    async clearProject() { return await this._request(`CLEAR`); }
    
    readStatus() { return this.status; }
    readProject() { return this.projectName; }

    getGuide() {
      return "Step 1: Use 'Connect' block with a Project ID. | Step 2: Check 'Connection Status', wait for 'Connected'. | Step 3: Use the ROUND blocks (Get/Set/List) inside a 'Say' or 'Set Variable' block to perform actions and get results instantly.";
    }
  }

  Scratch.extensions.register(new MinhDucCloudElite());
})(Scratch);
