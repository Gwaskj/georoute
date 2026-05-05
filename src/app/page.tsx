import Header from "@/components/home/Header";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-5xl mx-auto px-6 py-16">
        <h1 className="text-5xl font-bold text-blue-600">GeoRoute</h1>

        <p className="mt-6 text-xl text-gray-700">
          Smart scheduling and route optimisation for your workforce.
        </p>

        <p className="mt-4 text-gray-600">
          Use the admin panel to manage staff, appointments, schedules, and
          route visualisation.
        </p>
      </main>
    </div>
  );
}
