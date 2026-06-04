interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
}: PaginationProps) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (totalPages <= 1) return null;

  const handlePrevious = () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: 12,
        marginTop: 24,
        paddingTop: 20,
        paddingBottom: 8,
        borderTop: "1px solid var(--border)",
      }}
    >
      <button
        className="secondary-btn"
        onClick={handlePrevious}
        disabled={currentPage === 1}
        style={{ fontSize: 13, padding: "10px 16px" }}
        title="Página anterior"
      >
        ← Anterior
      </button>

      <span style={{ color: "var(--muted)", fontSize: 13, whiteSpace: "nowrap", minWidth: 140, textAlign: "center" }}>
        Página <strong style={{color: "var(--text)"}}>{currentPage}</strong> de <strong style={{color: "var(--text)"}}>{totalPages}</strong>
      </span>

      <button
        className="secondary-btn"
        onClick={handleNext}
        disabled={currentPage === totalPages}
        style={{ fontSize: 13, padding: "10px 16px" }}
        title="Siguiente página"
      >
        Siguiente →
      </button>
    </div>
  );
}
