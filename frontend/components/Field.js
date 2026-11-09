// ช่องกรอก: ป้ายชื่อ + input + ข้อความ error
export default function Field({ label, error, children }) {
  return (
    <fieldset className="fieldset">
      <legend className="fieldset-legend">{label}</legend>
      {children}
      {error && <p className="text-error text-sm">{error.message}</p>}
    </fieldset>
  );
}
