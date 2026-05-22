import { CircleX, SearchX } from "lucide-react";
import { ParkingLogPagination, ParkingLogTable } from "../features/log";
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
    searchInput,
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
  } = useGetLogs();

  return (
    <MainWithNavbar className="gap-4 items-center">
      <div className="flex flex-col gap-2 w-full md:flex-row md:justify-between ">
        <h3 className="style-headline-3">Log</h3>
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
            type="search"
            placeholder="Search log..."
            value={searchInput}
            onChange={handleKeywordChange}
            className="input input-secondary md:w-80 not-md:flex-1"
          />
        </div>
      </div>
      {isLoading ? (
        <div className="flex h-[507px]">
          <span className="loading loading-spinner loading-xl justify-center items-center text-accent" />
        </div>
      ) : logsError ? (
        <div className="flex flex-col justify-center items-center gap-2 h-[507px]">
          <CircleX className="size-8" />
          <span className="style-body-1">{logsError}</span>
        </div>
      ) : logs.length ? (
        <div className="w-full h-[507px] overflow-x-auto rounded-box border border-base-content/5 bg-base-100">
          <ParkingLogTable page={page} limit={limit} logs={logs} />
        </div>
      ) : (
        <div className="flex flex-col justify-center items-center gap-2 py-16 h-[507px]">
          <SearchX className="size-8" />
          <span className="style-body-1">No logs found.</span>
        </div>
      )}
      <span className="style-body-3 text-info">Total logs: {totalLogs}</span>
      <ParkingLogPagination
        page={page}
        totalPages={totalPages}
        canGoPrev={canGoPrev}
        canGoNext={canGoNext}
        goToPage={goToPage}
        goToNextPage={goToNextPage}
        goToPrevPage={goToPrevPage}
      />
    </MainWithNavbar>
  );
}

export default Log;
