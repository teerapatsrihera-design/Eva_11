// กล่อง modal ของ DaisyUI แสดงเมื่อถูก render (ปิดโดยให้หน้าแม่เลิก render)
export default function Modal({ title, onClose, children }) {
  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-2">{title}</h3>
        {children}
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  );
}
