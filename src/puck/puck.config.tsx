import MapVisualizer from "../components/puck/MapVisualizer.client";
import StaffSelector from "../components/puck/StaffSelector";
import ScheduleTable from "../components/puck/ScheduleTable";
import GenerateSchedule from "../components/puck/GenerateSchedule";
import RouteSummary from "../components/puck/RouteSummary";

export const puckConfig = {
  components: {
    MapVisualizer: {
      fields: {
        zoom: { type: "number", label: "Zoom Level", defaultValue: 12 },
        showRoutes: { type: "boolean", label: "Show Routes", defaultValue: true },
      },
      render: ({ zoom, showRoutes }) => (
        <MapVisualizer zoom={zoom} showRoutes={showRoutes} />
      ),
    },

    StaffSelector: {
      fields: {
        title: { type: "text", label: "Title", defaultValue: "Select Staff" },
      },
      render: ({ title }) => <StaffSelector title={title} />,
    },

    ScheduleTable: {
      fields: {
        showTimes: { type: "boolean", label: "Show Times", defaultValue: true },
      },
      render: ({ showTimes }) => (
        <ScheduleTable showTimes={showTimes} />
      ),
    },

    GenerateSchedule: {
      fields: {
        algorithm: {
          type: "select",
          label: "Algorithm",
          options: [
            { label: "Optimised", value: "optimised" },
            { label: "Fast", value: "fast" },
          ],
          defaultValue: "optimised",
        },
      },
      render: ({ algorithm }) => (
        <GenerateSchedule algorithm={algorithm} />
      ),
    },

    RouteSummary: {
      fields: {
        showDistance: {
          type: "boolean",
          label: "Show Distance",
          defaultValue: true,
        },
      },
      render: ({ showDistance }) => (
        <RouteSummary showDistance={showDistance} />
      ),
    },
  },

  initialData: {
    content: [
      { type: "StaffSelector", props: { title: "Select Staff" } },
      { type: "MapVisualizer", props: { zoom: 12, showRoutes: true } },
      { type: "ScheduleTable", props: { showTimes: true } },
    ],
  },
};
