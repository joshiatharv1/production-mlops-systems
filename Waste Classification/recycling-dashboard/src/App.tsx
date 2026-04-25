export default function SmartRecyclingDashboard() {
  const stats = {
    totalProcessed: 1248,
    metal: 412,
    plastic: 563,
    glass: 273,
    errorRate: '2.3%'
  };

  const recentDetections = [
    { id: 1, file: 'waste_001.jpg', material: 'Metal', confidence: '94%', time: '2 min ago' },
    { id: 2, file: 'waste_002.jpg', material: 'Plastic', confidence: '89%', time: '5 min ago' },
    { id: 3, file: 'waste_003.jpg', material: 'Glass', confidence: '91%', time: '8 min ago' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Smart Recycling Vision Dashboard</h1>
          <p className="text-gray-500">Real-time recyclable material analytics</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[
            ['Total Processed', stats.totalProcessed],
            ['Metal', stats.metal],
            ['Plastic', stats.plastic],
            ['Glass', stats.glass],
            ['Error Rate', stats.errorRate]
          ].map(([label, value]) => (
            <div key={label} className="bg-white rounded-2xl shadow p-5">
              <p className="text-sm text-gray-500">{label}</p>
              <p className="text-2xl font-semibold mt-2">{value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Upload Waste Image</h2>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center">
              <p className="text-gray-500">Drag & drop image here or click to upload</p>
              <button className="mt-4 px-4 py-2 bg-black text-white rounded-xl hover:bg-gray-800">
                Choose File
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Detection Preview</h2>
            <div className="aspect-square bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
              Bounding Box Preview Area
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Detections</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b text-gray-500 text-sm">
                  <th className="pb-3">File</th>
                  <th className="pb-3">Material</th>
                  <th className="pb-3">Confidence</th>
                  <th className="pb-3">Processed</th>
                </tr>
              </thead>
              <tbody>
                {recentDetections.map((item) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="py-3">{item.file}</td>
                    <td className="py-3">{item.material}</td>
                    <td className="py-3">{item.confidence}</td>
                    <td className="py-3">{item.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
