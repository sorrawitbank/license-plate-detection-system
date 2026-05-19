import { format } from "date-fns";
import { CircleX, SearchX } from "lucide-react";
import useGetLogs from "../hooks/useGetLogs";
import MainWithNavbar from "../layout/MainWithNavbar";

function Log() {
  const {
    logs,
    eventType,
    page,
    limit,
    totalLogs,
    totalPages,
    isLoading,
    logsError,
    handleKeywordChange,
    handleEventTypeChange,
    canGoNext,
    canGoPrev,
    goToPage,
    goToNextPage,
    goToPrevPage,
    changeLimit,
  } = useGetLogs({});

  return (
    <MainWithNavbar className="gap-4 items-center">
      <div className="flex flex-col gap-2 w-full md:flex-row md:justify-between ">
        <h3 className="style-headline-3">Logs</h3>
        <div className="flex gap-2">
          <div className="flex gap-2 not-md:flex-1">
            <select
              value={limit}
              onChange={(event) => changeLimit(Number(event.target.value))}
              className="select select-accent flex-1 md:w-30 "
            >
              <option disabled={true}>Limit</option>
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
            <select
              value={eventType ?? "ALL"}
              onChange={handleEventTypeChange}
              className="select select-accent flex-1 md:w-30 "
            >
              <option disabled={true}>Event Type</option>
              <option value="ALL">ALL</option>
              <option value="IN">IN</option>
              <option value="OUT">OUT</option>
            </select>
          </div>

          <input
            type="text"
            placeholder="Search log..."
            onChange={handleKeywordChange}
            className="input input-secondary md:w-80 not-md:flex-1"
          />
        </div>
      </div>
      {isLoading ? (
        <div className="py-20">
          <span className="loading loading-spinner loading-xl text-accent" />
        </div>
      ) : logsError ? (
        <div className="flex flex-col justify-center items-center gap-2 h-full py-16">
          <CircleX className="size-8" />
          <span className="style-body-1">{logsError}</span>
        </div>
      ) : logs.length ? (
        <>
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
              {/* body */}
              <tbody>
                {logs.map((log, index) => (
                  <tr key={log.logId}>
                    <th>{index + 1}</th>
                    <td className="min-w-40 max-w-40 truncate">
                      {log.detectedPlate}
                    </td>
                    <td>{log.eventType}</td>
                    <td className="min-w-24 max-w-24 truncate">
                      {log.fullName}
                    </td>
                    <td>{log.slotId}</td>
                    <td>{log.slotCode}</td>
                    <td>{log.confidence}</td>
                    <td>{format(log.detectedAt, "dd MMMM yyyy HH:mm:ss")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <span className="style-body-3 text-info">
            Total logs: {totalLogs}
          </span>
        </>
      ) : (
        <div className="flex flex-col justify-center items-center gap-2 py-16">
          <SearchX className="size-8" />
          <span className="style-body-1">No logs found.</span>
        </div>
      )}
      <div className="join">
        {canGoPrev && (
          <button
            onClick={() => goToPrevPage()}
            className="join-item btn not-sm:btn-sm"
          >
            «
          </button>
        )}
        {page >= 4 && (
          <button
            onClick={() => goToPage(1)}
            className="join-item btn not-sm:btn-sm"
          >
            1
          </button>
        )}
        {page >= 5 && (
          <button className="join-item btn btn-disabled not-sm:btn-sm">
            ...
          </button>
        )}
        {page - 2 >= 1 && (
          <button
            onClick={() => goToPage(page - 2)}
            className="join-item btn not-sm:btn-sm"
          >
            {page - 2}
          </button>
        )}
        {page - 1 >= 1 && (
          <button
            onClick={() => goToPage(page - 1)}
            className="join-item btn not-sm:btn-sm"
          >
            {page - 1}
          </button>
        )}
        <button className="join-item btn btn-active not-sm:btn-sm">
          {page}
        </button>
        {page + 1 <= totalPages && (
          <button
            onClick={() => goToPage(page + 1)}
            className="join-item btn not-sm:btn-sm"
          >
            {page + 1}
          </button>
        )}
        {page + 2 <= totalPages && (
          <button
            onClick={() => goToPage(page + 2)}
            className="join-item btn not-sm:btn-sm"
          >
            {page + 2}
          </button>
        )}
        {page <= totalPages - 4 && (
          <button className="join-item btn btn-disabled not-sm:btn-sm">
            ...
          </button>
        )}
        {page <= totalPages - 3 && (
          <button
            onClick={() => goToPage(totalPages)}
            className="join-item btn not-sm:btn-sm"
          >
            {totalPages}
          </button>
        )}
        {canGoNext && (
          <button
            onClick={() => goToNextPage()}
            className="join-item btn not-sm:btn-sm"
          >
            »
          </button>
        )}
      </div>
    </MainWithNavbar>
  );
}

export default Log;
