import EcommerceMetrics from "./components/ecommerce-metrics";
import MonthlySalesChart from "./components/monthly-saleschart";

import StatisticsChart from "./components/statistics-chart";
import MonthlyTarget from "./components/monthly-target";

import PageMeta from "../../components/common/pagemeta/PageMeta";

export default function Home() {
  return (
    <>
      <PageMeta
        title="Dashboard | TrackSend"
        description="TrackSend Dashboard"
      />
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 space-y-6 xl:col-span-7">
          <EcommerceMetrics />

          <MonthlySalesChart />
        </div>

        <div className="col-span-12 xl:col-span-5">
          <MonthlyTarget />
        </div>

        <div className="col-span-12">
          <StatisticsChart />
        </div>
      </div>
    </>
  );
}
