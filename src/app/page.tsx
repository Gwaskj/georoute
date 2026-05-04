export default function HomePage() {
  return (
    <div className="p-10">
      <h1 className="text-4xl font-bold text-blue-600">GeoRoute</h1>

      <p className="mt-4 text-lg text-gray-700">
        Welcome to your scheduling and routing dashboard.
      </p>

      <div className="mt-8 space-y-4">
        <p className="text-gray-600">
          Use the admin panel to manage staff, appointments, schedules, and
          route visualisation.
        </p>

        <p className="text-gray-600">
          This is your main landing page. You can customise it however you like.
        </p>
      </div>
    </div>
  );
}
