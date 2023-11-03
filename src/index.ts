async function main() {
  console.log("hello world");

  // WebGPUサポートチェック
  if (!navigator.gpu) {
    throw new Error("WebGPU not supported no this browser.");
  }

  const canvas = document.querySelector("canvas")as HTMLCanvasElement | null;
  canvas.width = 720;
  canvas.height = 480;

  // アダプタ取得
  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
    throw new Error("No appropriate GPUAdapter found.");
  }
  // デバイス取得
  const device = await adapter.requestDevice();
  // キャンバス設定
  const context = canvas.getContext("webgpu");
  const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
  context.configure({
    device: device,
    format: canvasFormat,
  });

  // キャンバスクリア
  const encoder = device.createCommandEncoder();
  const pass = encoder.beginRenderPass({
    colorAttachments: [
      {
        view: context.getCurrentTexture().createView(),
        loadOp: "clear",
        clearValue: { r: 0, g: 0, b: 0.4, a: 1 },
        storeOp: "store",
      },
    ],
  });

  pass.end();
  // Finish the command buffer and immediately submit it.
  const commandBuffer = encoder.finish();
  device.queue.submit([commandBuffer]);
}

window.onload = main;
