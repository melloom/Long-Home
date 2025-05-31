export default function RebuttalCard({ title, response }) {
  return (
    <div className="bg-white border rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
      <h3 className="font-semibold text-gray-900 text-lg mb-3">{title}</h3>
      <p className="text-gray-700 leading-relaxed">{response}</p>
    </div>
  );
}