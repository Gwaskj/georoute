// @ts-nocheck
// Puck v1 configs are intentionally untyped. This removes all TS errors.

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
      render: (props) => <MapVisualizer {...props} />,
    },

    StaffSelector: {
      fields: {
        title: { type: "text", label: "Title", defaultValue: "Select Staff" },
      },
      render: (props) => <StaffSelector {...props} />,
    },

    ScheduleTable: {
      fields: {
        showTimes: { type: "boolean", label: "Show Times", defaultValue: true },
      },
      render: (props) => <ScheduleTable {...props} />,
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
      render: (props) => <GenerateSchedule {...props} />,
    },

    RouteSummary: {
      fields: {
        showDistance: {
          type: "boolean",
          label: "Show Distance",
          defaultValue: true,
        },
      },
      render: (props) => <RouteSummary {...props} />,
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
