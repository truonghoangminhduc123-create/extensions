(function (Scratch) {
  'use strict';

  // Helper to translate strings
  const formatMessage = (id, defaultText) => {
    return Scratch.translate({
      id: id,
      default: defaultText
    });
  };

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
        name: formatMessage('name', 'Min Duc Cloud Elite'),
        color1: '#0052ff',
        color2: '#003eb3',
        blocks: [
          {
            opcode: 'connect',
            blockType: Scratch.BlockType.COMMAND,
            text: formatMessage('connect', 'Connect to Project [ID]'),
            arguments: { ID: { type: Scratch.ArgumentType.STRING, defaultValue: 'lobby' } }
          },
          {
            opcode: 'disconnect',
            blockType: Scratch.BlockType.COMMAND,
            text: formatMessage('disconnect', 'Disconnect')
          },
          '---',
          {
            opcode: 'getVar',
            blockType: Scratch.BlockType.REPORTER,
            text: formatMessage('getVar', 'Get [KEY]'),
            arguments: { KEY: { type: Scratch.ArgumentType.STRING, defaultValue: 'score' } }
          },
          {
            opcode: 'setVar',
            blockType: Scratch.BlockType.REPORTER,
            text: formatMessage('setVar', 'Set [KEY] to [VAL]'),
            arguments: {
              KEY: { type: Scratch.ArgumentType.STRING, defaultValue: 'hp' },
              VAL: { type: Scratch.ArgumentType.STRING, defaultValue: '100' }
            }
          },
          {
            opcode: 'listVars',
            blockType: Scratch.BlockType.REPORTER,
            text: formatMessage('listVars', 'List All Variables')
          },
          {
            opcode: 'clearProject',
            blockType: Scratch.BlockType.REPORTER,
            text: formatMessage('clearProject', 'Clear All Data (Wipe)')
          },
          '---',
          {
            opcode: 'readStatus',
            blockType: Scratch.BlockType.REPORTER,
            text: formatMessage('status', 'Connection Status')
          },
          {
            opcode: 'readProject',
            blockType: Scratch.BlockType.REPORTER,
            text: formatMessage('project', 'Current Project')
          },
          {
            opcode: 'getGuide',
            blockType: Scratch.BlockType.REPORTER,
            text: formatMessage('guide', 'How to use? (Tutorial)')
          }
        ]
      };
    }

    async connect(args) {
      this.disconnect();
      const id = args.ID;
      const url = `wss://tuhbooh-cloudvariable.hf.space/api/${id}`;

      // SECURITY CHECK REQUIRED BY TURBOWARP
      if (!(await Scratch.canFetch(url))) {
        this.status = 'Permission Denied';
        return;
      }

      // eslint-disable-next-line extension/check-can-fetch
      this.ws = new WebSocket(url);
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

      this.ws.onerror = () => {
        this.status = 'Connection Error';
      };
    }

    disconnect() {
      if (this.ws) {
        this.ws.onclose = () => {};
        this.ws.close();
        this.ws = null;
      }
      this.status = 'Disconnected';
      this.projectName = 'None';
      for (const [resolve, timeout] of this.resolveMap) {
        clearTimeout(timeout);
        resolve('DISCONNECTED');
      }
      this.resolveMap.clear();
    }

    async _request(msg) {
      if (!this.ws || this.ws.readyState !== 1) return 'OFFLINE';

      const response = await new Promise((resolve) => {
        const timeout = setTimeout(() => {
          this.resolveMap.delete(resolve);
          resolve('TIMEOUT');
        }, 3000);

        this.resolveMap.set(resolve, timeout);
        this.ws.send(msg);
      });
      return response;
    }

    async getVar(args) {
      return await this._request(`GET||${args.KEY}`);
    }
    async setVar(args) {
      return await this._request(`SET||${args.KEY}||${args.VAL}`);
    }
    async listVars() {
      return await this._request(`LIST`);
    }
    async clearProject() {
      return await this._request(`CLEAR`);
    }

    readStatus() {
      return this.status;
    }
    readProject() {
      return this.projectName;
    }

    getGuide() {
      return '1. Connect with ID. 2. Wait for Connected status. 3. Use round blocks to get/set data.';
    }
  }

  Scratch.extensions.register(new MinhDucCloudElite());
})(Scratch);

