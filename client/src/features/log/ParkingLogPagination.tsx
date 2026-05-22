interface Props {
  page: number;
  totalPages: number;
  canGoPrev: boolean;
  canGoNext: boolean;
  goToPage: (nextPage: number) => void;
  goToNextPage: () => void;
  goToPrevPage: () => void;
}

function ParkingLogPagination(props: Props) {
  return (
    <div className="join">
      {props.canGoPrev && (
        <button
          onClick={() => props.goToPrevPage()}
          className="join-item btn not-sm:btn-sm"
        >
          «
        </button>
      )}
      {props.page >= 4 && (
        <button
          onClick={() => props.goToPage(1)}
          className="join-item btn not-sm:btn-sm"
        >
          1
        </button>
      )}
      {props.page >= 5 && (
        <button className="join-item btn btn-disabled not-sm:btn-sm">
          ...
        </button>
      )}
      {props.page - 2 >= 1 && (
        <button
          onClick={() => props.goToPage(props.page - 2)}
          className="join-item btn not-sm:btn-sm"
        >
          {props.page - 2}
        </button>
      )}
      {props.page - 1 >= 1 && (
        <button
          onClick={() => props.goToPage(props.page - 1)}
          className="join-item btn not-sm:btn-sm"
        >
          {props.page - 1}
        </button>
      )}
      <button className="join-item btn btn-active not-sm:btn-sm">
        {props.page}
      </button>
      {props.page + 1 <= props.totalPages && (
        <button
          onClick={() => props.goToPage(props.page + 1)}
          className="join-item btn not-sm:btn-sm"
        >
          {props.page + 1}
        </button>
      )}
      {props.page + 2 <= props.totalPages && (
        <button
          onClick={() => props.goToPage(props.page + 2)}
          className="join-item btn not-sm:btn-sm"
        >
          {props.page + 2}
        </button>
      )}
      {props.page <= props.totalPages - 4 && (
        <button className="join-item btn btn-disabled not-sm:btn-sm">
          ...
        </button>
      )}
      {props.page <= props.totalPages - 3 && (
        <button
          onClick={() => props.goToPage(props.totalPages)}
          className="join-item btn not-sm:btn-sm"
        >
          {props.totalPages}
        </button>
      )}
      {props.canGoNext && (
        <button
          onClick={() => props.goToNextPage()}
          className="join-item btn not-sm:btn-sm"
        >
          »
        </button>
      )}
    </div>
  );
}

export default ParkingLogPagination;
