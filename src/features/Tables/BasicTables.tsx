import PageBreadcrumb from "../../components/common/pagebread-crumb/PageBreadCrumb";
import ComponentCard from "../../components/common/component-card/ComponentCard";
import PageMeta from "../../components/common/pagemeta/PageMeta";
import BasicTableOne from "../../components/tables/BasicTables/BasicTableOne";
import CollapsibleTable from "../../components/tables/advance-table/Advancetabel";
import DataTable from "../../components/tables/pro-table";
// import OverView from "../../components/tables/syncfusion-ui/data-grid-tabel";

export default function BasicTables() {
  return (
    <>
      <PageMeta title="Tables | TrackSend" description="TrackSend Tables" />
      <PageBreadcrumb pageTitle=" Table" />
      <div className="space-y-6">
        <ComponentCard title=" Table">
          <BasicTableOne />
        </ComponentCard>
        <ComponentCard title=" Collapsible Table">
          <CollapsibleTable />
        </ComponentCard>

        <ComponentCard title=" Pro plus Table">
          <DataTable />
        </ComponentCard>
        {/* <ComponentCard title=" Pro plus Table">
           <OverView /> 
        </ComponentCard> */}
      </div>
    </>
  );
}
