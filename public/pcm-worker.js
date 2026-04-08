class PCMWorker extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 2048;
    this._buffer = new Float32Array(this.bufferSize);
    this._bytesWritten = 0;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (input.length > 0) {
      const channelData = input[0];
      if (channelData) {
        for (let i = 0; i < channelData.length; i++) {
          this._buffer[this._bytesWritten++] = channelData[i];
          if (this._bytesWritten >= this.bufferSize) {
            this.flush();
            this._bytesWritten = 0;
          }
        }
      }
    }
    return true;
  }

  flush() {
    // Convert Float32Array (-1.0 to 1.0) to Int16Array (-32768 to 32767)
    const pcm16 = new Int16Array(this.bufferSize);
    for (let i = 0; i < this.bufferSize; i++) {
      let s = Math.max(-1, Math.min(1, this._buffer[i]));
      pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    
    // We send back raw ArrayBuffer to main thread
    this.port.postMessage(pcm16.buffer, [pcm16.buffer]);
  }
}

registerProcessor('pcm-worker', PCMWorker);
