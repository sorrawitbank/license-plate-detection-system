import { format } from "date-fns";
import type { ParkingLog } from "../../types/log";

interface Props {
  logs: ParkingLog[];
}

function ParkingLogTable(props: Props) {
  return (
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
      {/* body */}
      <tbody>
        {props.logs.map((log, index) => (
          <tr key={log.logId}>
            <th>{index + 1}</th>
            <td className="min-w-40 max-w-40 truncate">{log.detectedPlate}</td>
            <td>{log.eventType}</td>
            <td className="min-w-24 max-w-24 truncate">
              {log.fullName || "-"}
            </td>
            <td>{log.slotId || "-"}</td>
            <td>{log.slotCode || "-"}</td>
            <td>{log.confidence}</td>
            <td>{format(log.detectedAt, "dd MMMM yyyy HH:mm:ss")}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default ParkingLogTable;
