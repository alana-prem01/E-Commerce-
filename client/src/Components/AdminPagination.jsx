import React from 'react';

const AdminPagination = ({
  currentPage = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const handlePageClick = (page) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    onPageChange(page);
    // Scroll to top of window and admin main container
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    const adminMain = document.querySelector('.admin-dashboard-main');
    if (adminMain) {
      adminMain.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }
  };

  const startRecord = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  return (
    <div
      style={{
        padding: '16px 24px',
        borderTop: '1px solid var(--admin-border, #e5e7eb)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        backgroundColor: '#fff',
        borderBottomLeftRadius: '12px',
        borderBottomRightRadius: '12px'
      }}
    >
      <span style={{ color: 'var(--admin-text-muted, #6B7280)', fontSize: '0.875rem', fontWeight: 500 }}>
        Showing {startRecord}–{endRecord} of {totalItems} items
      </span>

      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        {/* Previous Button */}
        <button
          type="button"
          onClick={() => handlePageClick(currentPage - 1)}
          disabled={currentPage <= 1}
          style={{
            padding: '6px 14px',
            border: '1px solid #D1D5DB',
            borderRadius: '6px',
            backgroundColor: '#FFFFFF',
            color: currentPage <= 1 ? '#9CA3AF' : 'var(--admin-text-main, #1F2937)',
            cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
            fontSize: '0.875rem',
            fontWeight: 500,
            opacity: currentPage <= 1 ? 0.6 : 1,
            transition: 'all 0.15s ease'
          }}
        >
          Previous
        </button>

        {/* Page Number Buttons */}
        {pageNumbers.map((pageNum) => {
          const isActive = pageNum === currentPage;
          return (
            <button
              key={pageNum}
              type="button"
              onClick={() => handlePageClick(pageNum)}
              style={{
                minWidth: '34px',
                height: '34px',
                padding: '0 8px',
                border: isActive ? '1px solid var(--primary-color, #046a5a)' : '1px solid #D1D5DB',
                borderRadius: '6px',
                backgroundColor: isActive ? 'var(--primary-color, #046a5a)' : '#FFFFFF',
                color: isActive ? '#FFFFFF' : 'var(--admin-text-main, #1F2937)',
                cursor: isActive ? 'default' : 'pointer',
                fontSize: '0.875rem',
                fontWeight: isActive ? 600 : 400,
                transition: 'all 0.15s ease'
              }}
            >
              {pageNum}
            </button>
          );
        })}

        {/* Next Button */}
        <button
          type="button"
          onClick={() => handlePageClick(currentPage + 1)}
          disabled={currentPage >= totalPages}
          style={{
            padding: '6px 14px',
            border: '1px solid #D1D5DB',
            borderRadius: '6px',
            backgroundColor: '#FFFFFF',
            color: currentPage >= totalPages ? '#9CA3AF' : 'var(--admin-text-main, #1F2937)',
            cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
            fontSize: '0.875rem',
            fontWeight: 500,
            opacity: currentPage >= totalPages ? 0.6 : 1,
            transition: 'all 0.15s ease'
          }}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default AdminPagination;
