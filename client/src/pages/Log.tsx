import { format } from "date-fns";
import logs from "../data/logs";
import MainWithNavbar from "../layout/MainWithNavbar";

function Log() {
  return (
    <MainWithNavbar className="gap-4 items-center">
      <div className="flex justify-between w-full">
        <h3 className="style-headline-3">Detection Logs</h3>
        <input
          type="text"
          placeholder="Search log..."
          className="input input-secondary"
        />
      </div>
      <div className="w-full overflow-x-auto rounded-box border border-base-content/5 bg-base-100">
        <table className="table whitespace-nowrap">
          {/* head */}
          <thead>
            <tr>
              <th>No.</th>
              <th>Detected Plate</th>
              <th>Event Type</th>
              <th>Full Name</th>
              <th>Slot No</th>
              <th>Slot Code</th>
              <th>Conf</th>
              <th>Detected At</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, index) => (
              <tr key={log.logId}>
                <th>{index + 1}</th>
                <td>{log.detectedPlate}</td>
                <td>{log.eventType}</td>
                <td>{log.fullName}</td>
                <td>{log.slotId}</td>
                <td>{log.slotCode}</td>
                <td>{log.confidence}</td>
                <td>{format(log.detectedAt, "dd MMMM yyyy HH:mm:ss")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </MainWithNavbar>
  );
}

export default Log;
