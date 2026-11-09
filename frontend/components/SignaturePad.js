import { useRef } from "react";

// ช่องลงลายเซ็นด้วย <canvas> ใช้ได้ทั้งเมาส์และนิ้ว (pointer events)
// วาดเสร็จแต่ละเส้นจะเรียก onChange(dataURL รูป PNG), กดล้างจะได้ ""
export default function SignaturePad({ onChange }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);

  // ตำแหน่งเมาส์/นิ้ว -> พิกัดบน canvas (canvas อาจถูกย่อตามขนาดจอ)
  const point = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) * canvas.width) / rect.width,
      y: ((e.clientY - rect.top) * canvas.height) / rect.height,
    };
  };

  const start = (e) => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#1e3a8a";
    const p = point(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    drawing.current = true;
  };

  const move = (e) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current.getContext("2d");
    const p = point(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  };

  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    onChange(canvasRef.current.toDataURL("image/png"));
  };

  const clear = () => {
    const canvas = canvasRef.current;
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    onChange("");
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={500}
        height={160}
        className="border border-base-300 rounded-box bg-white w-full max-w-md touch-none cursor-crosshair"
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
      />
      <button type="button" className="btn btn-xs mt-1" onClick={clear}>
        ล้างลายเซ็น
      </button>
    </div>
  );
}
