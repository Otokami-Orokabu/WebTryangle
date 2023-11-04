async function main() {
  console.log("hello world");

  // WebGPUサポートチェック
  if (!navigator.gpu) {
    throw new Error("WebGPU not supported no this browser.");
  }

  const canvas = document.querySelector("canvas") as HTMLCanvasElement | null;
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

  // 頂点を定義
  const vertices = new Float32Array([
    // X, Y
    -0.8, -0.8, // Triangle 1 (Blue)
    0.8, -0.8,
    0.8,  0.8,

   -0.8, -0.8, // Triangle 2 (Red)
    0.8,  0.8,
   -0.8,  0.8,
  ]);

  // 頂点バッファを作成
  const vertexBuffer = device.createBuffer({
    label: "Cell vertics",
    size: vertices.byteLength,
    usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
  });

  device.queue.writeBuffer(vertexBuffer, /*bufferOffset=*/ 0, vertices);
  // 頂点レイアウトを定義
  const vertexBufferLayout = {
    arrayStride: 8,
    attributes: [
      {
        format: "float32x2",
        offset: 0,
        shaderLocation: 0,  // Position, see vertex shader
      },
    ],
  } as GPUVertexBufferLayout;
  // シェーダを開始する
  // 頂点シェーダー
  const cellShaderModule = device.createShaderModule({
    label: "Cell shader",
    code: `
    @vertex
    fn vertexMain(@location(0) pos: vec2f) ->
      @builtin(position) vec4f {
      return vec4f(pos,0,1);
    }
    @fragment
    fn fragmentMain() ->
      @location(0) vec4f{
        return vec4f(1,0,0,1);
      }
    `
  });

  // レンダリングパイプラインを作成
  const cellPipeline = device.createRenderPipeline({
    label: "Cell pipeline",
    layout: "auto",
    vertex: {
      module: cellShaderModule,
      entryPoint: "vertexMain",
      buffers: [vertexBufferLayout],
    },
    fragment:{
      module: cellShaderModule,
      entryPoint: "fragmentMain",
      targets: [{
        format: canvasFormat
      }]
    }
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

  pass.setPipeline(cellPipeline);
  pass.setVertexBuffer(0, vertexBuffer);
  pass.draw(vertices.length / 2);

  pass.end();
  // Finish the command buffer and immediately submit it.
  const commandBuffer = encoder.finish();

  device.queue.submit([commandBuffer]);
}

window.onload = main;
